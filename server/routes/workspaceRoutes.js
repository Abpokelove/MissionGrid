const express = require('express');
const router = express.Router();
const { getMyWorkspace } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyWorkspace);

module.exports = router;
