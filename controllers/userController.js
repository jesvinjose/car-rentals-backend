const User = require("../models/userModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const otpCache = new NodeCache();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    res.json({ message: "OTP sent successfully" });
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
          firstName:user.firstName
        },
        secretKey,
        {
          expiresIn: "1h", // Set an expiration time for the token
        }
      );
      console.log(token,"-------------Token------------------");
      console.log(passwordMatch, "---passwordMatch----------");
      return res.status(200).json({ 
        message: "Valid User", 
        token:token,
        firstName:user.firstName
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

module.exports = {
  registerUser,
  verifyOTP,
  verifyUserLogin,
};
