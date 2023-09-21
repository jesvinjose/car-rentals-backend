const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');
const verifyUserToken=require('../middlewares/verifyUserToken');

//signup
router.post('/register',userController.registerUser)
router.post('/verifyOTP',userController.verifyOTP)

//signin
router.post('/verifyUserLogin',userController.verifyUserLogin)
router.post('/verifyGoogleLogin',userController.googleLogin)

//forgot password
router.post('/verifyEmail',userController.resetPassword) //to check the email
router.post('/VerifyOTP4PasswordReset',userController.verifyOTP4PasswordReset)  
router.post('/confirmPasswordReset',userController.confirmNewPassword)

//userprofile
router.get('/:userId',userController.getProfileDetails)
router.post('/updateProfile/:userId',userController.updateProfile)



// router.post('/addCar',verifyUserToken,userController.addCar)
module.exports=router;