const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Mission = require('../models/Mission');
const Objective = require('../models/Objective');
const { generateUniqueInviteCode } = require('./inviteCode');

const getWorkspaceId = (workspace) => {
  if (!workspace) return null;
  if (typeof workspace === 'object' && workspace._id) return workspace._id;
  return workspace;
};

const includesMember = (members = [], userId) =>
  members.some((member) => member?.toString() === userId.toString());

const normalizeWorkspace = async (workspace, user) => {
  if (!workspace) return null;

  let changed = false;

  if (!workspace.inviteCode) {
    workspace.inviteCode = await generateUniqueInviteCode();
    changed = true;
  }

  if (user?._id && !includesMember(workspace.members, user._id)) {
    workspace.members.push(user._id);
    changed = true;
  }

  if (changed) {
    await workspace.save();
  }

  return workspace;
};

const repairLegacyProjectData = async (user, workspace) => {
  if (!user?._id || !workspace?._id || user.role !== 'Captain') return;

  const missingWorkspace = {
    $or: [{ workspace: null }, { workspace: { $exists: false } }],
  };

  const legacyMissions = await Mission.find({
    createdBy: user._id,
    ...missingWorkspace,
  }).select('_id');

  if (legacyMissions.length === 0) return;

  const missionIds = legacyMissions.map((mission) => mission._id);

  await Mission.updateMany(
    { _id: { $in: missionIds } },
    { $set: { workspace: workspace._id } }
  );

  await Objective.updateMany(
    { missionId: { $in: missionIds }, ...missingWorkspace },
    { $set: { workspace: workspace._id } }
  );
};

const ensureUserWorkspace = async (user) => {
  if (!user?._id) return null;

  const currentWorkspaceId = getWorkspaceId(user.workspace);
  let workspace = currentWorkspaceId ? await Workspace.findById(currentWorkspaceId) : null;

  if (!workspace) {
    workspace = await Workspace.findOne({ owner: user._id });
  }

  if (!workspace) {
    workspace = await Workspace.findOne({ members: user._id });
  }

  if (!workspace && user.role === 'Captain') {
    workspace = await Workspace.create({
      name: `${user.name || 'MissionGrid'} Workspace`,
      owner: user._id,
      members: [user._id],
      inviteCode: await generateUniqueInviteCode(),
    });
  }

  if (!workspace) return null;

  workspace = await normalizeWorkspace(workspace, user);

  if (!currentWorkspaceId || currentWorkspaceId.toString() !== workspace._id.toString()) {
    await User.findByIdAndUpdate(user._id, { workspace: workspace._id });
    user.workspace = workspace._id;
  }

  await repairLegacyProjectData(user, workspace);

  return workspace;
};

const ensureRequestWorkspace = async (req) => {
  const workspace = await ensureUserWorkspace(req.user);
  if (workspace && req.user) {
    req.user.workspace = workspace._id;
  }
  return workspace;
};

module.exports = { ensureUserWorkspace, ensureRequestWorkspace };
