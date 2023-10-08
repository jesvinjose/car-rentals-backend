const User = require("../models/userModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const otpCache = new NodeCache();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
const Car=require("../models/carModel");
const auth=require("../middlewares/verifyUserToken")
const Carousel=require("../models/carouselModel");

const secretKey = "jesvinjose";
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
      console.log("User is not registered, please register now");
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
        secretKey,
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
      walletBalance:user.walletBalance,
      isVerified:user.isVerified,
      blockStatus:user.blockStatus,
      createdAt:user.createdAt,
      verificationStatus:user.verificationStatus
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
        secretKey,
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
      return res.json({ message: "Invalid User",email:email });
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
    const newUser = new User({
      firstName: firstName,
      lastName: lastName,
      emailId: email,
      mobileNumber: mobileNumber,
      password: securedPassword,
      isVerified: true,
    });
    await newUser.save();

    if (newUser){
      return res.json({message:"Google registration is success"})
    }
    if(!newUser){
      return res.json({message:"Google registration is failure"})
    }

}
const findNewlyArrivedCars=async(req,res)=>{
  const latestCars=await Car.find({verificationStatus:"Approved"}).sort({createdAt:-1}).limit(3);
  // console.log(latestCars);
  return res.json(latestCars);
}

const checkBlockStatus=async(req,res)=>{
  const id=req.params.userId;
  const user=await User.findById(id);
  // console.log(user,"check block");
  if(user.blockStatus===true){
    res.json({message:"user is blocked"})
  }else{
    res.json({message:"user is not blocked"})
  }
}

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
    const { search, carTypes, gearTypes, fuelTypes, sortTypes } = req.query;

    let query = {
      verificationStatus: 'Approved',
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

    if(search){
      query.modelName=search;
    }

    let cars;

    if (sortTypes) {
      let sortDirection = 1; // Default to ascending

      if (sortTypes === 'sortPriceHighToLow') {
        sortDirection = -1;
      }

      cars = await Car.find(query).sort({ hourlyRentalRate: sortDirection });
    } else {
      cars = await Car.find(query);
    }

    return res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCategorywiseCars=async(req,res)=>{
  const category = req.query.category;
  // console.log(category,"--------category------");
  const categoryCars=await Car.find({
    verificationStatus: "Approved",
    blockStatus: false,
    carTypeName:category
  })
  return res.json(categoryCars)
}

const loadCarousels = async (req, res) => {
  try {
    const carousels = await Carousel.find({ blockStatus: false });

    // Extract carouselImages for each carousel
    const carouselImages = carousels.map(carousel => carousel.carouselImages);

    // console.log(carouselImages, "carouselImages--------");
    // return res.json(carouselImages);
    const flattenedArray=carouselImages.flat();
    // console.log(flattenedArray,"flat()");
    return res.json(flattenedArray);
  } catch (error) {
    console.error("Error loading carousels:", error);
    res.status(500).json({ error: "Unable to load carousels" });
  }
};

const getGearTypeCars=async(req,res)=>{
  try {
    const gearType = req.query.gearType;
    // console.log(gearType,"--gearType----");
    // Assuming you have a mechanism to fetch gear type cars based on gearType
    const gearTypeCars = await Car.find({ gearBoxType: gearType });
    // console.log(gearTypeCars,"-------geartypedCars---------");
    // If you have the gearTypeCars data, send it in the response
    return res.json(gearTypeCars);
  } catch (error) {
    console.error('Error fetching gear type cars:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getCarsByCarType = async (req, res) => {

  try {
    const carType = req.query.carType; // Assuming it's an array of car types
    // If carType is not provided, return all cars
    if (!carType) {
      const allCars = await Car.find();
      return res.json(allCars);
    }

    // Filter cars based on the provided car types
    const carTypeCars = await Car.find({ carTypeName: { $in: carType } });
    return res.json(carTypeCars);
  } catch (error) {
    console.error('Error fetching car type cars:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};






const getFuelTypeCars=async(req,res)=>{
  try {
    const fuelType = req.query.fuelType;
    // console.log(fuelType,"--fuelType----");
    // Assuming you have a mechanism to fetch gear type cars based on gearType
    const fuelTypeCars = await Car.find({ fuelType: fuelType });
    // console.log(gearTypeCars,"-------geartypedCars---------");
    // If you have the gearTypeCars data, send it in the response
    return res.json(fuelTypeCars);
  } catch (error) {
    console.error('Error fetching fuel type cars:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getSortedCarsinAscenting = async (req, res) => {
  const sortType = req.query.SortAscentingType; // "asc" for ascending, "desc" for descending

  try {
    let sortDirection = 1; // Default: ascending order
    if (sortType === "desc") {
      sortDirection = -1; // Set to -1 for descending order
    }

    const sortedCars = await Car.find().sort({ hourlyRentalRate: sortDirection });
    // console.log(sortedCars,"-------sortedCars--------");
    return res.json(sortedCars);
  } catch (error) {
    console.error("Error fetching sorted cars:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSortedCarsinDescenting=async(req,res)=>{
  const sortType = req.query.SortDescentingType; // "asc" for ascending, "desc" for descending

  try {
    let sortDirection = 1; // Default: ascending order
    if (sortType === "desc") {
      sortDirection = -1; // Set to -1 for descending order
    }

    const sortedCars = await Car.find().sort({ hourlyRentalRate: sortDirection });
    // console.log(sortedCars,"-------sortedCars--------");
    return res.json(sortedCars);
  } catch (error) {
    console.error("Error fetching sorted cars:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

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
  getGearTypeCars,
  getFuelTypeCars,
  getCarsByCarType,
  getSortedCarsinAscenting,
  getSortedCarsinDescenting
};
