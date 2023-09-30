const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');
const auth=require('../middlewares/verifyUserToken');

//home
router.get('/usershome',userController.loadCarousels)

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

//new arrivals
router.get('/newlyarrivedcars',userController.findNewlyArrivedCars)
//getallcars
router.get('/allcars',userController.getAllCars)
//getcategorywise cars
router.get('/car_list',userController.getCategorywiseCars)

//userprofile
router.get('/:userId',userController.getProfileDetails)
router.post('/updateProfile/:userId',userController.updateProfile)

//middleware
router.get('/checkBlockStatus/:userId',userController.checkBlockStatus)








// router.post('/addCar',verifyUserToken,userController.addCar)
module.exports=router;