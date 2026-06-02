const express = require('express');
const router = express.Router();
const { login, register, getUserById } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes (do not require token)
router.post('/login', login);
router.post('/register', register);

// Protected routes (require token)
router.get('/user/:id', verifyToken, getUserById);

module.exports = router;