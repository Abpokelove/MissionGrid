const express = require('express');
const router = express.Router();
const { registerUser, registerCaptain, joinTeam, loginUser, getMe, getUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/register-captain', registerCaptain);
router.post('/join-team', joinTeam);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);

module.exports = router;
