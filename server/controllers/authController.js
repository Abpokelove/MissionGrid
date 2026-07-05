const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const generateToken = require('../utils/generateToken');
const { generateUniqueInviteCode } = require('../utils/inviteCode');
const { ensureUserWorkspace } = require('../utils/workspaceRepair');

const makeAvatar = (name, color = '0ea5e9') =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${color}`;

const serializeUser = (user, token) => {
  const workspace = user.workspace && typeof user.workspace === 'object'
    ? {
        _id: user.workspace._id,
        name: user.workspace.name,
        inviteCode: user.role === 'Captain' ? user.workspace.inviteCode : undefined,
      }
    : user.workspace
      ? { _id: user.workspace }
      : null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    workspace: workspace?._id || workspace || null,
    workspaceName: workspace?.name,
    inviteCode: user.role === 'Captain' ? workspace?.inviteCode : undefined,
    createdAt: user.createdAt,
    ...(token ? { token } : {}),
  };
};

const findInviteWorkspace = async (inviteCode) => {
  const normalizedCode = String(inviteCode || '').trim().toUpperCase();
  if (!normalizedCode) return null;
  return Workspace.findOne({ inviteCode: normalizedCode }).populate('owner', 'name email avatar');
};

// @desc    Register a Project Manager and create their workspace
// @route   POST /api/auth/register-captain
// @access  Public
const registerCaptain = asyncHandler(async (req, res) => {
  const { name, email, password, workspaceName } = req.body;

  if (!name || !email || !password || !workspaceName) {
    res.status(400);
    throw new Error('Please provide name, email, password, and workspace name');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const inviteCode = await generateUniqueInviteCode();

  const captain = await User.create({
    name,
    email,
    password,
    role: 'Captain',
    avatar: makeAvatar(name, '0ea5e9'),
  });

  const workspace = await Workspace.create({
    name: workspaceName,
    owner: captain._id,
    members: [captain._id],
    inviteCode,
  });

  captain.workspace = workspace._id;
  await captain.save();
  await captain.populate('workspace', 'name inviteCode owner members');

  res.status(201).json(serializeUser(captain, generateToken(captain._id)));
});

// @desc    Join a workspace using an invite code
// @route   POST /api/auth/join-team
// @access  Public
const joinTeam = asyncHandler(async (req, res) => {
  const { inviteCode, name, email, password } = req.body;

  if (!inviteCode || !name || !email || !password) {
    res.status(400);
    throw new Error('Please provide invite code, name, email, and password');
  }

  const workspace = await findInviteWorkspace(inviteCode);
  if (!workspace) {
    res.status(404);
    throw new Error('Invite code was not found');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const crew = await User.create({
    name,
    email,
    password,
    role: 'Crew',
    workspace: workspace._id,
    avatar: makeAvatar(name, '8b5cf6'),
  });

  await Workspace.findByIdAndUpdate(workspace._id, { $addToSet: { members: crew._id } });
  await crew.populate('workspace', 'name inviteCode owner members');

  res.status(201).json(serializeUser(crew, generateToken(crew._id)));
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, workspaceName, inviteCode } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  if (role === 'Crew') {
    if (!inviteCode) {
      res.status(400);
      throw new Error('Team members must join with an invite code');
    }

    const workspace = await findInviteWorkspace(inviteCode);
    if (!workspace) {
      res.status(404);
      throw new Error('Invite code was not found');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const crew = await User.create({
      name,
      email,
      password,
      role: 'Crew',
      workspace: workspace._id,
      avatar: makeAvatar(name, '8b5cf6'),
    });

    await Workspace.findByIdAndUpdate(workspace._id, { $addToSet: { members: crew._id } });
    await crew.populate('workspace', 'name inviteCode owner members');
    return res.status(201).json(serializeUser(crew, generateToken(crew._id)));
  }

  const captainWorkspaceName = workspaceName || `${name}'s Team`;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const newInviteCode = await generateUniqueInviteCode();
  const captain = await User.create({
    name,
    email,
    password,
    role: 'Captain',
    avatar: makeAvatar(name, '0ea5e9'),
  });
  const workspace = await Workspace.create({
    name: captainWorkspaceName,
    owner: captain._id,
    members: [captain._id],
    inviteCode: newInviteCode,
  });
  captain.workspace = workspace._id;
  await captain.save();
  await captain.populate('workspace', 'name inviteCode owner members');
  return res.status(201).json(serializeUser(captain, generateToken(captain._id)));
});

// @desc    Login user & return token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password').populate('workspace', 'name inviteCode owner members');

  if (user && (await user.matchPassword(password))) {
    await ensureUserWorkspace(user);
    await user.populate('workspace', 'name inviteCode owner members');
    res.json(serializeUser(user, generateToken(user._id)));
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    await ensureUserWorkspace(user);
    await user.populate('workspace', 'name inviteCode owner members');
    res.json(serializeUser(user));
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users (for crew assignment)
// @route   GET /api/auth/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  await ensureUserWorkspace(req.user);
  const filter = req.user.workspace ? { workspace: req.user.workspace } : { _id: req.user._id };
  const users = await User.find(filter).select('name email role avatar workspace');
  res.json(users);
});

module.exports = { registerUser, registerCaptain, joinTeam, loginUser, getMe, getUsers };
