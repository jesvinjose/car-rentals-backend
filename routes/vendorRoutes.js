const express=require('express');
const router=express.Router();
const vendorController=require('../controllers/vendorController');

router.post('/register',vendorController.registerVendor);
router.post('/verifyOTP',vendorController.verifyOTP);
router.post('/verifyVendorLogin',vendorController.verifyVendorLogin)
router.get('/:vendorId',vendorController.getProfileDetails)
router.post('/updateVendorProfile/:vendorId',vendorController.updateProfile)

module.exports=router;


