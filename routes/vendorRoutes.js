const express=require('express');
const router=express.Router();
const vendorController=require('../controllers/vendorController');

router.post('/register',vendorController.registerVendor);
router.post('/verifyOTP',vendorController.verifyOTP);
router.post('/verifyVendorLogin',vendorController.verifyVendorLogin)

module.exports=router;


