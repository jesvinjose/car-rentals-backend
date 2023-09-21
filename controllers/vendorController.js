const Vendor = require("../models/vendorModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const vendorOtpCache = new NodeCache();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
const secretKey = "jesvinjose49";

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
      console.log("Does Email exists-----?" + emailExist);
      let generatedOtp = generateOTP();
      vendorOtpCache.set(emailId, generatedOtp, 60);
      sendOtpMail(emailId, generatedOtp);
      console.log(generatedOtp, "-------otp here");
      // Send the OTP in the response to the client
      res.json({ message: "OTP sent successfully", otp: generatedOtp });
      console.log(
        generatedOtp,
        ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
      );
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
    console.log(result);
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
      console.log("Verify OTP Success");
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

    if (!vendor) {
      console.log("Vendor is not registered, please register now");
      return res.json({
        message: "Vendor is not registered, please register now",
      });
    }

    if (vendor.blockStatus === true) {
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
        secretKey,
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
    const vendorId = req.params.vendorId;
    const vendor = await Vendor.findById(vendorId);
    // console.log("inside getProfileDetails");

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
    };

    // console.log(vendorDetails,"---------next line to vendordetails");
    res.status(200).json({ message: "success", vendorDetails: vendorDetails });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(404).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log("inside updateProfile");
    const { vendorId } = req.params;
    console.log(vendorId, "from params");
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
    console.log(req.body, "--req.body........");
    let aadharfrontimage = await cloudinary.v2.uploader.upload(aadharFrontImage);
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
        aadharFrontImage:aadharfrontimageurl,
        aadharBackImage:aadharbackimageurl
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
module.exports = {
  registerVendor,
  verifyOTP,
  verifyVendorLogin,
  getProfileDetails,
  updateProfile,
};
