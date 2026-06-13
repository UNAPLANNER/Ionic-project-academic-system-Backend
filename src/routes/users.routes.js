const express = require('express');
const router = express.Router();
const { getTeachers, createTeacher } = require('../controllers/users.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/teachers', verifyToken, checkRole('admin'), getTeachers);
router.post('/teachers', verifyToken, checkRole('admin'), createTeacher);

module.exports = router;
