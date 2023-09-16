const express=require('express');
const router=express.Router();
const userController=require('../controllers/userController');
const verifyUserToken=require('../middlewares/verifyUserToken');


router.post('/register',userController.registerUser)
router.post('/verifyOTP',userController.verifyOTP)
router.post('/verifyUserLogin',userController.verifyUserLogin)

// router.post('/addCar',verifyUserToken,userController.addCar)
module.exports=router;