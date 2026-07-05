const crypto = require('crypto');
const Workspace = require('../models/Workspace');

const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const generateUniqueInviteCode = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteCode = generateInviteCode();
    const exists = await Workspace.exists({ inviteCode });
    if (!exists) return inviteCode;
  }

  return `${generateInviteCode()}${Date.now().toString(36).toUpperCase().slice(-3)}`;
};

module.exports = { generateInviteCode, generateUniqueInviteCode };
