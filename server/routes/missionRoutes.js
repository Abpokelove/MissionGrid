const express = require('express');
const router = express.Router();
const {
  getMissions,
  getMission,
  createMission,
  updateMission,
  deleteMission,
} = require('../controllers/missionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getMissions).post(createMission);
router.route('/:id').get(getMission).put(updateMission).delete(deleteMission);

module.exports = router;
