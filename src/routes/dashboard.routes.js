const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/metrics', dashboardController.getMetrics);

module.exports = router;