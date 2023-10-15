const Vendor = require("../models/vendorModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const vendorOtpCache = new NodeCache();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
require('dotenv').config();
const VENDOR_TOKEN_SECRETKEY=process.env.vendortoken_secretKey;
const Car = require("../models/carModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// const CarType = require("../models/carTypeModel");
const Booking=require("../models/bookingModel");

const registerVendor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      emailId,
      password,
      confirmPassword,
      mobileNumber,
    } = req.body;

    //Validate firstName
    if (!firstName || firstName.trim().length === 0) {
      return res.json({ message: "Please enter a valid firstName" });
    }

    // Validate lastName
    if (!lastName || lastName.trim().length === 0) {
      return res.json({ message: "Please enter a valid lastName" });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.json({
        message: "Password should be at least 8 characters long",
      });
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      return res.json({ message: "Passwords do not match" });
    }

    //emailId validation
    if (!emailId || !validator.isEmail(emailId)) {
      return res.json({ message: "Please enter a valid email address" });
    }

    //mobileNumber validation
    if (!mobileNumber || !validator.isMobilePhone(mobileNumber)) {
      return res.json({ message: "Please enter a valid mobile number" });
    }

    const emailExist = await Vendor.findOne({ emailId: req.body.emailId });
    if (!emailExist) {
      // console.log("Does Email exists-----?" + emailExist);
      let generatedOtp = generateOTP();
      vendorOtpCache.set(emailId, generatedOtp, 60);
      sendOtpMail(emailId, generatedOtp);
      // console.log(generatedOtp, "-------otp here");
      // Send the OTP in the response to the client
      res.json({ message: "OTP sent successfully", otp: generatedOtp });
      // console.log(
      //   generatedOtp,
      //   ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
      // );
    } else {
      res.json({ message: "This Vendor Already exists" });
    }
  } catch (error) {
    console.log("Error during registering the vendor:", error);
  }
};

async function sendOtpMail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "jesvinjose49@gmail.com",
        pass: "yyrasmmhnslhbidv",
      },
    });
    const mailOptions = {
      from: "jesvinjose49@gmail.com",
      to: email,
      subject: "Your OTP for user verification",
      text: `Your OTP is ${otp}. Please enter this code to verify your vendor account.`,
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
}

// Function to generate a random OTP during vendor signup
const generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000);
};

const verifyOTP = async (req, res) => {
  try {
    const {
      otp,
      firstName,
      lastName,
      emailId,
      password,
      confirmPassword,
      mobileNumber,
    } = req.body;
    const cachedOTPVenderSide = vendorOtpCache.get(emailId);
    if (cachedOTPVenderSide == otp) {
      // console.log(otp, "----------otp---------");
      // console.log(cachedOTP, "----------inside checking---------");
      const securedPassword = await securePassword(password);
      const newVendor = new Vendor({
        firstName: firstName,
        lastName: lastName,
        emailId: emailId,
        mobileNumber: mobileNumber,
        password: securedPassword,
        isVerified: true,
      });
      await newVendor.save();
      vendorOtpCache.del(emailId);
      // console.log("Verify OTP Success");
      res.json({ message: "OTP sent successfully" });
    } else {
      res.json({ message: "wrong OTP" });
    }
  } catch (error) {
    res.json({ message: "Error while verifying OTP:", error });
  }
};

//To bcrypt the password entered during signup (called in verifyOtp function)
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 8);
    return passwordHash;
  } catch (error) {
    console.log(error);
  }
};

const verifyVendorLogin = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const vendor = await Vendor.findOne({ emailId: emailId }); // Use findOne to get a single vendor document
    // console.log(vendor,"------vendor----------");
    if (!vendor) {
      console.log("Vendor is not registered, please register now");
      return res.json({
        message: "Vendor is not registered, please register now",
      });
    }

    if (vendor.blockStatus === true) {
      // console.log("blockStatus");
      return res.json({
        message: "Vendor is blocked, contact jesvinjose49@gmail.com",
      });
    }

    const passwordMatch = await bcrypt.compare(password, vendor.password);

    if (passwordMatch) {
      const vendorToken = jwt.sign(
        {
          _id: vendor._id, // Include the MongoDB document ID
          emailId: vendor.emailId, // Include other user-specific data as needed
          firstName: vendor.firstName,
        },
        VENDOR_TOKEN_SECRETKEY,
        {
          expiresIn: "1h", // Set an expiration time for the token
        }
      );
      // console.log(vendorToken,"-------------Token------------------");
      // console.log(passwordMatch, "---passwordMatch----------");
      return res.status(200).json({
        message: "Valid Vendor",
        vendorToken: vendorToken,
        vendorFirstName: vendor.firstName,
        vendorLastName: vendor.lastName,
        vendorEmailId: vendor.emailId,
        vendorId: vendor._id,
      });
    } else {
      // console.log("Wrong Password");
      return res.json({ message: "Wrong password" });
    }
  } catch (error) {
    console.error("Error during login:", error.message);
    return res.json({ message: "Internal server error" });
  }
};

const getProfileDetails = async (req, res) => {
  try {
    // console.log("getProfileDetails");
    const vendorId = req.params.vendorId;
    const objectId = new ObjectId(vendorId);
    // console.log(objectId, "----------objectId------------");
    const vendor = await Vendor.findById(objectId);

    // console.log("inside getProfileDetails");

    // console.log(vendor._id, "vendor>>>>>>vvvvvvvvvvvvvv>>>>>>>>>>>>>>>");
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendorDetails = {
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      emailId: vendor.emailId,
      mobileNumber: vendor.mobileNumber,
      address: vendor.address,
      pinCode: vendor.pinCode,
      state: vendor.state,
      aadharNumber: vendor.aadharNumber,
      aadharFrontImage: vendor.aadharFrontImage,
      aadharBackImage: vendor.aadharBackImage,
      walletBalance: vendor.walletBalance,
      isVerified: vendor.isVerified,
      blockStatus: vendor.blockStatus,
      createdAt: vendor.createdAt,
      verificationStatus: vendor.verificationStatus,
    };

    // console.log(vendorDetails, "---------next line to vendordetails");
    res.status(200).json({ message: "success", vendorDetails: vendorDetails });
  } catch (error) {
    console.error("Error fetching jesvin details:", error.message);
    res.status(404).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    // console.log("inside updateProfile");
    const { vendorId } = req.params;
    // console.log(vendorId, "from params");
    const {
      firstName,
      lastName,
      password,
      mobileNumber,
      address,
      pinCode,
      state,
      aadharNumber,
      aadharFrontImage,
      aadharBackImage,
    } = req.body;
    // console.log(req.body, "--req.body........");
    let aadharfrontimage = await cloudinary.v2.uploader.upload(
      aadharFrontImage
    );
    let aadharfrontimageurl = aadharfrontimage.url;
    // console.log(aadharfrontimageurl, "---------url-----------");

    let aadharbackimage = await cloudinary.v2.uploader.upload(aadharBackImage);
    let aadharbackimageurl = aadharbackimage.url;
    // console.log(aadharbackimageurl, "------aadharbackimageurl------------");
    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      {
        firstName,
        lastName,
        password,
        mobileNumber,
        address,
        pinCode,
        state,
        aadharNumber,
        aadharFrontImage: aadharfrontimageurl,
        aadharBackImage: aadharbackimageurl,
      },
      { new: true }
    );

    // console.log(updatedVendor, "--------final check-------");
    if (!updatedVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res
      .status(200)
      .json({ message: "Profile updated successfully", vendor: updatedVendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCarsList = async (req, res) => {
  const vendorId = req.params.vendorId;
  // const objectId=new ObjectId(req.params.vendorId)
  // console.log("Hello getCarslist");
  // console.log(vendorId);
  const carsList = await Car.find({ vendorId: vendorId });
  // console.log(carsList, "----------carslist---------");
  res.json(carsList);
};

// const loadCarTypes = async (req, res) => {
// console.log("enter here");
//   try {
//     const carTypes = await CarType.find();
// console.log(carTypes, "-----carTypes------");
//     res.json(carTypes);
//   } catch (error) {
//     console.log(error, 11111111111);
//   }
// };

const editCarDetails = async (req, res) => {
  // console.log("inside editCarDetails");
  try {
    const id = req.params.id;
    // console.log(id,"from editCarDetails");
    const {
      modelName,
      deliveryHub,
      fuelCapacity,
      seatNumber,
      mileage,
      gearBoxType,
      fuelType,
      description,
      rcNumber,
      rcImage,
      carImage,
      carTypeName,
      hourlyRentalRate,
      dailyRentalRate,
      monthlyRentalRate,
      carLocation,
    } = req.body;
    // console.log(carLocation);
    let rcimage = await cloudinary.v2.uploader.upload(rcImage);
    let rcimageurl = rcimage.url;
    let carimage = await cloudinary.v2.uploader.upload(carImage);
    let carimageurl = carimage.url;
    await Car.findByIdAndUpdate(id, {
      modelName,
      deliveryHub,
      fuelCapacity,
      seatNumber,
      mileage,
      gearBoxType,
      fuelType,
      description,
      rcNumber,
      rcImage: rcimageurl,
      carImage: carimageurl,
      carTypeName,
      hourlyRentalRate,
      dailyRentalRate,
      monthlyRentalRate,
      verificationStatus: "pending",
      carLocation,
    });
    res.json({ message: "Car updated successfully" });
  } catch (error) {
    console.log(error);
  }
};

const registerCar = async (req, res) => {
  const vendorId = req.params.vendorId;
  console.log(vendorId,"----vendorId-----------");
  // console.log("Register car");
  try {
    const {
      modelName,
      deliveryHub,
      fuelCapacity,
      selectedGearBox,
      seatNumber,
      mileage,
      selectedFuelType,
      description,
      rcNumber,
      rcImageDataUrl,
      carImageDataUrl,
      vendorId,
      selectedCarType,
      hourlyRentalRate,
      dailyRentalRate,
      monthlyRentalRate,
      carLocation,
    } = req.body;
    // console.log(req.body,">>>>>>>>>>>");
    // console.log(carLocation, "-----carLocation--------");
    // Extract latitude and longitude from carLocation
    const { latitude, longitude } = carLocation;

    const rcImage = await cloudinary.v2.uploader.upload(rcImageDataUrl);
    const rcImageurl = rcImage.url;

    const carImage = await cloudinary.v2.uploader.upload(carImageDataUrl);
    const carImageurl = carImage.url;

    const car = new Car({
      modelName,
      deliveryHub,
      fuelCapacity,
      gearBoxType: selectedGearBox,
      seatNumber,
      mileage,
      fuelType: selectedFuelType,
      description,
      rcNumber,
      rcImage: rcImageurl,
      carImage: carImageurl,
      vendorId: vendorId,
      carTypeName: selectedCarType,
      hourlyRentalRate: hourlyRentalRate,
      dailyRentalRate: dailyRentalRate,
      monthlyRentalRate: monthlyRentalRate,
      carLocation: { latitude, longitude }, // Construct carLocation object
    });

    await car.save();
    res.status(201).json({ message: "New Car registered successfully." });
  } catch (error) {
    console.error("Error registering the car:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const deleteCar = async (req, res) => {
  const id = req.params.id;

  // console.log("inside delete Car with id:"+id);
  await Car.findByIdAndDelete(id);
  res.json({ message: "car deleted successfully" });
};

const checkBlockStatus = async (req, res) => {
  const id = req.params.vendorId;
  const vendor = await Vendor.findById(id);
  // console.log(user,"check block");
  if (vendor.blockStatus === true) {
    res.json({ message: "vendor is blocked" });
  } else {
    res.json({ message: "vendor is not blocked" });
  }
};

const resetPassword = async (req, res) => {
  // console.log(req.body);
  const { emailId } = req.body;
  const vendor = await Vendor.findOne({ emailId: emailId });
  if (vendor) {
    // console.log("Does Email exists-----?" + emailExist);
    let generatedOtp = generateOTP();
    vendorOtpCache.set(emailId, generatedOtp, 60);
    sendOtpMail(emailId, generatedOtp);
    // console.log(generatedOtp, "-------otp here");
    // Send the OTP in the response to the client
    res.json({ message: "OTP sent successfully", otp: generatedOtp });
    // console.log(generatedOtp, ">>>>");
  } else {
    res.json({ message: "This Vendor doesnt exists" });
  }
};

const verifyOTP4PasswordReset = async (req, res) => {
  // console.log("inside verifyOTP4PasswordReset ");
  try {
    const { otp, emailId } = req.body;
    const cachedOTP = vendorOtpCache.get(emailId);
    // console.log(cachedOTP, "--------cachedOTP-----------");
    // console.log(otp, "------------otp---------------");
    if (cachedOTP == otp) {
      // console.log(otp, "----------otp---------");
      // console.log(cachedOTP, "----------inside checking---------");
      // const user = await User.findOne({ emailId: emailId });
      res.json({ message: "OTP sent successfully" });
    } else {
      res.status(400).json({ message: "wrong OTP" });
    }
  } catch (error) {
    console.log(error);
  }
};

confirmNewPassword = async (req, res) => {
  // console.log("inside confirmNewPassword");
  const { emailId, password, confirmPassword } = req.body;
  // console.log(emailId);
  const vendor = await Vendor.findOne({ emailId: emailId });
  // Validate password
  if (!password || password.length < 8) {
    return res.json({
      message: "Password should be at least 8 characters long",
    });
  }

  // Validate confirm password
  if (password !== confirmPassword) {
    return res.json({ message: "Passwords do not match" });
  }

  const securedPassword = await securePassword(password);
  vendor.password = securedPassword;
  await vendor.save();
  console.log(vendor);
  vendorOtpCache.del(emailId);
  return res.json({ message: "Password Reset successfully" });
};

const googleLogin = async (req, res) => {
  try {
    // console.log("googleLogin");
    const { email } = req.body;
    // console.log(email);
    const vendor = await Vendor.findOne({ emailId: email });
    // console.log(vendor, "----vendor----------");
    if (vendor) {
      // console.log("inside vendor");
      const vendorToken = jwt.sign(
        {
          _id: vendor._id, // Include the MongoDB document ID
          emailId: vendor.emailId, // Include other user-specific data as needed
          firstName: vendor.firstName,
        },
        VENDOR_TOKEN_SECRETKEY,
        {
          expiresIn: "1h", // Set an expiration time for the token
        }
      );
      return res.json({
        message: "Google Login",
        vendorToken: vendorToken,
        vendorFirstName: vendor.firstName,
        vendorLastName: vendor.lastName,
        vendorEmailId: vendor.emailId,
        vendorId: vendor._id,
      });
    } else {
      return res.json({ message: "Invalid User", email:email });
    }
  } catch (error) {
    console.log(error);
  }
};

const googleRegistration=async(req,res)=>{
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    mobileNumber,
  } = req.body;
  // console.log(req.body, "inside  googleRegistration for the user");

  //Validate firstName
  if (!firstName || firstName.trim().length === 0) {
    return res.status(400).json({ message: "Please enter a valid firstName" });
  }

  // Validate lastName
  if (!lastName || lastName.trim().length === 0) {
    return res.status(400).json({ message: "Please enter a valid lastName" });
  }

  // Validate password
  if (!password || password.length < 8) {
    return res.status(400).json({
      message: "Password should be at least 8 characters long",
    });
  }

  // Validate confirm password
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  //mobileNumber validation
  if (!mobileNumber || !validator.isMobilePhone(mobileNumber)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid mobile number" });
  }

  const securedPassword = await securePassword(password);
    const newVendor = new Vendor({
      firstName: firstName,
      lastName: lastName,
      emailId: email,
      mobileNumber: mobileNumber,
      password: securedPassword,
      isVerified: true,
    });
    await newVendor.save();

    if (newVendor){
      return res.json({message:"Google registration is success"})
    }
    if(!newVendor){
      return res.json({message:"Google registration is failure"})
    }

}

const getBookingsList=async(req,res)=>{
  const vendorId=req.params.vendorId;
  const bookingData=await Booking.find({vendorId:vendorId})
  console.log(bookingData,"inside bookingData---");
  res.json(bookingData)
}

module.exports = {
  registerVendor,
  verifyOTP,
  verifyVendorLogin,
  getProfileDetails,
  updateProfile,
  getCarsList,
  // loadCarTypes,
  registerCar,
  deleteCar,
  editCarDetails,
  checkBlockStatus,
  resetPassword,
  verifyOTP4PasswordReset,
  confirmNewPassword,
  googleLogin,
  googleRegistration,
  getBookingsList
};
