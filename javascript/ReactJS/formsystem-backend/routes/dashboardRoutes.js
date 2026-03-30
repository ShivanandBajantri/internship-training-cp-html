const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/items', dashboardController.getDashbaordItems);
router.get('/stats', dashboardController.getDashboardStats);
router.post('/items', dashboardController.createDashboardItem);
router.put('/items/:id', dashboardController.updateDashboardItem);
router.delete('/items/:id', dashboardController.deleteDashboardItem);

module.exports = router;