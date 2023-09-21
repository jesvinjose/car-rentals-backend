const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

// Define a route for the admin login page when accessed with /admin
router.post('/login', adminController.adminLogin);
router.post('/home',adminController.loadAdminHome)
router.get('/userslist',adminController.getUsersList)
router.put('/userblock/:id',adminController.blockUser)
router.put('/userunblock/:id',adminController.unblockUser)
router.get('/vendorslist',adminController.getVendorsList)
router.put('/vendorblock/:id',adminController.blockVendor)
router.put('/vendorunblock/:id',adminController.unblockVendor)
router.put('/userVerificationAccept/:id',adminController.acceptUser)
router.put('/userVerificationReject/:id',adminController.rejectUser)
router.put('/vendorVerificationAccept/:id',adminController.acceptVendor)
router.put('/vendorVerificationReject/:id',adminController.rejectVendor)
router.post('/carTypeRegister',adminController.registerCarType)
router.get('/cartypeslist',adminController.getCartypeslist)

module.exports = router;
