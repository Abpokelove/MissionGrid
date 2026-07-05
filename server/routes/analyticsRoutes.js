const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMissionProgress,
  getCoreStability,
  getWorkload,
  getOverdue,
  getCometAlerts,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/mission/:id/progress', getMissionProgress);
router.get('/core-stability/:missionId', getCoreStability);
router.get('/workload', getWorkload);
router.get('/overdue', getOverdue);
router.get('/comet-alerts', getCometAlerts);

module.exports = router;
