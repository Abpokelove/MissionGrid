const express = require('express');
const router = express.Router();
const { getInvite, regenerateInvite } = require('../controllers/inviteController');
const { protect } = require('../middleware/authMiddleware');
const { requireCaptain } = require('../middleware/roleMiddleware');

router.get('/:inviteCode', getInvite);
router.post('/regenerate', protect, requireCaptain, regenerateInvite);

module.exports = router;
