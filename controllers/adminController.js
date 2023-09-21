// controllers/adminController.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Vendor = require("../models/vendorModel");
const secretKey = "jesvin";
const CarType=require("../models/carTypeModel");
const adminLogin = async (req, res) => {
  // console.log("hi");

  try {
    const { emailId, password } = req.body;
    // console.log(req.body, "-----------inside adminLogin");
    const adminDetails = await Admin.findOne({ emailId });
    // console.log("req.body", req.body);
    // console.log(adminDetails, "..........................");
    if (adminDetails && password === adminDetails.password) {
      const adminToken = jwt.sign(
        {
          _id: adminDetails._id, // Include the MongoDB document ID
          emailId: adminDetails.emailId, // Include other user-specific data as needed
        },
        secretKey,
        { expiresIn: "1h" }
      );
      // console.log(adminToken);
      // Return the token as a response
      return res.json({
        adminToken: adminToken,
        adminEmailId: adminDetails.emailId,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
  }
};

const getUsersList = async (req, res) => {
  const usersList = await User.find({});
  // console.log(usersList);
  res.json(usersList);
};

const getVendorsList = async (req, res) => {
  const vendorsList = await Vendor.find({});
  // console.log(vendorsList);
  res.json(vendorsList);
};

// Controller to load the AdminHome component
const loadAdminHome = (req, res) => {
  // Check if the user has a valid token (authentication)
  const token = req.headers.authorization;
  // console.log("Loaded Home");
  console.log(token);
  if (!token) {
    // No token provided, return an unauthorized status
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify the token and extract adminId (payload)
    const decodedToken = jwt.verify(token, secretKey);
    // console.log("Decoded token:"+decodedToken);
    // Check if the decoded token contains adminId (you can add more validation here)
    if (decodedToken.adminId) {
      // console.log("decodedToken.adminId"+decodedToken.adminId);
      // Admin is authenticated, return the AdminHome component
      res.json({ message: "Admin Home Component" });
    } else {
      // Invalid token
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    // Token verification failed
    res.status(401).json({ message: "Token verification failed" });
  }
};

const Carousel = require("../models/carouselModel");

// Function to add a new carousel
const addCarousel = async (req, res) => {
  try {
    const { carouselImages, carouselName, isDisabled } = req.body;

    // Create a new carousel instance
    const newCarousel = new Carousel({
      carouselImages,
      carouselName,
      isDisabled,
    });

    // Save the new carousel to the database
    await newCarousel.save();

    res.status(201).json(newCarousel);
  } catch (error) {
    res.status(500).json({ error: "Unable to add carousel" });
  }
};

const unblockUser = async (req, res) => {
  // console.log("unblock");
  const user = await User.findByIdAndUpdate(req.params.id);
  user.blockStatus = false;
  await user.save();
  res.json({ message: "user unblocked successfully" });
};

const blockUser = async (req, res) => {
  // console.log("block")
  console.log(req.params.id, "-------from params----------");
  const user = await User.findByIdAndUpdate(req.params.id);
  user.blockStatus = true;
  await user.save();
  res.json({ message: "user blocked successfully" });
};

const unblockVendor = async (req, res) => {
  console.log("inside unblock");
  const vendor = await Vendor.findByIdAndUpdate(req.params.id);
  vendor.blockStatus = false;
  await vendor.save();
  res.json({ message: "vendor unblocked successfully" });
};

const blockVendor = async (req, res) => {
  console.log("inside block");
  console.log(req.params.id, "this is the id of vendor");
  const vendor = await Vendor.findByIdAndUpdate(req.params.id);
  vendor.blockStatus = true;
  await vendor.save();
  res.json({ message: "vendor blocked successfully" });
};

const acceptUser = async (req, res) => {
  // console.log(req.params.id,"-------from params of userRoute----------");
  // console.log("inside acceptUser-----------");
  const user = await User.findByIdAndUpdate(req.params.id);
  user.verificationStatus = "Approved";
  await user.save();
  res.json({ message: "User Account is Accepted" });
};

const acceptVendor = async (req, res) => {
  console.log(req.params.id, "-------from params of userRoute----------");
  console.log("inside acceptVendor-----------");
  const vendor = await Vendor.findByIdAndUpdate(req.params.id);
  vendor.verificationStatus = "Approved";
  await vendor.save();
  res.json({ message: "Vendor Account is Accepted" });
};

const rejectUser = async (req, res) => {
  // console.log(req.params.id,"-------from params of userRoute----------");
  // console.log("inside rejectVendor-----------");
  const user = await User.findByIdAndUpdate(req.params.id);
  user.verificationStatus = "Rejected";
  await user.save();
  res.json({ message: "User Account is Rejected" });
};

const rejectVendor = async (req, res) => {
  // console.log(req.params.id,"-------from params of userRoute----------");
  // console.log("inside rejectUser-----------");
  const vendor = await Vendor.findByIdAndUpdate(req.params.id);
  vendor.verificationStatus = "Rejected";
  await vendor.save();
  res.json({ message: "Vendor Account is Rejected" });
};

const registerCarType = async (req, res) => {
  console.log("inside registerCarType function ");
  const { carTypeName, hourlyRentalRate, dailyRentalRate, monthlyRentalRate } =
    req.body;
  console.log(carTypeName);
  console.log(req.body, ">>>>>>>>>>>>>>>>>>>");
  // Simple validation
  if (
    !carTypeName ||
    !hourlyRentalRate ||
    !dailyRentalRate ||
    !monthlyRentalRate
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Validate numeric rental rates
  if (
    isNaN(hourlyRentalRate) ||
    isNaN(dailyRentalRate) ||
    isNaN(monthlyRentalRate)
  ) {
    return res.status(400).json({ message: "Rental rates must be numeric." });
  }
  try {
    const carType = new CarType({
      carTypeName,
      hourlyRentalRate,
      dailyRentalRate,
      monthlyRentalRate,
      verificationStatus: 'pending',
      blockStatus: false
    });

    await carType.save();
    console.log(carType,"-----------new car type-----------------");
    res.status(201).json({ message: 'Car type registered successfully.' });
  } catch (error) {
    console.error('Error registering car type:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getCartypeslist=async(req,res)=>{
  const cartypesList = await CarType.find({});
  // console.log(cartypesList);
  res.json(cartypesList);
}

module.exports = {
  addCarousel,
  adminLogin,
  loadAdminHome,
  getUsersList,
  blockUser,
  unblockUser,
  getVendorsList,
  blockVendor,
  unblockVendor,
  acceptUser,
  rejectUser,
  acceptVendor,
  rejectVendor,
  registerCarType,
  getCartypeslist
};
