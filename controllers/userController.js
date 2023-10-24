const User = require("../models/userModel");
const Vendor = require("../models/vendorModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const otpCache = new NodeCache();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
const Car = require("../models/carModel");
const auth = require("../middlewares/verifyUserToken");
const Carousel = require("../models/carouselModel");
const Booking = require("../models/bookingModel");
const Admin = require("../models/adminModel");
const mongoose = require("mongoose");

// const secretKey = "jesvinjose";
require("dotenv").config();
const USER_TOKEN_SECRETKEY = process.env.usertoken_secretKey;

const registerUser = async (req, res) => {
  const {
    firstName,
    lastName,
    emailId,
    password,
    confirmPassword,
    mobileNumber,
  } = req.body;
  console.log(req.body, "inside register user");

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

  //emailId validation
  if (!emailId || !validator.isEmail(emailId)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address" });
  }

  //mobileNumber validation
  if (!mobileNumber || !validator.isMobilePhone(mobileNumber)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid mobile number" });
  }

  const emailExist = await User.findOne({ emailId: req.body.emailId });
  if (!emailExist) {
    console.log("Does Email exists-----?" + emailExist);
    let generatedOtp = generateOTP();
    otpCache.set(emailId, generatedOtp, 60);
    sendOtpMail(emailId, generatedOtp);
    console.log(generatedOtp, "-------otp here");
    // Send the OTP in the response to the client
    res
      .status(200)
      .json({ message: "OTP sent successfully", otp: generatedOtp });
    console.log(
      generatedOtp,
      ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
    );
  } else {
    res.status(400).json({ message: "This User Already exists" });
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
      text: `Your OTP is ${otp}. Please enter this code to verify your account.`,
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
}

// Function to generate a random OTP during user signup and otplogins
const generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000);
};

const verifyOTP = async (req, res) => {
  const {
    otp,
    firstName,
    lastName,
    emailId,
    password,
    confirmPassword,
    mobileNumber,
  } = req.body;
  const cachedOTP = otpCache.get(emailId);
  // console.log(cachedOTP, "--------cachedOTP-----------");
  // console.log(otp, "------------otp---------------");
  if (cachedOTP == otp) {
    // console.log(otp, "----------otp---------");
    // console.log(cachedOTP, "----------inside checking---------");
    const securedPassword = await securePassword(password);
    const newUser = new User({
      firstName: firstName,
      lastName: lastName,
      emailId: emailId,
      mobileNumber: mobileNumber,
      password: securedPassword,
      isVerified: true,
    });
    await newUser.save();
    otpCache.del(emailId);
    // console.log("Verify OTP Success");
    res.json({ message: "Verify OTP Success" });
  } else {
    res.status(400).json({ message: "wrong OTP" });
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

const verifyUserLogin = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId }); // Use findOne to get a single user document

    if (!user) {
      // console.log("User is not registered, please register now");
      return res.json({
        message: "User is not registered, please register now",
      });
    }

    if (user.blockStatus === true) {
      return res.json({
        message: "User is blocked, contact jesvinjose49@gmail.com",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const token = jwt.sign(
        {
          _id: user._id, // Include the MongoDB document ID
          emailId: user.emailId, // Include other user-specific data as needed
          firstName: user.firstName,
        },
        process.env.usertoken_secretKey,
        {
          expiresIn: "1h", // Set an expiration time for the token
        }
      );
      // res.cookie('userToken', user._id, { maxAge: 3600000 });
      // console.log(token,"-------------Token------------------");
      // console.log(passwordMatch, "---passwordMatch----------");

      return res.status(200).json({
        message: "Valid User",
        token: token,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        userId: user._id,
        walletBalance:user.walletBalance
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
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userDetails = {
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      mobileNumber: user.mobileNumber,
      address: user.address,
      pinCode: user.pinCode,
      state: user.state,
      aadharNumber: user.aadharNumber,
      dlNumber: user.dlNumber,
      aadharFrontImage: user.aadharFrontImage,
      aadharBackImage: user.aadharBackImage,
      dlFrontImage: user.dlFrontImage,
      dlBackImage: user.dlBackImage,
      walletBalance: user.walletBalance,
      isVerified: user.isVerified,
      blockStatus: user.blockStatus,
      createdAt: user.createdAt,
      verificationStatus: user.verificationStatus,
    };

    // console.log(userDetails,"inside getProfileDetails");

    res.status(200).json({ message: "success", userDetails: userDetails });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(404).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  console.log(req.body, "------------inside update profile");
  const { userId } = req.params;
  console.log(userId, "from params");
  console.log();
  const {
    firstName,
    lastName,
    password,
    mobileNumber,
    address,
    pinCode,
    state,
    aadharNumber,
    dlNumber,
    aadharFrontImage,
    aadharBackImage,
    dlFrontImage,
    dlBackImage,
  } = req.body;
  // console.log(req.body, "-----------req.body..............");
  try {
    let aadharfrontimage = await cloudinary.v2.uploader.upload(
      aadharFrontImage
    );
    let aadharfrontimageurl = aadharfrontimage.url;
    // console.log(aadharfrontimageurl, "---------url-----------");

    let aadharbackimage = await cloudinary.v2.uploader.upload(aadharBackImage);
    let aadharbackimageurl = aadharbackimage.url;
    // console.log(aadharbackimageurl, "------aadharbackimageurl------------");

    let dlfrontimage = await cloudinary.v2.uploader.upload(dlFrontImage);
    let dlfrontimageurl = dlfrontimage.url;

    let dlbackimage = await cloudinary.v2.uploader.upload(dlBackImage);
    let dlbackimageurl = dlbackimage.url;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        password,
        mobileNumber,
        address,
        pinCode,
        state,
        aadharNumber,
        dlNumber,
        aadharFrontImage: aadharfrontimageurl,
        aadharBackImage: aadharbackimageurl,
        dlFrontImage: dlfrontimageurl,
        dlBackImage: dlbackimageurl,
      },
      { new: true }
    );

    // console.log(updatedUser, "--------final check-------");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res
        .status(200)
        .json({ message: "Profile updated successfully", user: updatedUser });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  // console.log("inside reset Password");
  console.log(req.body);
  const { emailId } = req.body;
  const user = await User.findOne({ emailId: emailId });
  if (user) {
    // console.log("Does Email exists-----?" + emailExist);
    let generatedOtp = generateOTP();
    otpCache.set(emailId, generatedOtp, 60);
    sendOtpMail(emailId, generatedOtp);
    console.log(generatedOtp, "-------otp here");
    // Send the OTP in the response to the client
    res.json({ message: "OTP sent successfully", otp: generatedOtp });
    // console.log(generatedOtp, ">>>>");
  } else {
    res.json({ message: "This User doesnt exists" });
  }
};

const verifyOTP4PasswordReset = async (req, res) => {
  // console.log("inside verifyOTP4PasswordReset ");
  try {
    const { otp, emailId } = req.body;
    const cachedOTP = otpCache.get(emailId);
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
  console.log("inside confirmNewPassword");
  const { emailId, password, confirmPassword } = req.body;
  // console.log(emailId);
  const user = await User.findOne({ emailId: emailId });
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
  user.password = securedPassword;
  await user.save();
  console.log(user);
  otpCache.del(emailId);
  return res.json({ message: "Password Reset successfully" });
};

const googleLogin = async (req, res) => {
  try {
    console.log("googleLogin");
    const { email } = req.body;
    console.log(email);
    const user = await User.findOne({ emailId: email });
    // console.log(user, "----user----------");
    if (user) {
      console.log("inside user");
      const token = jwt.sign(
        {
          _id: user._id, // Include the MongoDB document ID
          emailId: user.emailId, // Include other user-specific data as needed
          firstName: user.firstName,
        },
        process.env.usertoken_secretKey,
        {
          expiresIn: "1h", // Set an expiration time for the token
        }
      );
      return res.json({
        message: "Google Login",
        token: token,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        userId: user._id,
      });
    } else {
      return res.json({ message: "Invalid User", email: email });
    }
  } catch (error) {
    console.log(error);
  }
};

// const googleSignUp=async(req,res)=>{
//   try {
//     console.log("googleSignUp");
//     const { email } = req.body;
//     console.log(email);
//     const user = await User.findOne({ emailId: email });
//     if(user){
//       return res.json({ message: "User have already Registered" });
//     }else{
//       return res.json({message:"Open google sign up registration form"})
//     }
//   } catch (error) {

//   }
// }

const googleRegistration = async (req, res) => {
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
  const newUser = new User({
    firstName: firstName,
    lastName: lastName,
    emailId: email,
    mobileNumber: mobileNumber,
    password: securedPassword,
    isVerified: true,
  });
  await newUser.save();

  if (newUser) {
    return res.json({ message: "Google registration is success" });
  }
  if (!newUser) {
    return res.json({ message: "Google registration is failure" });
  }
};
const findNewlyArrivedCars = async (req, res) => {
  const latestCars = await Car.find({ verificationStatus: "Approved" })
    .sort({ createdAt: -1 })
    .limit(3);
  // console.log(latestCars);
  return res.json(latestCars);
};

const checkBlockStatus = async (req, res) => {
  const id = req.params.userId;
  const user = await User.findById(id);
  // console.log(user,"check block");
  if (user.blockStatus === true) {
    res.json({ message: "user is blocked" });
  } else {
    res.json({ message: "user is not blocked" });
  }
};

// const getAllCars=async(req,res)=>{
//   const allCars = await Car.find({
//     verificationStatus: "Approved",
//     blockStatus: false
//   });
//   const search=req.query.search;
//   const fuelTypes=req.query.fuelTypes;
//   const gearTypes=req.query.gearTypes;
//   const carTypes=req.query.carTypes;
//   const sortTypes=req.query.sortTypes;
//   console.log(fuelTypes,"------fuelTypes-------");
//   if(fuelTypes){
//     const fuelTypeCars=await Car.find({fuelType:fuelTypes});
//     return res.json(fuelTypeCars)
//   }
//   if(gearTypes){
//     const gearTypeCars=await Car.find({gearBoxType:gearTypes});
//     return res.json(gearTypeCars)
//   }
//   if(carTypes){
//     const carTypeCars=await Car.find({carTypeName:carTypes});
//     return res.json(carTypeCars)
//   }
//   if(sortTypes){
//     if(sortTypes==="sortPriceLowToHigh"){
//       const sortedCars=await Car.find({hourlyRentalRate:1});
//       return res.json(sortedCars);
//     }
//     if(sortTypes==="sortPriceHighToLow"){
//       const sortedCars=await Car.find({hourlyRentalRate:-1});
//       return res.json(sortedCars);
//     }
//   }

//   // console.log(allCars);
//   return res.json(allCars)
// }

const getAllCars = async (req, res) => {
  try {
    const {
      search,
      carTypes,
      gearTypes,
      fuelTypes,
      sortTypes,
      pickupDate,
      returnDate,
    } = req.query;

    let query = {
      verificationStatus: "Approved",
      blockStatus: false,
    };

    if (fuelTypes) {
      query.fuelType = fuelTypes;
    }

    if (gearTypes) {
      query.gearBoxType = gearTypes;
    }

    if (carTypes) {
      query.carTypeName = carTypes;
    }

    if (search) {
      query.modelName = search;
    }

    let cars;

    // if (pickupDate && returnDate) {
    //   // Filter based on availability
    //   const bookedCarIds = await Booking.aggregate([
    //     {
    //       $unwind: '$bookingHistory'
    //     },
    //     {
    //       $match: {
    //         $and: [
    //           { 'bookingHistory.pickupDate': { $lte: returnDate } },
    //           { 'bookingHistory.returnDate': { $gte: pickupDate } },
    //           { 'bookingHistory.bookingStatus': 'booked' }
    //         ]
    //       }
    //     },
    //     {
    //       $group: {
    //         _id: '$carId'
    //       }
    //     }
    //   ]);

    //   const bookedCarIdsArray = bookedCarIds.map((item) => item._id);

    //   query._id = { $nin: bookedCarIdsArray };
    // }

    if (sortTypes) {
      let sortDirection = 1; // Default to ascending

      if (sortTypes === "Descending") {
        sortDirection = -1;
      }

      cars = await Car.find(query).sort({ dailyRentalRate: sortDirection });
    } else {
      cars = await Car.find(query);
    }

    return res.json(cars);
  } catch (error) {
    console.error("Error fetching cars:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCategorywiseCars = async (req, res) => {
  const category = req.query.category;
  // console.log(category,"--------category------");
  const categoryCars = await Car.find({
    verificationStatus: "Approved",
    blockStatus: false,
    carTypeName: category,
  });
  return res.json(categoryCars);
};

const loadCarousels = async (req, res) => {
  try {
    const carousels = await Carousel.find({ blockStatus: false });

    // Extract carouselImages for each carousel
    const carouselImages = carousels.map((carousel) => carousel.carouselImages);

    // console.log(carouselImages, "carouselImages--------");
    // return res.json(carouselImages);
    const flattenedArray = carouselImages.flat();
    // console.log(flattenedArray,"flat()");
    return res.json(flattenedArray);
  } catch (error) {
    console.error("Error loading carousels:", error);
    res.status(500).json({ error: "Unable to load carousels" });
  }
};

const getCarDetails = async (req, res) => {
  try {
    const carId = req.query.carId;
    const carDetails = await Car.findById(carId);
    // console.log(carDetails,"---in the backend");
    return res.json(carDetails);
  } catch (error) {
    console.log(error);
  }
};

const searchAvailableCars = async (req, res) => {
  try {
    const { pickupDate, returnDate } = req.body;
    console.log(pickupDate, "-----pickupDate");
    console.log(returnDate, "-----returnDate-----");
    const bookedCarIds = await Booking.aggregate([
      {
        $unwind: "$bookingHistory",
      },
      {
        $match: {
          $and: [
            { "bookingHistory.pickupDate": { $lte: returnDate } },
            { "bookingHistory.returnDate": { $gte: pickupDate } },
            { "bookingHistory.bookingStatus": "booked" },
          ],
        },
      },
      {
        $group: {
          _id: "$carId",
        },
      },
    ]);
    console.log(bookedCarIds);

    const bookedCarIdsArray = bookedCarIds.map((item) => item._id);

    const availableCars = await Car.find({
      _id: { $nin: bookedCarIdsArray },
    });
    console.log(availableCars.length);

    return res.json(availableCars);
  } catch (error) {
    console.log(error);
  }
};

const checkAvailability = async (req, res) => {
  const { pickupDate, returnDate, carId } = req.body;

  try {
    const overlappingBookings = await Booking.find({
      carId: carId,
      "bookingHistory.pickupDate": { $lt: returnDate },
      "bookingHistory.returnDate": { $gt: pickupDate },
      "bookingHistory.bookingStatus": "booked",
    });

    if (overlappingBookings.length > 0) {
      // There are overlapping bookings, car is not available for the specified date range
      return res.json({
        message: "Car is not available for the specified date range",
      });
    } else {
      // No overlapping bookings, car is available for the specified date range
      return res.json({
        message: "Car is available for the specified date range",
      });
    }
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const checkAvailability = async (req, res) => {
//   const { pickupDate, returnDate, carId } = req.body;
//   const startDate = new Date(pickupDate);
//   const endDate = new Date(returnDate);

//   try {
//     const overlapBookings = await Booking.aggregate([
//       {
//         $match: {
//           carId: new mongoose.Types.ObjectId(carId),
//           bookingHistory: {
//             $elemMatch: {
//               bookingStatus: "booked",
//               $and: [
//                 { "bookingHistory.pickupDate": { $lt: endDate } },
//                 { "bookingHistory.returnDate": { $gt: startDate } },
//               ],
//             },
//           },
//         },
//       },
//     ]);

//     console.log(overlapBookings, "------overlapBookings-----");

//     if (overlapBookings.length > 0) {
//       console.log("Car is not available for the specified date range");
//       res.json({
//         message: "Car is not available for the specified date range",
//       });
//     } else {
//       console.log("Car is available for the specified date range");
//       res.json({ message: "Car is available for the specified date range" });
//     }
//   } catch (error) {
//     console.error("Error checking availability:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

async function sendOtptoVendorrthroughEmail(email, otp, bookingId) {
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
      subject: `OTP to End the Trip for the trip with bookingId:${bookingId}`,
      text: `OTP for ending your trip is ${otp}. Please tell this OTP to the customer for ending his trip.`,
    };
    const result = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error.message);
  }
}

async function sendOtptoUserthroughEmail(email, otp, bookingId) {
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
      subject: `Your OTP to Start the Trip for the trip with bookingId:${bookingId}`,
      text: `OTP for starting your trip is ${otp}. Please tell this OTP to car owner.`,
    };
    const result = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error.message);
  }
}

const getBookingHistory = async (req, res) => {
  const userId = req.params.userId;
  // console.log(userId, "-----userId-------");

  try {
    const user = await User.findById(userId).lean();

    const populatedBookingHistory = await Promise.all(
      user.bookingHistory.map(async (booking) => {
        // Populate car details based on carId
        const car = await Car.findById(booking.carId);
        return {
          ...booking,
          carImage: car.carImage,
          modelName: car.modelName,
          rcImage: car.rcImage,
          rcNumber: car.rcNumber,
          fuelType: car.fuelType,
          seatNumber: car.seatNumber,
          fuelCapacity: car.fuelCapacity,
          deliveryHub: car.deliveryHub,
          dailyRentalRate: car.dailyRentalRate,
          mileage: car.mileage,
          gearBoxType: car.gearBoxType,
        };
      })
    );

    // Reverse the order of populatedBookingHistory
    populatedBookingHistory.reverse();

    // console.log(populatedBookingHistory, "----userInfo-----");
    res.json(populatedBookingHistory);
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

async function statusEmail(email, message) {
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
      subject: "Your Booking Status",
      text: message,
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
}

const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    console.log(booking, "-------booking");
    console.log("inside cancelBooking");
    const vendorId = booking.vendorId;
    console.log(vendorId, "------vendorId");

    const vendor = await Vendor.findById(vendorId);
    console.log(vendor, "---------vendor-----------");

    if (!vendor) {
      res.json({ message: "Vendor is not found" });
    }

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Update the booking status to "cancelled"
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: { "bookingHistory.0.bookingStatus": "cancelled" },
      },
      { new: true } // Return the updated booking
    );

    const userId = booking.bookingHistory[0]?.userId; // Use optional chaining to safely access nested properties
    // console.log(userId,"------userId");

    // console.log(user,"--------user------");
    if (!userId) {
      return res.status(404).json({ error: "User not found for this booking" });
    }

    const user = await User.findById(userId);

    const admin = await Admin.findOne({ emailId: "admin@gmail.com" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    } else {
      var amountToRefund = 0;
      // Update the user's booking status
      user.bookingHistory.forEach((bookingHistoryItem) => {
        if (bookingHistoryItem.bookingId.toString() === bookingId) {
          bookingHistoryItem.bookingStatus = "cancelled";
          amountToRefund += bookingHistoryItem.Amount;
        }
      });
      // console.log(user.bookingHistory, "-----user.bookingHistory");
      // Mark the array as modified before saving
      user.markModified("bookingHistory");
    }
    user.walletBalance += amountToRefund;
    await user.save();

    admin.walletBalance -= amountToRefund;
    await admin.save();

    const vendorEmail = vendor.emailId;

    console.log(vendorEmail, "----vendorEmail----");

    var message =
      "Booking is cancelled by the user, sorry for your inconvenience.";
    statusEmail(vendorEmail, message);

    res.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.log(error);
  }
};

const bookCar = async (req, res) => {
  try {
    console.log(req.body, "inside bookCar");

    // Extract carId and bookingData correctly
    const { carId, bookingData } = req.body;

    const userId = bookingData.userId;
    const user = await User.findById(userId);
    const userEmail = user.emailId;

    const car = await Car.findById(carId);
    const Amount = bookingData.Amount;
    const vendorId = car.vendorId;
    const vendor = await Vendor.findById(vendorId);
    const vendorEmail = vendor.emailId;

    let startTripOtp;
    let endTripOtp;
    startTripOtp = generateOTP();
    endTripOtp = generateOTP();

    const newBooking = new Booking({
      vendorId: vendorId,
      carId: carId,
      startTripOtp: startTripOtp,
      endTripOtp: endTripOtp,
      bookingHistory: [
        {
          pickupDate: bookingData.pickupDate,
          returnDate: bookingData.returnDate,
          userId: userId,
          bookingStatus: "booked",
          Amount: Amount,
        },
      ],
    });

    await newBooking.save();

    user.bookingHistory.push({
      bookingId: newBooking._id,
      vendorId: vendorId,
      carId: carId,
      startTripOtp: startTripOtp,
      pickupDate: bookingData.pickupDate,
      returnDate: bookingData.returnDate,
      bookingStatus: "booked",
      Amount: Amount,
    });

    await user.save();

    const admin = await Admin.findOne({ emailId: "admin@gmail.com" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    admin.walletBalance += Amount;
    await admin.save();

    // The above line updates the walletBalance for the admin with the given emailId

    sendOtptoUserthroughEmail(userEmail, startTripOtp, newBooking._id);
    sendOtptoVendorrthroughEmail(vendorEmail, endTripOtp, newBooking._id);

    res.status(200).json({ message: "Booking successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Booking failed" });
  }
};

const editBooking = async (req, res) => {
  const { bookingId, bookingData } = req.body;

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);

    // Update the booking history
    booking.bookingHistory[0].Amount += bookingData.Amount;
    booking.bookingHistory[0].returnDate = bookingData.returnDate;

    // Save the updated booking
    await booking.save();

    // Respond with a success message or updated booking
    // res.status(200).json({ message: 'Booking updated successfully', booking });
    const userId = bookingData.userId;
    const user = await User.findById(userId);
    if (user) {
      const updatedUserBookingHistory = user.bookingHistory.map((history) => {
        if (history.bookingId.toString() === bookingId) {
          return {
            ...history,
            Amount: history.Amount + bookingData.Amount,
            returnDate: bookingData.returnDate,
          };
        }
        return history;
      });

      user.bookingHistory = updatedUserBookingHistory;
      await user.save();
    } else {
      console.error("User not found with ID:", bookingData.userId);
    }

    const admin = await Admin.findOne({ emailId: "admin@gmail.com" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    admin.walletBalance += bookingData.Amount;
    await admin.save();
    res.status(200).json({ message: "user, booking and admin updated" });
  } catch (error) {
    console.error("Error editing booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const enterOtptoEndTrip = async (req, res) => {
  try {
    const { otpToBeChecked, bookingId, carId, userId } = req.body;
    console.log(otpToBeChecked, bookingId, carId, userId);
    console.log("Received Booking ID:", bookingId);
    // Find the booking
    const booking = await Booking.findById(bookingId);
    console.log(booking);
    console.log("End Trip OTP from booking:", booking.endTripOtp);

    if (!booking) {
      console.log("Booking not found with the provided bookingId");
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the provided OTP matches the endTripOtp
    console.log(
      "Comparison result:",
      booking.endTripOtp === parseInt(otpToBeChecked)
    );
    if (booking.endTripOtp !== parseInt(otpToBeChecked)) {
      return res.status(400).json({ message: "End trip OTP is wrong" });
    }

    // Update car delivery status
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    car.isDelivered = false;
    await car.save();

    // Update booking status to "running"
    booking.bookingHistory[0].bookingStatus = "trip ended";
    await booking.save();

    // Find the user and update booking history
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let bookingIndex = -1;

    // Find the bookingIndex by bookingId
    user.bookingHistory.forEach((booking, index) => {
      if (booking.bookingId == bookingId) {
        bookingIndex = index;
      }
    });

    if (bookingIndex !== -1) {
      user.bookingHistory[bookingIndex].bookingStatus = "trip ended";
      // Mark the array as modified before saving
      user.markModified("bookingHistory");
      await user.save();
    } else {
      return res
        .status(404)
        .json({ message: "Booking not found in user history" });
    }

    const vendor = await Vendor.findById(booking.vendorId);
    vendor.walletBalance += 0.9 * booking.bookingHistory[0].Amount;

    await vendor.save();

    const admin = await Admin.findOne({ emailId: "admin@gmail.com" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    admin.walletBalance -= 0.9 * booking.bookingHistory[0].Amount;
    await admin.save();

    console.log("Car, booking history in user, and booking details updated");
    res.json({ message: "Car, booking history, and booking details updated" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  verifyUserLogin,
  getProfileDetails,
  updateProfile,
  resetPassword,
  verifyOTP4PasswordReset,
  confirmNewPassword,
  googleLogin,
  findNewlyArrivedCars,
  checkBlockStatus,
  getAllCars,
  getCategorywiseCars,
  loadCarousels,
  // googleSignUp,
  googleRegistration,
  getCarDetails,
  searchAvailableCars,
  bookCar,
  checkAvailability,
  getBookingHistory,
  cancelBooking,
  editBooking,
  enterOtptoEndTrip,
};
