const Vendor = require("../models/vendorModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const vendorOtpCache = new NodeCache();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
require("dotenv").config();
const VENDOR_TOKEN_SECRETKEY = process.env.vendortoken_secretKey;
const Car = require("../models/carModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// const CarType = require("../models/carTypeModel");
const Booking = require("../models/bookingModel");
const User = require("../models/userModel");
const Admin = require("../models/adminModel");
const messageModel = require("../models/messageModel");

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
  console.log(vendorId, "----vendorId-----------");
  console.log("Register car");
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
    console.log(req.body, ">>>>>>>>>>>");
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
    console.error("Error registering the car:", error.message);
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
      return res.json({ message: "Invalid User", email: email });
    }
  } catch (error) {
    console.log(error);
  }
};

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
  const newVendor = new Vendor({
    firstName: firstName,
    lastName: lastName,
    emailId: email,
    mobileNumber: mobileNumber,
    password: securedPassword,
    isVerified: true,
  });
  await newVendor.save();

  if (newVendor) {
    return res.json({ message: "Google registration is success" });
  }
  if (!newVendor) {
    return res.json({ message: "Google registration is failure" });
  }
};

const getBookingsList = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const bookingData = await Booking.find({ vendorId: vendorId });

    // Collect all car IDs from booking data
    const carIds = bookingData.map((booking) => booking.carId);

    // Retrieve car information for all car IDs
    const cars = await Car.find({ _id: { $in: carIds } });

    // Create a map of carId to car data for easier lookup
    const carMap = cars.reduce((acc, car) => {
      acc[car._id] = car;
      return acc;
    }, {});

    // Combine booking data with car information
    const bookingsWithCars = bookingData.map((booking) => {
      return {
        ...booking._doc,
        car: carMap[booking.carId], // Include car data for each booking
      };
    });
    // console.log(bookingsWithCars, "-----bookingsWithCars");

    // Reverse the bookingsWithCars array
    const reversedBookingsWithCars = bookingsWithCars.reverse();

    res.json(reversedBookingsWithCars);
  } catch (error) {
    console.error("Error fetching bookings and cars:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
    // console.log(booking,"-------booking");
    // console.log("inside cancelBooking");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

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

    const userEmail = user.emailId;
    console.log(userEmail, "----useremail----");

    // Update the booking status to "cancelled"
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: { "bookingHistory.0.bookingStatus": "cancelled" },
      },
      { new: true } // Return the updated booking
    );

    var message =
      "Booking is cancelled by the vendor, sorry for your inconvenience please book another car";
    statusEmail(userEmail, message);

    res.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const enterOtpToDeliverCar = async (req, res) => {
  try {
    const { otpToBeChecked, bookingId, carId, userId } = req.body;
    console.log(otpToBeChecked, bookingId, carId, userId);
    console.log("Received Booking ID:", bookingId);
    // Find the booking
    const booking = await Booking.findById(bookingId);
    console.log("Start Trip OTP from booking:", booking.startTripOtp);

    if (!booking) {
      console.log("Booking not found with the provided bookingId");
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the provided OTP matches the startTripOtp
    console.log(
      "Comparison result:",
      booking.startTripOtp === parseInt(otpToBeChecked)
    );
    if (booking.startTripOtp !== parseInt(otpToBeChecked)) {
      return res.status(400).json({ message: "Start trip OTP is wrong" });
    }

    // Update car delivery status
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    car.isDelivered = true;
    await car.save();

    // Update booking status to "running"
    booking.bookingHistory[0].bookingStatus = "running";
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
      user.bookingHistory[bookingIndex].bookingStatus = "running";
      // Mark the array as modified before saving
      user.markModified("bookingHistory");
      await user.save();
    } else {
      return res
        .status(404)
        .json({ message: "Booking not found in user history" });
    }

    console.log("Car, booking history in user, and booking details updated");
    res.json({ message: "Car, booking history, and booking details updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStatsofVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    // Use the `countDocuments` method to count the bookings with the specified vendorId
    const totalBookings = await Booking.countDocuments({ vendorId });

    const { startDate, endDate } = getCurrentWeekDates();
    console.log(startDate);
    console.log(endDate);

    const totalBookingsThisWeek = await Booking.countDocuments({
      $and: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { vendorId: vendorId },
      ],
    });

    let totalEarningsThisWeek;
    totalEarningsThisWeek =
      0.9 * (await calculateTotalBookingAmountWithinWeek(vendorId));

    return res.json({
      totalBookings,
      totalBookingsThisWeek,
      totalEarningsThisWeek,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

function getCurrentWeekDates() {
  const currentDate = new Date();
  const currentDay = currentDate.getUTCDay(); // Use getUTCDay to avoid time zone offsets
  const daysUntilSunday = 0 - currentDay;
  const daysUntilSaturday = 6 - currentDay;

  const startDate = new Date(currentDate);
  startDate.setUTCDate(currentDate.getUTCDate() + daysUntilSunday); // Set the start date to the beginning of the week (Sunday)
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(currentDate);
  endDate.setUTCDate(currentDate.getUTCDate() + daysUntilSaturday); // Set the end date to the end of the week (Saturday)
  endDate.setUTCHours(23, 59, 59, 999);

  return { startDate, endDate };
}

async function calculateTotalBookingAmountWithinWeek(vendorId) {
  try {
    const { startDate, endDate } = getCurrentWeekDates();
    console.log(startDate, endDate, "------startWeekDate and endWeekDate ");

    const bookings = await Booking.find({
      vendorId: vendorId,
      "bookingHistory.0.bookingStatus": {
        $in: ["trip ended", "booked and car not taken"],
      },
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    let totalEarnings = 0;

    bookings.forEach((booking) => {
      booking.bookingHistory.forEach((entry) => {
        // Check if the entry falls within the current week.
        if (
          new Date(entry.pickupDate) >= startDate &&
          new Date(entry.returnDate) <= endDate
        ) {
          totalEarnings += entry.Amount;
        }
      });
    });

    console.log(
      totalEarnings,
      "---------total earnings for calculateTotalBookingAmountWithinWeek"
    );

    return totalEarnings;
  } catch (error) {
    console.error("Error:", error);
  }
}

const getBookingsvsMonthChartInVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    console.log(vendorId, "---------vendorId");
    const bookingData = await Booking.find({ vendorId: vendorId }, "createdAt");

    // Process the data to count the number of bookings per month
    const chartData = {};
    bookingData.forEach((booking) => {
      const createdAt = new Date(booking.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1; // Months are zero-based, so add 1
      const key = `${year}-${month}`;

      if (chartData[key]) {
        chartData[key]++;
      } else {
        chartData[key] = 1;
      }
    });

    // Prepare the data for the chart in a format that your charting library expects
    const chartDataArray = Object.entries(chartData).map(([key, count]) => ({
      month: key,
      count,
    }));

    // const earningsData = await Booking.aggregate([
    //   {
    //     $match: {
    //       // "vendorId": vendorId, // Filter by vendorId
    //       bookingHistory: {
    //         $elemMatch: {
    //           bookingStatus: {
    //             $in: ["trip ended", "booked and car not taken"],
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $unwind: "$bookingHistory", // Unwind the array to create a separate document for each booking
    //   },
    //   {
    //     $group: {
    //       _id: {
    //         year: { $year: "$createdAt" },
    //         month: { $month: "$createdAt" },
    //       },
    //       totalEarnings: { $sum: "$bookingHistory.Amount" },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       totalEarnings: { $multiply: ["$totalEarnings", 0.9] }, // Calculate 90% of totalEarnings
    //     },
    //   },
    // ]);

    // console.log(earningsData, "-------earningsData");

    const data = await Booking.find({
      vendorId: vendorId,
      "bookingHistory.bookingStatus": {
        $in: ["trip ended", "booked and car not taken"],
      },
    });

    //Grouping by year and month
    const groupedData = data.reduce((result, item) => {
      const createdAt = item.createdAt;
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1; // Month is 0-based, so add 1

      if (!result[year]) {
        result[year] = {};
      }

      if (!result[year][month]) {
        result[year][month] = [];
      }

      result[year][month].push(item);
      return result;
    }, {});

    //Calculate total earnings and apply the 0.9 factor
    const aggregatedData = [];

    for (const year in groupedData) {
      for (const month in groupedData[year]) {
        const monthData = groupedData[year][month];
        const totalEarnings = monthData.reduce(
          (sum, item) => sum + item.bookingHistory[0].Amount,
          0
        );
        const earningsWithFactor = totalEarnings * 0.9;

        aggregatedData.push({
          _id: {
            year: parseInt(year),
            month: parseInt(month),
          },
          totalEarnings: earningsWithFactor,
        });
      }
    }

    console.log("Aggregated data:", aggregatedData);

    return res.json({ chartDataArray, aggregatedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const saveMessages = async (req, res) => {
//   try {
//     const { bookingId, userId, vendorId, message, sender } = req.body;

//     // console.log(messagehere,"---------messagehere");

//     const messageExist = await messageModel.findOne(
//       { bookingId: bookingId },
//       { userId: userId },
//       { vendorId: vendorId }
//     );
//     // console.log(messageExist, "-----here exist");
//     if (messageExist) {
//       const newMessage = {
//         text: message,
//         sender: sender, // Replace with the sender's ID
//       };

//       const updateResult = await messageModel.updateOne(
//         { bookingId: bookingId },
//         {
//           $push: {
//             messages: newMessage,
//           },
//         }
//       );
//     } else {
//       const newMessage = new messageModel({
//         bookingId: new ObjectId(bookingId), // Replace with the actual Booking ID
//         userId: new ObjectId(userId), // Replace with the actual User ID
//         vendorId: new ObjectId(vendorId), // Replace with the actual Vendor ID
//         messages: [
//           {
//             text: req.body.message,
//             sender: sender, // Replace with the sender's ID
//           },
//           // Add more messages as needed
//         ],
//       });
//       // console.log(newMessage,"--new Message");

//       newMessage
//         .save()
//         .then((savedMessage) => {
//           console.log("Message saved:", savedMessage);
//           // Handle the success case
//         })
//         .catch((error) => {
//           console.error("Error saving message:", error);
//           // Handle the error case
//         });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to save the message" });
//   }
// };

//for maheendrans frontend in chat:
// const saveMessages = async (req, res) => {
//   try {
//     console.log(req.body,"-----------req.body-----------");
//     const { bookingId, userId, vendorId, message, sender } = req.body;
//     const roomName = `${bookingId}-${userId}-${vendorId}`;
//     const vendor=await Vendor.findById(vendorId);
//     // console.log(user,"=================");
//     const userName=vendor.firstName;
//     console.log(userName,"---------userName");
//     // console.log(roomName,"--------roomName");
//     // console.log(messagehere,"---------messagehere");

//     const messageExist = await messageModel.findOne(
//       { bookingId: bookingId },
//       { userId: userId },
//       { vendorId: vendorId }
//     );
//     // console.log(messageExist, "-----here exist");
//     if (messageExist) {
//       const newMessage = {
//         text: message,
//         sender: userName, // Replace with the sender's ID
//       };

//       const updateResult = await messageModel.updateOne(
//         { bookingId: bookingId },
//         {
//           $push: {
//             messages: newMessage,
//           },
//         }
//       );
//     } else {
//       const newMessage = new messageModel({
//         bookingId: new ObjectId(bookingId), // Replace with the actual Booking ID
//         userId: new ObjectId(userId), // Replace with the actual User ID
//         vendorId: new ObjectId(vendorId), // Replace with the actual Vendor ID
//         room:roomName,
//         messages: [
//           {
//             text: req.body.message,
//             sender: userName, // Replace with the sender's ID
//           },
//           // Add more messages as needed
//         ],
//       });
//       // console.log(newMessage,"--new Message");

//       newMessage
//         .save()
//         .then((savedMessage) => {
//           console.log("Message saved:", savedMessage);
//           // Handle the success case
//         })
//         .catch((error) => {
//           console.error("Error saving message:", error);
//           // Handle the error case
//         });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to save the message" });
//   }
// };

// const getMessages = async (req, res) => {
//   try {
//     const { bookingId, userId, vendorId } = req.body;

//     // console.log(req.body,"-------?????");

//     const messageList = await messageModel.findOne(
//       { bookingId: bookingId },
     
//     );

//     // console.log(messageList, "------messageList");

//     return res.status(200).json({ message: messageList?.messages });
//   } catch (error) {
//     console.log(error);
//   }
// };

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
  getBookingsList,
  cancelBooking,
  enterOtpToDeliverCar,
  getStatsofVendor,
  getBookingsvsMonthChartInVendor,
  // getMessages,
  // saveMessages
};








// const getBookingsvsDateChartInVendor=async(req,res)=>{
//   try {
//     const vendorId=req.params.vendorId;
//     const bookingData = await Booking.find({vendorId:vendorId}, 'createdAt'); // Fetch the 'createdAt' field

//     // Process the data to count the number of bookings for each date
//     const chartData = {};
//     bookingData.forEach((booking) => {
//       const date = booking.createdAt.toISOString().split('T')[0];
//       if (chartData[date]) {
//         chartData[date]++;
//       } else {
//         chartData[date] = 1;
//       }
//     });

//     // Prepare the data for the chart in a format that your charting library expects
//     const chartDataArray = Object.entries(chartData).map(([date, count]) => ({
//       date,
//       count,
//     }));
//     console.log(chartDataArray,"----------chartDataArray");
//     return res.json(chartDataArray);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }

// }

// async function calculateTotalBookingAmountWithinWeek(vendorId) {
//   try {
//     const { startDate, endDate } = getCurrentWeekDates();

//     const result = await Booking.aggregate([
//       {
//         $match: {
//           'bookingHistory': {
//             $elemMatch: {
//               'bookingStatus': { $in: ['trip ended', 'booked and car not taken'] },
//               'pickupDate': { $gte: startDate, $lte: endDate }
//             }
//           },
//           "vendorId": vendorId
//         }
//       },
//       {
//         $group: {
//           _id: null, // Group all documents into a single group
//           totalAmount: {
//             $sum: { $arrayElemAt: ['$bookingHistory.Amount', 0] } // Calculate the sum of Amount in the first element of bookingHistory
//           }
//         }
//       }
//     ]);

//     if (result.length > 0) {
//       return result[0].totalAmount;
//     } else {
//       return 0;
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     return 0;
//   }
// }

// async function calculateTotalBookingAmountWithinWeek(vendorId) {
//   try {
//     const { startDate, endDate } = getCurrentWeekDates();

//     const result = await Booking.aggregate([
//       {
//         $match: {
//           bookingHistory: {
//             $elemMatch: {
//               bookingStatus: {
//                 $in: ["trip ended", "booked and car not taken"],
//               },
//               pickupDate: { $gte: startDate, $lte: endDate },
//             },
//           },
//           vendorId: vendorId,
//         },
//       },
//       {
//         $group: {
//           _id: null, // Group all documents into a single group
//           totalAmount: {
//             $sum: { $arrayElemAt: ["$bookingHistory.Amount", 0] }, // Calculate the sum of Amount in the first element of bookingHistory
//           },
//         },
//       },
//     ]);

//     console.log(
//       result,
//       "---------bookings for calculateTotalBookingAmountWithinWeek"
//     );

//     if (result.length > 0) {
//       return result[0].totalAmount;
//     } else {
//       return 0;
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     return 0;
//   }
// }

// async function calculateTotalBookingAmountWithinWeek(vendorId) {
//   try {
//     const { startDate, endDate } = getCurrentWeekDates();
//     console.log(startDate, endDate, "------startWeekDate and endWeekDate ");

//     const result = await Booking.aggregate([
//       {
//         $match: {
//           "bookingHistory.0.bookingStatus": {
//             $in: ["trip ended", "booked and car not taken"],
//           },
//           vendorId: vendorId,
//           createdAt: {
//             $gte: startDate,
//             $lte: endDate,
//           },
//         },
//       },
//       {
//         $unwind: "$bookingHistory",
//       },
//       {
//         $group: {
//           _id: null,
//           totalEarnings: {
//             $sum: "$bookingHistory.Amount",
//           },
//         },
//       },
//     ]);

//     console.log(
//       result,
//       "---------bookings for calculateTotalBookingAmountWithinWeek"
//     );

//     if (result.length > 0) {
//       return result[0].totalEarnings;
//     } else {
//       return 0;
//     }

//   const totalEarnings = [];
//   let total = 0

//    result.map(el => el.bookingHistory)
//     .forEach(val => {
//       val.forEach(a => {
//         console.log(a);
// console.log(startMonthDate.toString(), endMonthDate.toString(), new Date(a.returnDate)  );
//         if (new Date(a.pickupDate) > startDate && new Date(a.returnDate) < endDate) {
//           totalEarnings.push(a);
//         }
//       })
//     });

//     totalEarnings.forEach(e => total += e.Amount)

//  console.log(bookingHistory, 'ellllllllllllllllllllllll')
//  console.log(totalEarnings, 'dddddddddddddd', total)
//   return total;
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }
