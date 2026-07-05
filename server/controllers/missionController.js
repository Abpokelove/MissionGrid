const asyncHandler = require('express-async-handler');
const Mission = require('../models/Mission');
const Objective = require('../models/Objective');
const { ensureRequestWorkspace } = require('../utils/workspaceRepair');

const isProjectManager = (user) => user?.role === 'Captain' || user?.role === 'Project Manager' || user?.role === 'ProjectManager';
const isTeamMember = (user) => user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';

const captainOnly = async (req, res) => {
  if (!isProjectManager(req.user)) {
    res.status(403);
    throw new Error('Only Project Managers can change missions');
  }

  const workspace = await ensureRequestWorkspace(req);
  if (!workspace) {
    res.status(400);
    throw new Error('Workspace could not be prepared for this account. Sign out and back in, then retry.');
  }

  return workspace;
};

const missionScope = (req, extra = {}) => {
  if (req.user.workspace) {
    return { workspace: req.user.workspace, ...extra };
  }

  return {
    $or: [{ createdBy: req.user._id }, { crew: req.user._id }],
    ...extra,
  };
};

const assignmentFilter = (userId) => ({
  $or: [{ assignedTo: userId }, { assignees: userId }],
});

const objectiveAssigneeIds = (objective) => {
  if (objective.assignees?.length) return objective.assignees;
  return objective.assignedTo ? [objective.assignedTo] : [];
};

// Helper: Recalculate mission progress and core stability from its objectives
const recalcMission = async (missionId) => {
  const objectives = await Objective.find({ missionId });

  if (objectives.length === 0) {
    await Mission.findByIdAndUpdate(missionId, { progress: 0, coreStability: 100 });
    return;
  }

  // Progress: average of all objective progress values
  const totalProgress = objectives.reduce((sum, o) => sum + o.progress, 0);
  const progress = Math.round(totalProgress / objectives.length);

  // Core Stability calculation
  const now = new Date();
  const overdueCount = objectives.filter(
    (o) => o.deadline && new Date(o.deadline) < now && o.status !== 'Completed'
  ).length;
  const blockedCount = objectives.filter((o) => o.isBlocked).length;
  const total = objectives.length;

  const overdueRatio = overdueCount / total;
  const blockerRatio = blockedCount / total;

  // Workload balance: std deviation of objectives per assignee
  const assigneeCounts = {};
  objectives.forEach((o) => {
    objectiveAssigneeIds(o).forEach((assigneeId) => {
      const key = assigneeId.toString();
      assigneeCounts[key] = (assigneeCounts[key] || 0) + 1;
    });
  });

  const counts = Object.values(assigneeCounts);
  let workloadScore = 100;
  if (counts.length > 1) {
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    const stddev = Math.sqrt(variance);
    workloadScore = Math.max(0, Math.min(100, 100 - (stddev / Math.max(mean, 1)) * 100));
  }

  // Weighted score
  const coreStability = Math.round(
    progress * 0.4 +
    (1 - overdueRatio) * 100 * 0.25 +
    (1 - blockerRatio) * 100 * 0.2 +
    workloadScore * 0.15
  );

  await Mission.findByIdAndUpdate(missionId, {
    progress: Math.min(100, Math.max(0, progress)),
    coreStability: Math.min(100, Math.max(0, coreStability)),
  });
};

// @desc    Get all missions for current user
// @route   GET /api/missions
// @access  Private
const getMissions = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const missions = await Mission.find(missionScope(req))
    .populate('createdBy', 'name email avatar')
    .populate('crew', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json(missions);
});

// @desc    Get single mission
// @route   GET /api/missions/:id
// @access  Private
const getMission = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const mission = await Mission.findOne(missionScope(req, { _id: req.params.id }))
    .populate('createdBy', 'name email avatar')
    .populate('crew', 'name email avatar');

  if (!mission) {
    res.status(404);
    throw new Error('Mission not found');
  }

  // Also fetch objectives for this mission
  const objectiveFilter = {
    missionId: mission._id,
    ...(req.user.workspace ? { workspace: req.user.workspace } : {}),
    ...(isTeamMember(req.user) ? assignmentFilter(req.user._id) : {}),
  };

  const objectives = await Objective.find(objectiveFilter)
    .populate('assignedTo', 'name email avatar')
    .populate('assignees', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json({ mission, objectives });
});

// @desc    Create a new mission
// @route   POST /api/missions
// @access  Private
const createMission = asyncHandler(async (req, res) => {
  const workspace = await captainOnly(req, res);

  const { title, description, category, priority, status, startDate, deadline, crew } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Mission title is required');
  }

  const mission = await Mission.create({
    title,
    description: description || '',
    category: category || 'Other',
    priority: priority || 'Medium',
    status: status || 'Planning',
    startDate: startDate || Date.now(),
    deadline,
    crew: crew || [],
    workspace: workspace._id,
    createdBy: req.user._id,
  });

  const populated = await Mission.findById(mission._id)
    .populate('createdBy', 'name email avatar')
    .populate('crew', 'name email avatar');

  res.status(201).json(populated);
});

// @desc    Update a mission
// @route   PUT /api/missions/:id
// @access  Private
const updateMission = asyncHandler(async (req, res) => {
  const workspace = await captainOnly(req, res);

  const mission = await Mission.findOne({ _id: req.params.id, workspace: workspace._id });

  if (!mission) {
    res.status(404);
    throw new Error('Mission not found');
  }

  const updatedFields = {};
  const allowedFields = ['title', 'description', 'category', 'priority', 'status', 'startDate', 'deadline', 'crew'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updatedFields[field] = req.body[field];
    }
  });

  const updated = await Mission.findOneAndUpdate(
    { _id: req.params.id, workspace: workspace._id },
    updatedFields,
    { new: true }
  )
    .populate('createdBy', 'name email avatar')
    .populate('crew', 'name email avatar');

  res.json(updated);
});

// @desc    Delete a mission
// @route   DELETE /api/missions/:id
// @access  Private
const deleteMission = asyncHandler(async (req, res) => {
  const workspace = await captainOnly(req, res);

  const mission = await Mission.findOne({ _id: req.params.id, workspace: workspace._id });

  if (!mission) {
    res.status(404);
    throw new Error('Mission not found');
  }

  // Cascade: delete all objectives for this mission
  await Objective.deleteMany({ missionId: req.params.id, workspace: workspace._id });
  await Mission.deleteOne({ _id: req.params.id, workspace: workspace._id });

  res.json({ message: 'Mission and its objectives deleted' });
});

module.exports = { getMissions, getMission, createMission, updateMission, deleteMission, recalcMission };
