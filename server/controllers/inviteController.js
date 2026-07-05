const asyncHandler = require('express-async-handler');
const Workspace = require('../models/Workspace');
const { generateUniqueInviteCode } = require('../utils/inviteCode');

const publicInvitePayload = (workspace) => ({
  inviteCode: workspace.inviteCode,
  teamName: workspace.name,
  ownerName: workspace.owner?.name || 'Project Manager',
});

// @desc    Get public invite details
// @route   GET /api/invites/:inviteCode
// @access  Public
const getInvite = asyncHandler(async (req, res) => {
  const inviteCode = String(req.params.inviteCode || '').trim().toUpperCase();
  const workspace = await Workspace.findOne({ inviteCode }).populate('owner', 'name');

  if (!workspace) {
    res.status(404);
    throw new Error('Invite code was not found');
  }

  res.json(publicInvitePayload(workspace));
});

// @desc    Regenerate the current Captain workspace invite code
// @route   POST /api/invites/regenerate
// @access  Private/Captain
const regenerateInvite = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.user.workspace).populate('owner', 'name');

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  workspace.inviteCode = await generateUniqueInviteCode();
  await workspace.save();

  res.json(publicInvitePayload(workspace));
});

module.exports = { getInvite, regenerateInvite };
