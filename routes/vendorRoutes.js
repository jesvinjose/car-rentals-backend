const express=require('express');
const router=express.Router();
const vendorController=require('../controllers/vendorController');
const auth=require("../middlewares/verifyVendorToken");

router.post('/register',vendorController.registerVendor);
router.post('/verifyOTP',vendorController.verifyOTP);
router.post('/verifyVendorLogin',vendorController.verifyVendorLogin)
router.post('/verifyGoogleLogin',vendorController.googleLogin)

router.post('/googleregister',vendorController.googleRegistration)


router.get('/carslist/:vendorId', auth.verifyVendorToken,vendorController.getCarsList)
router.get('/bookingslist/:vendorId',auth.verifyVendorToken,vendorController.getBookingsList)

//no use
// router.get('/cartypes',vendorController.loadCarTypes) 

router.post('/registercar/:vendorId',auth.verifyVendorToken,vendorController.registerCar)

router.get('/deletecar/:id',auth.verifyVendorToken,vendorController.deleteCar)
router.put('/carDataFormEdit/:id',auth.verifyVendorToken,vendorController.editCarDetails)

router.get('/:vendorId',auth.verifyVendorToken,vendorController.getProfileDetails)
router.post('/updateVendorProfile/:vendorId',auth.verifyVendorToken,vendorController.updateProfile)

//middleware to check blockstatus of vendor in the privateroute
router.get('/checkBlockStatus/:vendorId',vendorController.checkBlockStatus)

//forgot password
router.post('/verifyEmail',vendorController.resetPassword)//to checkEmail
router.post('/VerifyOTP4PasswordReset4Vendor',vendorController.verifyOTP4PasswordReset)
router.post('/confirmPasswordReset4Vendor',vendorController.confirmNewPassword)


module.exports=router;


