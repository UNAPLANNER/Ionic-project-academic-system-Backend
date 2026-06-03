const express = require('express');
const router = express.Router();
const { getAllStudents } = require('../controllers/students.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// GET /api/students — solo teachers y admins
router.get('/', verifyToken, checkRole('teacher', 'admin'), getAllStudents);

module.exports = router;
