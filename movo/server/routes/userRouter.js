const express = require('express');
const { 
  loginUser, 
  registerUser, 
  refreshToken,
  logoutUser,
  authenticate,
  getCurrentUser,
  changePassword
} = require("../controllers/userController.js");
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRequest(schemas.register), registerUser);
router.post('/login', validateRequest(schemas.login), loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, validateRequest(schemas.changePassword), changePassword);

module.exports = router;
