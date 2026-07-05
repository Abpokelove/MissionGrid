const asyncHandler = require('express-async-handler');
const Objective = require('../models/Objective');
const Mission = require('../models/Mission');
const { recalcMission } = require('./missionController');
const { ensureRequestWorkspace } = require('../utils/workspaceRepair');

const isProjectManager = (user) => user?.role === 'Captain' || user?.role === 'Project Manager' || user?.role === 'ProjectManager';
const isTeamMember = (user) => user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';

const getId = (value) => (typeof value === 'object' ? value?._id : value);

const isOwnObjective = (objective, userId) => {
  const normalizedUserId = userId.toString();
  if (Array.isArray(objective.assignees)) {
    const assigneeIds = objective.assignees
      .map((assignee) => getId(assignee)?.toString())
      .filter(Boolean);
    return assigneeIds.includes(normalizedUserId);
  }

  return getId(objective.assignedTo)?.toString() === normalizedUserId;
};

const assignmentFilter = (userId) => ({
  $or: [
    { assignees: userId },
    {
      $and: [
        { assignees: { $exists: false } },
        { assignedTo: userId },
      ],
    },
  ],
});

const normalizeAssigneeIds = (value) => {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(
    raw
      .map((item) => getId(item))
      .filter(Boolean)
      .map((item) => item.toString())
  )];
};

const populateObjectiveUsers = (query) =>
  query
    .populate('assignedTo', 'name email avatar')
    .populate('assignees', 'name email avatar');

const captainOnly = async (req, res) => {
  if (!isProjectManager(req.user)) {
    res.status(403);
    throw new Error('Only Project Managers can manage objectives');
  }

  const workspace = await ensureRequestWorkspace(req);
  if (!workspace) {
    res.status(400);
    throw new Error('Workspace could not be prepared for this account. Sign out and back in, then retry.');
  }

  return workspace;
};

const missionAccessFilter = (req, missionId) => {
  if (req.user.workspace) {
    return { _id: missionId, workspace: req.user.workspace };
  }

  return {
    _id: missionId,
    $or: [{ createdBy: req.user._id }, { crew: req.user._id }],
  };
};

const scopedObjectiveFilter = (req, extra = {}) => ({
  ...(req.user.workspace ? { workspace: req.user.workspace } : assignmentFilter(req.user._id)),
  ...extra,
});

const applyStatusProgressRules = (objective, updates) => {
  const updatedFields = { ...updates };

  if (updatedFields.progress !== undefined) {
    updatedFields.progress = Math.min(100, Math.max(0, Number(updatedFields.progress) || 0));
  }

  if (updatedFields.status) {
    switch (updatedFields.status) {
      case 'Backlog':
        updatedFields.progress = 0;
        break;
      case 'To Do':
        updatedFields.progress = Math.max(updatedFields.progress ?? objective.progress, 5);
        break;
      case 'In Progress':
        updatedFields.progress = Math.max(updatedFields.progress ?? objective.progress, 25);
        break;
      case 'Review':
        updatedFields.progress = Math.max(updatedFields.progress ?? objective.progress, 75);
        break;
      case 'Completed':
        updatedFields.progress = 100;
        break;
      default:
        break;
    }
  }

  if (updatedFields.isBlocked === false) {
    updatedFields.blockerReason = '';
  }

  return updatedFields;
};

// @desc    Get objectives for a mission
// @route   GET /api/objectives/mission/:missionId
// @access  Private
const getObjectives = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const mission = await Mission.findOne(missionAccessFilter(req, req.params.missionId));

  if (!mission) {
    res.status(404);
    throw new Error('Mission not found');
  }

  const objectives = await Objective.find(scopedObjectiveFilter(req, {
    missionId: req.params.missionId,
    ...(isTeamMember(req.user) ? assignmentFilter(req.user._id) : {}),
  }))
    .populate('assignedTo', 'name email avatar')
    .populate('assignees', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json(objectives);
});

// @desc    Get objectives assigned to current user
// @route   GET /api/objectives/my
// @access  Private
const getMyObjectives = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const objectives = await Objective.find(scopedObjectiveFilter(req, assignmentFilter(req.user._id)))
    .populate('assignedTo', 'name email avatar')
    .populate('assignees', 'name email avatar')
    .populate('missionId', 'title status priority deadline progress coreStability')
    .sort({ deadline: 1, updatedAt: -1 });

  res.json(objectives);
});

// @desc    Get single objective
// @route   GET /api/objectives/:id
// @access  Private
const getObjective = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const objective = await populateObjectiveUsers(
    Objective.findOne(scopedObjectiveFilter(req, { _id: req.params.id }))
  );

  if (!objective) {
    res.status(404);
    throw new Error('Objective not found');
  }

  if (isTeamMember(req.user) && !isOwnObjective(objective, req.user._id)) {
    res.status(403);
    throw new Error('You can view only objectives assigned to you');
  }

  res.json(objective);
});

// @desc    Create a new objective
// @route   POST /api/objectives
// @access  Private
const createObjective = asyncHandler(async (req, res) => {
  const workspace = await captainOnly(req, res);

  const {
    missionId,
    title,
    description,
    assignedTo,
    assignees,
    priority,
    status,
    deadline,
  } = req.body;

  if (!missionId || !title) {
    res.status(400);
    throw new Error('Mission ID and objective title are required');
  }

  const mission = await Mission.findOne({ _id: missionId, workspace: workspace._id });
  if (!mission) {
    res.status(404);
    throw new Error('Mission not found');
  }

  const selectedAssignees = normalizeAssigneeIds(assignees !== undefined ? assignees : assignedTo);

  const objective = await Objective.create({
    missionId,
    workspace: workspace._id,
    title,
    description: description || '',
    assignedTo: selectedAssignees[0] || null,
    assignees: selectedAssignees,
    priority: priority || 'Medium',
    status: status || 'Backlog',
    progress: 0,
    deadline: deadline || null,
  });

  // Recalculate mission progress & stability
  await recalcMission(missionId);

  const populated = await populateObjectiveUsers(Objective.findById(objective._id));

  res.status(201).json(populated);
});

// @desc    Update an objective
// @route   PUT /api/objectives/:id
// @access  Private
const updateObjective = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const objective = await Objective.findOne(scopedObjectiveFilter(req, { _id: req.params.id }));

  if (!objective) {
    res.status(404);
    throw new Error('Objective not found');
  }

  if (isTeamMember(req.user) && !isOwnObjective(objective, req.user._id)) {
    res.status(403);
    throw new Error('You can update only objectives assigned to you');
  }

  const allowedFields = isProjectManager(req.user)
    ? [
        'title', 'description', 'assignedTo', 'priority',
        'assignees', 'status', 'progress', 'deadline', 'isBlocked', 'blockerReason',
      ]
    : ['status', 'progress'];

  const updatedFields = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updatedFields[field] = req.body[field];
    }
  });

  const normalizedUpdates = applyStatusProgressRules(objective, updatedFields);
  if (isProjectManager(req.user) && (updatedFields.assignees !== undefined || updatedFields.assignedTo !== undefined)) {
    const selectedAssignees = normalizeAssigneeIds(
      updatedFields.assignees !== undefined ? updatedFields.assignees : updatedFields.assignedTo
    );
    normalizedUpdates.assignees = selectedAssignees;
    normalizedUpdates.assignedTo = selectedAssignees[0] || null;
  }

  const updated = await populateObjectiveUsers(
    Objective.findOneAndUpdate(scopedObjectiveFilter(req, { _id: req.params.id }), normalizedUpdates, { new: true })
  );

  // Recalculate parent mission
  await recalcMission(objective.missionId);

  res.json(updated);
});

// @desc    Delete an objective
// @route   DELETE /api/objectives/:id
// @access  Private
const deleteObjective = asyncHandler(async (req, res) => {
  const workspace = await captainOnly(req, res);

  const objective = await Objective.findOne({ _id: req.params.id, workspace: workspace._id });

  if (!objective) {
    res.status(404);
    throw new Error('Objective not found');
  }

  const missionId = objective.missionId;
  await Objective.deleteOne({ _id: req.params.id, workspace: workspace._id });

  // Recalculate parent mission
  await recalcMission(missionId);

  res.json({ message: 'Objective deleted' });
});

module.exports = { getObjectives, getMyObjectives, getObjective, createObjective, updateObjective, deleteObjective };
