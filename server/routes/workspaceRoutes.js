const express = require('express');
const router = express.Router();
const { getMyWorkspace, regenerateInvite } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyWorkspace);
router.post('/regenerate-invite', protect, regenerateInvite);

module.exports = router;
