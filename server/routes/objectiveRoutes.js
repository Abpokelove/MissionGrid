const express = require('express');
const router = express.Router();
const {
  getObjectives,
  getMyObjectives,
  getObjective,
  createObjective,
  updateObjective,
  deleteObjective,
} = require('../controllers/objectiveController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').post(createObjective);
router.route('/my').get(getMyObjectives);
router.route('/mission/:missionId').get(getObjectives);
router.route('/:id').get(getObjective).put(updateObjective).delete(deleteObjective);

module.exports = router;
