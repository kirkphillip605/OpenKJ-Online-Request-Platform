// Filepath: routes/admin.users.routes.js
const express = require('express');
const userController = require('../controllers/admin.users.controller');
// We assume verifyAdminToken middleware will be applied globally to /api/admin route

const router = express.Router();

router.post('/', userController.createUser); // Create new admin user
router.get('/', userController.listUsers); // List all admin users
router.get('/:userId', userController.getUser); // Get specific user
router.put('/:userId', userController.updateUser); // Update user (e.g., email, password)
router.delete('/:userId', userController.deleteUser); // Delete user

module.exports = router;