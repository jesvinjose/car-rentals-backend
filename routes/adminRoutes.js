const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

// Define a route for the admin login page when accessed with /admin
router.post('/login', adminController.adminLogin);
router.post('/home',adminController.loadAdminHome)
router.get('/userslist',adminController.getUsersList)
router.put('/userblock/:id',adminController.blockUser)
router.put('/userunblock/:id',adminController.unblockUser)
module.exports = router;
