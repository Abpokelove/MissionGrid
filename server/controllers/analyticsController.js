const asyncHandler = require('express-async-handler');
const Mission = require('../models/Mission');
const Objective = require('../models/Objective');

const missionScope = (req, extra = {}) => {
  if (req.user.workspace) {
    return { workspace: req.user.workspace, ...extra };
  }

  return {
    $or: [{ createdBy: req.user._id }, { crew: req.user._id }],
    ...extra,
  };
};

const objectiveScope = (req, missionIds, extra = {}) => ({
  missionId: { $in: missionIds },
  ...(req.user.workspace ? { workspace: req.user.workspace } : {}),
  ...(req.user.role === 'Crew' ? { assignedTo: req.user._id } : {}),
  ...extra,
});

// @desc    Get dashboard stats
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const missions = await Mission.find(missionScope(req));

  const missionIds = missions.map((m) => m._id);

  const objectives = await Objective.find(objectiveScope(req, missionIds));

  const now = new Date();

  const totalMissions = missions.length;
  const activeMissions = missions.filter((m) => m.status === 'Active').length;
  const completedMissions = missions.filter((m) => m.status === 'Completed').length;
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter((o) => o.status === 'Completed').length;
  const inProgressObjectives = objectives.filter((o) => o.status === 'In Progress').length;
  const blockedObjectives = objectives.filter((o) => o.isBlocked).length;
  const overdueObjectives = objectives.filter(
    (o) => o.deadline && new Date(o.deadline) < now && o.status !== 'Completed'
  ).length;

  const completionRate = totalObjectives > 0
    ? Math.round((completedObjectives / totalObjectives) * 100)
    : 0;

  // Average core stability across active missions
  const activeMissionsList = missions.filter((m) => m.status === 'Active' || m.status === 'Planning');
  const avgCoreStability = activeMissionsList.length > 0
    ? Math.round(activeMissionsList.reduce((sum, m) => sum + m.coreStability, 0) / activeMissionsList.length)
    : 100;

  // Recent objectives (last 5 updated)
  const recentObjectives = await Objective.find(objectiveScope(req, missionIds))
    .populate('assignedTo', 'name avatar')
    .populate('missionId', 'title')
    .sort({ updatedAt: -1 })
    .limit(5);

  res.json({
    totalMissions,
    activeMissions,
    completedMissions,
    totalObjectives,
    completedObjectives,
    inProgressObjectives,
    blockedObjectives,
    overdueObjectives,
    completionRate,
    avgCoreStability,
    recentObjectives,
    missions: missions.map((m) => ({
      _id: m._id,
      title: m.title,
      progress: m.progress,
      coreStability: m.coreStability,
      status: m.status,
      priority: m.priority,
      deadline: m.deadline,
    })),
  });
});

// @desc    Get mission progress breakdown
// @route   GET /api/analytics/mission/:id/progress
// @access  Private
const getMissionProgress = asyncHandler(async (req, res) => {
  const mission = await Mission.findOne(missionScope(req, { _id: req.params.id }));
  if (!mission) {
    res.status(404);
    throw new Error('Mission not found');
  }

  const objectives = await Objective.find(objectiveScope(req, [req.params.id]));

  const statusBreakdown = {
    Backlog: 0,
    'To Do': 0,
    'In Progress': 0,
    Review: 0,
    Completed: 0,
  };

  objectives.forEach((o) => {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
  });

  const total = objectives.length;
  const avgProgress = total > 0
    ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / total)
    : 0;

  res.json({ statusBreakdown, total, avgProgress });
});

// @desc    Get core stability for a mission
// @route   GET /api/analytics/core-stability/:missionId
// @access  Private
const getCoreStability = asyncHandler(async (req, res) => {
  const mission = await Mission.findOne(missionScope(req, { _id: req.params.missionId }));
  if (!mission) {
    res.status(404);
    throw new Error('Mission not found');
  }

  const objectives = await Objective.find(objectiveScope(req, [req.params.missionId]));
  const now = new Date();

  const total = objectives.length;
  if (total === 0) {
    return res.json({ coreStability: 100, factors: {} });
  }

  const overdueCount = objectives.filter(
    (o) => o.deadline && new Date(o.deadline) < now && o.status !== 'Completed'
  ).length;
  const blockedCount = objectives.filter((o) => o.isBlocked).length;

  res.json({
    coreStability: mission.coreStability,
    factors: {
      progress: mission.progress,
      overdueCount,
      blockedCount,
      totalObjectives: total,
      overdueRatio: Math.round((overdueCount / total) * 100),
      blockerRatio: Math.round((blockedCount / total) * 100),
    },
  });
});

// @desc    Get workload per crew member
// @route   GET /api/analytics/workload
// @access  Private
const getWorkload = asyncHandler(async (req, res) => {
  const missions = await Mission.find(missionScope(req));

  const missionIds = missions.map((m) => m._id);

  const objectives = await Objective.find(objectiveScope(req, missionIds, {
    status: { $ne: 'Completed' },
  })).populate('assignedTo', 'name email avatar');

  // Group by assignee
  const workloadMap = {};

  objectives.forEach((o) => {
    if (o.assignedTo) {
      const key = o.assignedTo._id.toString();
      if (!workloadMap[key]) {
        workloadMap[key] = {
          user: {
            _id: o.assignedTo._id,
            name: o.assignedTo.name,
            email: o.assignedTo.email,
            avatar: o.assignedTo.avatar,
          },
          activeCount: 0,
          blockedCount: 0,
          overdueCount: 0,
          objectives: [],
        };
      }
      workloadMap[key].activeCount++;
      if (o.isBlocked) workloadMap[key].blockedCount++;
      if (o.deadline && new Date(o.deadline) < new Date() && o.status !== 'Completed') {
        workloadMap[key].overdueCount++;
      }
      workloadMap[key].objectives.push({
        _id: o._id,
        title: o.title,
        priority: o.priority,
        status: o.status,
        isBlocked: o.isBlocked,
      });
    }
  });

  const workload = Object.values(workloadMap).sort((a, b) => b.activeCount - a.activeCount);

  // Suggestions: reassign from most loaded to least loaded
  const suggestions = [];
  if (workload.length >= 2) {
    const maxLoaded = workload[0];
    const minLoaded = workload[workload.length - 1];

    if (maxLoaded.activeCount - minLoaded.activeCount >= 2) {
      suggestions.push({
        type: 'rebalance',
        from: maxLoaded.user,
        to: minLoaded.user,
        fromCount: maxLoaded.activeCount,
        toCount: minLoaded.activeCount,
        message: `${maxLoaded.user.name} has ${maxLoaded.activeCount} active objectives while ${minLoaded.user.name} has ${minLoaded.activeCount}. Consider reassigning.`,
      });
    }
  }

  res.json({ workload, suggestions });
});

// @desc    Get overdue objectives
// @route   GET /api/analytics/overdue
// @access  Private
const getOverdue = asyncHandler(async (req, res) => {
  const missions = await Mission.find(missionScope(req));

  const missionIds = missions.map((m) => m._id);
  const now = new Date();

  const overdue = await Objective.find(objectiveScope(req, missionIds, {
    deadline: { $lt: now },
    status: { $ne: 'Completed' },
  }))
    .populate('assignedTo', 'name avatar')
    .populate('missionId', 'title')
    .sort({ deadline: 1 });

  res.json(overdue);
});

// @desc    Get comet alerts (deadline danger detection)
// @route   GET /api/analytics/comet-alerts
// @access  Private
const getCometAlerts = asyncHandler(async (req, res) => {
  const missions = await Mission.find(missionScope(req, {
    status: { $in: ['Active', 'Planning'] },
  }));

  const missionIds = missions.map((m) => m._id);
  const now = new Date();
  const alerts = [];

  // Mission-level comet alerts are manager-facing. Team members get alerts for assigned objectives.
  if (req.user.role === 'Captain') {
    for (const mission of missions) {
      if (!mission.deadline) continue;

      const daysLeft = Math.ceil((new Date(mission.deadline) - now) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0 && mission.progress < 100) {
        alerts.push({
          type: 'mission',
          stage: 3,
          id: mission._id,
          title: mission.title,
          daysLeft,
          progress: mission.progress,
          message: `Mission "${mission.title}" is overdue with ${mission.progress}% mission energy.`,
          severity: 'critical',
        });
      } else if (daysLeft <= 7 && mission.progress < 50) {
        alerts.push({
          type: 'mission',
          stage: 3,
          id: mission._id,
          title: mission.title,
          daysLeft,
          progress: mission.progress,
          message: `Mission "${mission.title}" has ${daysLeft} days left with ${mission.progress}% mission energy.`,
          severity: 'critical',
        });
      } else if (daysLeft <= 14 && mission.progress < 40) {
        alerts.push({
          type: 'mission',
          stage: 2,
          id: mission._id,
          title: mission.title,
          daysLeft,
          progress: mission.progress,
          message: `Mission "${mission.title}" has a deadline risk. Consider accelerating.`,
          severity: 'warning',
        });
      } else if (daysLeft <= 21 && mission.progress < 30) {
        alerts.push({
          type: 'mission',
          stage: 1,
          id: mission._id,
          title: mission.title,
          daysLeft,
          progress: mission.progress,
          message: `Mission "${mission.title}" is showing early deadline risk.`,
          severity: 'caution',
        });
      }
    }
  }

  // Objective-level alerts
  const objectives = await Objective.find(objectiveScope(req, missionIds, {
    deadline: { $ne: null },
    status: { $ne: 'Completed' },
  })).populate('missionId', 'title');

  for (const obj of objectives) {
    const daysLeft = Math.ceil((new Date(obj.deadline) - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 3 && obj.progress < 50) {
      alerts.push({
        type: 'objective',
        stage: 3,
        id: obj._id,
        title: obj.title,
        missionTitle: obj.missionId?.title,
        daysLeft,
        progress: obj.progress,
        message: `Objective "${obj.title}" is critically behind schedule.`,
        severity: 'critical',
        isBlocked: obj.isBlocked,
      });
    }
  }

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, warning: 1, caution: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  res.json(alerts);
});

module.exports = {
  getDashboardStats,
  getMissionProgress,
  getCoreStability,
  getWorkload,
  getOverdue,
  getCometAlerts,
};
