// controllers/adminController.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const User=require("../models/userModel");

const secretKey = "jesvin";

const adminLogin = async (req, res) => {
  // console.log("hi");

  try {
    const { emailId, password } = req.body;
    console.log(req.body, "-----------inside adminLogin");
    const adminDetails = await Admin.findOne({ emailId });
    console.log("req.body", req.body);
    console.log(adminDetails, "..........................");
    if (adminDetails && password === adminDetails.password) {
      const adminToken = jwt.sign( {
        _id: adminDetails._id, // Include the MongoDB document ID
        emailId: adminDetails.emailId, // Include other user-specific data as needed
      }, secretKey, { expiresIn: "1h" });
      console.log(adminToken);
      // Return the token as a response
      return res.json({ adminToken:adminToken,adminEmailId:adminDetails.emailId });

    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
  }
};

const getUsersList=async(req,res)=>{
  const usersList=await User.find({});
  console.log(usersList);
  res.json(usersList);
}

// Controller to load the AdminHome component
const loadAdminHome = (req, res) => {
  // Check if the user has a valid token (authentication)
  const token = req.headers.authorization;
  console.log("Loaded Home");
  console.log(token);
  if (!token) {
    // No token provided, return an unauthorized status
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify the token and extract adminId (payload)
    const decodedToken = jwt.verify(token, secretKey);
    console.log("Decoded token:"+decodedToken);
    // Check if the decoded token contains adminId (you can add more validation here)
    if (decodedToken.adminId) {
      console.log("decodedToken.adminId"+decodedToken.adminId);
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

const unblockUser=async(req,res)=>{
  console.log("unblock");
  const user=await User.findByIdAndUpdate(req.params.id);
  user.blockStatus=false;
  await user.save();
  res.json({message:"user unblocked successfully"})
}

const blockUser=async(req,res)=>{

  console.log("block")
  const user=await User.findByIdAndUpdate(req.params.id)
  user.blockStatus=true
  await user.save()

  res.json({message:"user blocked successfully"})
}

module.exports = {
  addCarousel,
  adminLogin,
  loadAdminHome,
  getUsersList,
  blockUser,
  unblockUser
};
