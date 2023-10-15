const jwt = require("jsonwebtoken");
require("dotenv").config();
// const secretKey = "jesvinjose"; // Replace with your actual secret key
const USER_TOKEN_SECRETKEY = process.env.usertoken_secretKey;
const User = require("../models/userModel");

const verifyUserToken = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization; // Get the token from the request header
    // console.log(authorizationHeader,"authorization Header");
    // Extract the token without the "Bearer " prefix
    const token = authorizationHeader.split(" ")[1];
    // console.log(token, "inside verifyUserToken");
      if (token === "undefined") {
      console.log(token,"inside undefined token");
      return res.status(401).json({ message: "Authentication failed" });
    } else {
      console.log(process.env.usertoken_secretKey, "usertoken secret key");
      // Verify the token with your secret key
      const decodedToken = jwt.verify(token, USER_TOKEN_SECRETKEY);
      // console.log(decodedToken, "decodedToken");
      // Attach the MongoDB document ID (_id) to the request object
      req.userId = decodedToken._id;
      // console.log(req.userId, "req.userId");
      // Continue to the next middleware or route handler
      next();
    }
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

const userBlock = async (req, res, next) => {
  let userId = localStorage.getItem("userId");
  const user = await User.findById(userId);
  if (user.blockStatus === true) {
    return res.json({ message: "User is Blocked" });
  } else {
    console.log("Hi unblocked user");
    next();
  }
};

module.exports = { verifyUserToken, userBlock };
