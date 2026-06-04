const express = require('express');
const router = express.Router();
const { getAllCourses } = require('../controllers/course.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// GET /api/courses - usuarios autenticados
router.get('/', verifyToken, getAllCourses);

module.exports = router;
