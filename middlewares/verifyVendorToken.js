const jwt = require("jsonwebtoken");
require("dotenv").config();
// const secretKey = "jesvinjose49"; // Replace with your actual secret key
const VENDOR_TOKEN_SECRETKEY = process.env.vendortoken_secretKey;
const Vendor = require("../models/vendorModel");

const verifyVendorToken = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization; // Get the token from the request header
    console.log(authorizationHeader,"authorization Header");
    const token = authorizationHeader.split(" ")[1];
    // console.log(token, "inside verifyVendorToken");
      if (token === "undefined") {
      console.log(token,"inside undefined token");
      return res.status(401).json({ message: "Authentication failed" });
    } else {
      // Verify the token with your secret key
      // Extract the token without the "Bearer " prefix
      // console.log(process.env.vendortoken_secretKey, "vendortoken secret key");
      const decodedToken = jwt.verify(token, "jesvinjose49");
      // console.log(decodedToken, "decodedToken");
      // Attach the MongoDB document ID (_id) to the request object
      req.vendorId = decodedToken._id;
      // console.log(req.vendorId, "req.vendorId");
      // Continue to the next middleware or route handler
      next();
    }
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

const vendorBlock = async (req, res, next) => {
  let vendorId = localStorage.getItem("vendorId");
  const vendor = await Vendor.findById(vendorId);
  if (vendor.blockStatus === true) {
    return res.json({ message: "User is Blocked" });
  } else {
    console.log("Hi unblocked user");
    next();
  }
};

module.exports = { verifyVendorToken, vendorBlock };
