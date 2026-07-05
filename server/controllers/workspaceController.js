const asyncHandler = require('express-async-handler');
const Workspace = require('../models/Workspace');
const { ensureRequestWorkspace } = require('../utils/workspaceRepair');

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

  const origin = req.get('origin') || process.env.CLIENT_URL?.split(',')?.[0] || 'http://localhost:5173';

  res.json({
    _id: workspace._id,
    name: workspace.name,
    owner: workspace.owner,
    members: workspace.members,
    role: req.user.role,
    inviteCode: req.user.role === 'Captain' ? workspace.inviteCode : undefined,
    inviteLink: req.user.role === 'Captain' ? `${origin}/join/${workspace.inviteCode}` : undefined,
    createdAt: workspace.createdAt,
  });
});

module.exports = { getMyWorkspace };
