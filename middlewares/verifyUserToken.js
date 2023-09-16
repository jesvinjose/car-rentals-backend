const jwt = require('jsonwebtoken');
const secretKey = "jesvinjose"; // Replace with your actual secret key

const verifyUserToken = (req, res, next) => {
  const token = req.headers.authorization; // Get the token from the request header

  if (!token) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  try {
    // Verify the token with your secret key
    const decodedToken = jwt.verify(token, secretKey);
    // Attach the MongoDB document ID (_id) to the request object
    req.userId = decodedToken._id;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = verifyUserToken;