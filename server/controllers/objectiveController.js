const asyncHandler = require('express-async-handler');
const Objective = require('../models/Objective');
const Mission = require('../models/Mission');
const { recalcMission } = require('./missionController');
const { ensureRequestWorkspace } = require('../utils/workspaceRepair');

const isOwnObjective = (objective, userId) =>
  objective.assignedTo && objective.assignedTo.toString() === userId.toString();

const captainOnly = async (req, res) => {
  if (req.user.role !== 'Captain') {
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
  ...(req.user.workspace ? { workspace: req.user.workspace } : { assignedTo: req.user._id }),
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
    ...(req.user.role === 'Crew' ? { assignedTo: req.user._id } : {}),
  }))
    .populate('assignedTo', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json(objectives);
});

// @desc    Get objectives assigned to current user
// @route   GET /api/objectives/my
// @access  Private
const getMyObjectives = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const objectives = await Objective.find(scopedObjectiveFilter(req, { assignedTo: req.user._id }))
    .populate('assignedTo', 'name email avatar')
    .populate('missionId', 'title status priority deadline progress coreStability')
    .sort({ deadline: 1, updatedAt: -1 });

  res.json(objectives);
});

// @desc    Get single objective
// @route   GET /api/objectives/:id
// @access  Private
const getObjective = asyncHandler(async (req, res) => {
  await ensureRequestWorkspace(req);

  const objective = await Objective.findOne(scopedObjectiveFilter(req, { _id: req.params.id }))
    .populate('assignedTo', 'name email avatar');

  if (!objective) {
    res.status(404);
    throw new Error('Objective not found');
  }

  if (req.user.role === 'Crew' && !isOwnObjective(objective, req.user._id)) {
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

  const objective = await Objective.create({
    missionId,
    workspace: workspace._id,
    title,
    description: description || '',
    assignedTo: assignedTo || null,
    priority: priority || 'Medium',
    status: status || 'Backlog',
    progress: 0,
    deadline: deadline || null,
  });

  // Recalculate mission progress & stability
  await recalcMission(missionId);

  const populated = await Objective.findById(objective._id)
    .populate('assignedTo', 'name email avatar');

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

  if (req.user.role === 'Crew' && !isOwnObjective(objective, req.user._id)) {
    res.status(403);
    throw new Error('You can update only objectives assigned to you');
  }

  const allowedFields = req.user.role === 'Captain'
    ? [
        'title', 'description', 'assignedTo', 'priority',
        'status', 'progress', 'deadline', 'isBlocked', 'blockerReason',
      ]
    : ['status', 'progress'];

  const updatedFields = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updatedFields[field] = req.body[field];
    }
  });

  const normalizedUpdates = applyStatusProgressRules(objective, updatedFields);

  const updated = await Objective.findOneAndUpdate(scopedObjectiveFilter(req, { _id: req.params.id }), normalizedUpdates, { new: true })
    .populate('assignedTo', 'name email avatar');

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
