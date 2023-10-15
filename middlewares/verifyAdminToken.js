const jwt = require("jsonwebtoken");
// const secretKey = "jesvin"; // Replace with your actual secret key
const ADMIN_TOKEN_SECRETKEY = process.env.admintoken_secretKey;

const verifyAdminToken = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization; // Get the token from the request header
    console.log(authorizationHeader, "authorization Header");
    // Extract the token without the "Bearer " prefix
    const adminToken = authorizationHeader.split(" ")[1];
    // console.log(adminToken, "inside verifyAdminToken");
    if (adminToken === "undefined") {
      console.log(adminToken, "inside undefined token");
      return res.status(401).json({ message: "Authentication failed" });
    } else {
      console.log(process.env.admintoken_secretKey, "admintoken secret key");
      // Verify the admintoken with your secret key
      const decodedAdminToken = jwt.verify(adminToken, ADMIN_TOKEN_SECRETKEY);
      // console.log(decodedAdminToken, "decodedToken");
      // Attach the MongoDB document ID (_id) to the request object
      req.adminId = decodedAdminToken._id;
      // console.log(req.adminId, "req.adminId");
      // Continue to the next middleware or route handler
      next();
    }
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = {verifyAdminToken};
