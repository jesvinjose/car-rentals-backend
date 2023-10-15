const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');
const auth=require('../middlewares/verifyUserToken');

//home
router.get('/usershome',userController.loadCarousels)

//getallcars
router.get('/allcars',userController.getAllCars)


//signup
router.post('/register',userController.registerUser)
router.post('/verifyOTP',userController.verifyOTP)
// router.post('/verifyGoogleSignup',userController.googleSignUp)
router.post('/googleregister',userController.googleRegistration)

//signin
router.post('/verifyUserLogin',userController.verifyUserLogin)
router.post('/verifyGoogleLogin',userController.googleLogin)

//forgot password
router.post('/verifyEmail',userController.resetPassword) //to check the email
router.post('/VerifyOTP4PasswordReset',userController.verifyOTP4PasswordReset)  
router.post('/confirmPasswordReset',userController.confirmNewPassword)

//new arrivals
router.get('/newlyarrivedcars',userController.findNewlyArrivedCars)

//getcategorywise cars
router.get('/car_list',userController.getCategorywiseCars)

//get carDetail page
router.get('/car_details',userController.getCarDetails)


//search available cars
router.post('/availableCars',userController.searchAvailableCars)

//userprofile
router.get('/:userId',auth.verifyUserToken,userController.getProfileDetails)
router.post('/updateProfile/:userId',auth.verifyUserToken,userController.updateProfile)

//middleware to check blockstatus of user in the privateroute
router.get('/checkBlockStatus/:userId',userController.checkBlockStatus)

router.post('/carbooking',userController.bookCar)








// router.post('/addCar',verifyUserToken,userController.addCar)
module.exports=router;