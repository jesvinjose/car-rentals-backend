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
router.post('/check_car_availability',userController.checkAvailability)

//userprofile
router.get('/:userId',userController.getProfileDetails)
router.post('/updateProfile/:userId',auth.verifyUserToken,userController.updateProfile)

//middleware to check blockstatus of user in the privateroute
router.get('/checkBlockStatus/:userId',userController.checkBlockStatus)

router.post('/carbooking',userController.bookCar)
router.put('/carbooking',userController.editBooking)

router.post('/check_vendor_and_end_trip',userController.enterOtptoEndTrip)

router.get('/bookingslist_user_side/:userId',userController.getBookingHistory)
router.get('/cancelbooking_user_side/:id',userController.cancelBooking)








// router.post('/addCar',verifyUserToken,userController.addCar)
module.exports=router;