const express=require('express');
const router=express.Router();
const vendorController=require('../controllers/vendorController');

router.post('/register',vendorController.registerVendor);
router.post('/verifyOTP',vendorController.verifyOTP);
router.post('/verifyVendorLogin',vendorController.verifyVendorLogin)
router.post('/verifyGoogleLogin',vendorController.googleLogin)
router.get('/carslist/:vendorId',vendorController.getCarsList)
router.post('/updateVendorProfile/:vendorId',vendorController.updateProfile)

// router.get('/cartypes',vendorController.loadCarTypes)
router.post('/registercar',vendorController.registerCar)
router.get('/deletecar/:id',vendorController.deleteCar)
router.put('/carDataFormEdit/:id',vendorController.editCarDetails)
router.get('/:vendorId',vendorController.getProfileDetails)

//middleware
router.get('/checkBlockStatus/:vendorId',vendorController.checkBlockStatus)

//forgot password
router.post('/verifyEmail',vendorController.resetPassword)//to checkEmail
router.post('/VerifyOTP4PasswordReset4Vendor',vendorController.verifyOTP4PasswordReset)
router.post('/confirmPasswordReset4Vendor',vendorController.confirmNewPassword)


module.exports=router;


