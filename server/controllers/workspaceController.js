const asyncHandler = require('express-async-handler');
const Workspace = require('../models/Workspace');
const { ensureRequestWorkspace } = require('../utils/workspaceRepair');
const { generateUniqueInviteCode } = require('../utils/inviteCode');

const isProjectManager = (user) => user?.role === 'Captain' || user?.role === 'Project Manager' || user?.role === 'ProjectManager';

const workspacePayload = (req, workspace) => {
  const origin = req.get('origin') || process.env.CLIENT_URL?.split(',')?.[0] || 'http://localhost:5173';
  const canInvite = isProjectManager(req.user);

  return {
    workspace: {
      _id: workspace._id,
      name: workspace.name,
      owner: workspace.owner,
      members: workspace.members,
      createdAt: workspace.createdAt,
    },
    _id: workspace._id,
    name: workspace.name,
    owner: workspace.owner,
    members: workspace.members,
    role: req.user.role,
    inviteCode: canInvite ? workspace.inviteCode : undefined,
    inviteLink: canInvite ? `${origin}/join/${workspace.inviteCode}` : undefined,
    createdAt: workspace.createdAt,
  };
};

// @desc    Get the current user's workspace
// @route   GET /api/workspace/me
// @access  Private
const getMyWorkspace = asyncHandler(async (req, res) => {
  const ensuredWorkspace = await ensureRequestWorkspace(req);

  if (!ensuredWorkspace) {
    res.status(404);
    throw new Error('No workspace is attached to this Team Member account. Join with a Project Manager invite.');
  }

  const workspace = await Workspace.findById(ensuredWorkspace._id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email role avatar');

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  res.json(workspacePayload(req, workspace));
});

// @desc    Regenerate the current Project Manager workspace invite code
// @route   POST /api/workspace/regenerate-invite
// @access  Private/Project Manager
const regenerateInvite = asyncHandler(async (req, res) => {
  if (!isProjectManager(req.user)) {
    res.status(403);
    throw new Error('Only Project Managers can regenerate invite codes');
  }

  const ensuredWorkspace = await ensureRequestWorkspace(req);
  if (!ensuredWorkspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  const workspace = await Workspace.findById(ensuredWorkspace._id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email role avatar');

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  workspace.inviteCode = await generateUniqueInviteCode();
  await workspace.save();

  res.json(workspacePayload(req, workspace));
});

module.exports = { getMyWorkspace, regenerateInvite };
