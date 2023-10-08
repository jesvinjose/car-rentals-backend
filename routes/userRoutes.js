const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');
const auth=require('../middlewares/verifyUserToken');

//home
router.get('/usershome',userController.loadCarousels)

//getallcars
router.get('/allcars',userController.getAllCars)

// //getgeartype cars
// router.get('/Geartype', userController.getGearTypeCars);
// //getfueltype cars
// router.get('/Fueltype',userController.getFuelTypeCars);
// // Route to get cars based on car types
// router.get('/carsbycartype', userController.getCarsByCarType);
// //getsorted price of cars
// router.get('/SortAscentingType',userController.getSortedCarsinAscenting)
// router.get('/SortDescentingType',userController.getSortedCarsinDescenting)

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



//userprofile
router.get('/:userId',userController.getProfileDetails)
router.post('/updateProfile/:userId',userController.updateProfile)

//middleware
router.get('/checkBlockStatus/:userId',userController.checkBlockStatus)








// router.post('/addCar',verifyUserToken,userController.addCar)
module.exports=router;