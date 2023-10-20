// controllers/adminController.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Vendor = require("../models/vendorModel");
const ADMIN_TOKEN_SECRETKEY=process.env.admintoken_secretKey;
// const CarType = require("../models/carTypeModel");
const Car = require("../models/carModel");
const Carousel = require("../models/carouselModel");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const Booking=require("../models/bookingModel");
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
        ADMIN_TOKEN_SECRETKEY,
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
    const decodedToken = jwt.verify(token, ADMIN_TOKEN_SECRETKEY);
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

// Function to add a new carousel
const addCarousel = async (req, res) => {
  try {
    console.log(req.body, "------------------");
    console.log(req.files, "--------------");
    const { carouselName, carouselDescription } = req.body;
    // const carouselImages = req.files['carouselImages']; // Correctly access carouselImages
    // console.log(carouselImages, ";;;;;;;;;;;;;;;;;;;;;;;;");
    // const carouselImages = files.filter(
    //   (file) => file.fieldname === "carouselImages"
    // );
    // console.log(carouselImages,"---------;;;;;;;;;;;");

    const imageUrls = [];

    // Upload each carousel image to Cloudinary and store the URLs
    for (const image of req.files) {
      try {
        const result = await cloudinary.uploader.upload(image.path);
        imageUrls.push(result.secure_url);
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        // Handle error appropriately, e.g., send an error response
        return res
          .status(500)
          .json({ error: "Error uploading image to Cloudinary" });
      }
    }
    console.log(imageUrls, "---------------");

    // Create a new carousel instance with image URLs
    const newCarousel = new Carousel({
      carouselImages: imageUrls,
      carouselName,
      carouselDescription,
    });

    console.log(newCarousel, "---------newCarousel----------");
    // Save the new carousel to the database
    await newCarousel.save();
    console.log(imageUrls, "imageUrls----------");

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
  // console.log(req.params.id, "-------from params----------");
  const user = await User.findByIdAndUpdate(req.params.id);
  user.blockStatus = true;
  await user.save();
  res.json({ message: "user blocked successfully" });
};

const unblockVendor = async (req, res) => {
  // console.log("inside unblock");
  const vendor = await Vendor.findByIdAndUpdate(req.params.id);
  vendor.blockStatus = false;
  await vendor.save();
  res.json({ message: "vendor unblocked successfully" });
};

const blockVendor = async (req, res) => {
  // console.log("inside block");
  console.log(req.params.id, "this is the id of vendor");
  const vendor = await Vendor.findByIdAndUpdate(req.params.id);
  vendor.blockStatus = true;
  await vendor.save();
  res.json({ message: "vendor blocked successfully" });
};

// const acceptUser = async (req, res) => {
//   // console.log(req.params.id,"-------from params of userRoute----------");
//   // console.log("inside acceptUser-----------");
//   const user = await User.findByIdAndUpdate(req.params.id);
//   user.verificationStatus = "Approved";
//   await user.save();
//   res.json({ message: "User Account is Accepted" });
// };

// const acceptVendor = async (req, res) => {
//   console.log(req.params.id, "-------from params of userRoute----------");
//   console.log("inside acceptVendor-----------");
//   const vendor = await Vendor.findByIdAndUpdate(req.params.id);
//   vendor.verificationStatus = "Approved";
//   await vendor.save();
//   res.json({ message: "Vendor Account is Accepted" });
// };

// const rejectUser = async (req, res) => {
//   // console.log(req.params.id,"-------from params of userRoute----------");
//   // console.log("inside rejectVendor-----------");
//   const user = await User.findByIdAndUpdate(req.params.id);
//   user.verificationStatus = "Rejected";
//   await user.save();
//   res.json({ message: "User Account is Rejected" });
// };

// const rejectVendor = async (req, res) => {
//   // console.log(req.params.id,"-------from params of userRoute----------");
//   // console.log("inside rejectUser-----------");
//   const vendor = await Vendor.findByIdAndUpdate(req.params.id);
//   vendor.verificationStatus = "Rejected";
//   await vendor.save();
//   res.json({ message: "Vendor Account is Rejected" });
// };

// const registerCarType = async (req, res) => {
//   console.log("inside registerCarType function ");
//   const { carTypeName, hourlyRentalRate, dailyRentalRate, monthlyRentalRate } =
//     req.body;
//   console.log(carTypeName);
//   console.log(req.body, ">>>>>>>>>>>>>>>>>>>");
// Simple validation
//   if ( !carTypeName ||  !hourlyRentalRate ||    !dailyRentalRate ||    !monthlyRentalRate
//   ) {
//     return res.status(400).json({ message: "All fields are required." });
//   }

// Validate numeric rental rates
//   if (  isNaN(hourlyRentalRate) ||  isNaN(dailyRentalRate) ||    isNaN(monthlyRentalRate) ) {
//     return res.status(400).json({ message: "Rental rates must be numeric." });
//   }
//   try {
//     const carType = new CarType({
//       carTypeName,
//       hourlyRentalRate,
//       dailyRentalRate,
//       monthlyRentalRate,
//       blockStatus: false,
//     });

//     await carType.save();
//     console.log(carType, "-----------new car type-----------------");
//     res.status(201).json({ message: "Car type registered successfully." });
//   } catch (error) {
//     console.error("Error registering car type:", error);
//     res.status(500).json({ message: "Server error." });
//   }
// };

// const blockCarType = async (req, res) => {
//   const id = req.params.id;
//   console.log(id, "from block Car Type");
//   const carType = await CarType.findById(id);
//   carType.blockStatus = false;
//   await carType.save();
//   res.json({ message: "Car Type blocked successfully" });
// };

// const getCartypeslist = async (req, res) => {
//   const cartypesList = await CarType.find({});
// console.log(cartypesList);
//   res.json(cartypesList);
// };

// const unblockCarType = async (req, res) => {
//   const id = req.params.id;
//   console.log(id,"from unblock Car Type");
//   const carType = await CarType.findById(id);
//   carType.blockStatus = true;
//   await carType.save();
//   res.json({ message: "Car Type unblocked successfully" });
// };

// const editCarType = async (req, res) => {
//   const id = req.params.id;
//   console.log(id, "inside editCarType");

//   console.log(req.body, "from body");
//   const { carTypeName, hourlyRentalRate, dailyRentalRate, monthlyRentalRate } =
//     req.body;
//   const updatedCarType = await CarType.findByIdAndUpdate(
//     id,
//     {
//       carTypeName,
//       hourlyRentalRate,
//       dailyRentalRate,
//       monthlyRentalRate,
//     },
//     { new: true }
//   );
//   if (!updatedCarType) {
//     return res.status(404).json({ message: "Car Type not found" });
//   } else {
//     return res.status(200).json({
//       message: "CarType updated successfully",
//       cartype: updatedCarType,
//     });
//   }
// };

const getCarsList = async (req, res) => {
  // console.log("inside getCarsList");
  const cars = await Car.find({});
  res.json(cars);
};

const blockCar = async (req, res) => {
  const id = req.params.id;
  console.log(id, "id in blockCar");
  const car = await Car.findById(id);
  car.blockStatus = true;
  await car.save();
  res.json({ message: "Car blocked successfully" });
};

const blockCarousel=async (req, res) => {
  const id = req.params.id;
  console.log(id, "id in blockCarousel");
  const carousel = await Carousel.findById(id);
  carousel.blockStatus = true;
  await carousel.save();
  res.json({ message: "Carousel blocked successfully" });
};

const unblockCar = async (req, res) => {
  const id = req.params.id;
  // console.log(id,"id in unblockCar");
  const car = await Car.findById(id);
  car.blockStatus = false;
  await car.save();
  res.json({ message: "Car unblocked successfully" });
};

const unblockCarousel=async(req,res)=>{
  const id = req.params.id;
  console.log(id, "id in unblockCarousel");
  const carousel = await Carousel.findById(id);
  carousel.blockStatus = false;
  await carousel.save();
  res.json({ message: "Carousel unblocked successfully" });
}

const acceptCar = async (req, res) => {
  const id = req.params.id;
  // console.log(id, "id in acceptCar");
  const car = await Car.findById(id);
  car.verificationStatus = "Approved";
  await car.save();
  // console.log(car.vendorId,"--------vendorId of vendor");
  const vendor=await Vendor.findById(car.vendorId)
  // console.log(vendor,"-------vendor Details-------");
  console.log(vendor.emailId,"--vendors emailId");
  var message=`Your car with the following details has been accepted:\n\n
  ModelName: ${car.modelName}\n
  DeliveryHub: ${car.deliveryHub}\n
  FuelCapacity:${car.fuelCapacity}\n
  SeatNumber:${car.seatNumber}\n
  Mileage:${car.mileage}\n
  GearBoxType:${car.gearBoxType}\n
  FuelType:${car.fuelType}\n
  RCNumber:${car.rcNumber}\n
  RCImage:${car.rcImage}\n
  CarImage:${car.carImage}\n
  CarTypeName:${car.carTypeName}\n
  HourlyRentalRate:${car.hourlyRentalRate}\n
  DailyRentalRate:${car.dailyRentalRate}\n
  MonthlyRentalRate:${car.monthlyRentalRate}\n
  CarLocation:${car.carLocation}\n`
  statusEmail(vendor.emailId,message)
  res.json({ message: "Car is Accepted" });
};

async function statusEmail(email,message) {
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
      subject: "Your Car verification Status",
      text: message,
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
}

const rejectCar = async (req, res) => {
  const id = req.params.id;
  console.log(id, "id in rejectCar");
  const car = await Car.findById(id);
  car.verificationStatus = "Rejected";
  await car.save();
    // console.log(car.vendorId,"--------vendorId of vendor");
    const vendor=await Vendor.findById(car.vendorId)
    // console.log(vendor,"-------vendor Details-------");
    console.log(vendor.emailId,"--vendors emailId");
    var message=`Your car with the following details has been rejected:\n\n
    ModelName: ${car.modelName}\n
    DeliveryHub: ${car.deliveryHub}\n
    FuelCapacity:${car.fuelCapacity}\n
    SeatNumber:${car.seatNumber}\n
    Mileage:${car.mileage}\n
    GearBoxType:${car.gearBoxType}\n
    FuelType:${car.fuelType}\n
    RCNumber:${car.rcNumber}\n
    RCImage:${car.rcImage}\n
    CarImage:${car.carImage}\n
    CarTypeName:${car.carTypeName}\n
    HourlyRentalRate:${car.hourlyRentalRate}\n
    DailyRentalRate:${car.dailyRentalRate}\n
    MonthlyRentalRate:${car.monthlyRentalRate}\n
    CarLocation:${car.carLocation}\n`
    // ... Add other car details as needed ...\n
    // \n\nReason for rejection: ${req.body.reason}`;
    statusEmail(vendor.emailId,message)
  res.json({ message: "Car is Rejected" });
};

const getVendorNameAndAdharImages = async (req, res) => {
  const id = req.params.id;
  // console.log(id,"id in getVendorName");
  const vendor = await Vendor.findOne({ _id: id });
  // console.log(vendor);
  res.json(vendor);
};

const getCarouselList = async (req, res) => {
  const carousel = await Carousel.find({ blockStatus: false });
  console.log(carousel);
  return res.json(carousel);
};

const deleteCarousel = async (req, res) => {
  const carouselId = req.params.carouselId;
  try {
    // Find the carousel by ID and remove it
    await Carousel.findByIdAndRemove(carouselId);
    console.log(carouselId,"-------deleting carousel---------");
    res.status(200).json({ message: "Carousel deleted successfully" });
  } catch (error) {
    console.error('Error deleting carousel:', error);
    res.status(500).json({ error: "Could not delete carousel" });
  }
};

const editCarousel = async (req, res) => {
  try {
    const carouselId = req.params.carouselId;
    const name = req.body.carouselName;
    const description = req.body.carouselDescription;

    // const files = req.files;
    const carouselImages = [];
    const imageUrls = [];

    // Upload each carousel image to Cloudinary and store the URLs
    for (const image of req.files) {
      try {
        const result = await cloudinary.uploader.upload(image.path);
        imageUrls.push(result.secure_url);
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        // Handle error appropriately, e.g., send an error response
        return res
          .status(500)
          .json({ error: "Error uploading image to Cloudinary" });
      }
    }

    // files.forEach((file) => {
    //   const image = file.filename;
    //   carouselImages.push(image);
    // });

    const updatedCarousel=await Carousel.findByIdAndUpdate(
      { _id: carouselId },
      {
        $set: {
          carouselName: name,
          carouselDescription: description,
          carouselImages: imageUrls,
        },
      }
    );
    return res.json(updatedCarousel)
  } catch (error) {
    console.log(error);
  }
};

const loadEditCarousel=async(req,res)=>{
  try {
    const carouselId = req.params.carouselId;
    console.log(carouselId,"----carouselId--------");
    const carousel=await Carousel.findById(carouselId);
    console.log(carousel,"inside loadEditCarousel");
    return res.json(carousel)
  } catch (error) {
    console.log(error);
  }
}

const getCompleteBookingList = async (req, res) => {
  try {
    const adminEmailId = req.params.adminEmailId;
    console.log(adminEmailId, "-----adminEmailId");
    const admin = await Admin.find({ emailId: adminEmailId });
    if (admin) {
      const completeBookings = await Booking.find();
      const completeVendors = await Vendor.find();
      const completeCars = await Car.find();

      // console.log(completeBookings, "-----completeBookings");
      // console.log(completeCars, "--------completeCars");
      // console.log(completeVendors, "--------completeVendors");

      if (!completeBookings) {
        return res.json({ message: "Bookings not found" });
      }

      // Define an array to store the combined details
      const combinedDetails = [];

      // Loop through completeBookings
      completeBookings.forEach((booking) => {
        // Find vendor and car details for the booking
        const vendor = completeVendors.find((v) => v._id.toString() === booking.vendorId.toString());
        const car = completeCars.find((c) => c._id.toString() === booking.carId.toString());

        if (vendor && car) {
          // Extract the required details and create an object
          const details = {
            // Vendor details
            aadharFrontImage: vendor.aadharFrontImage,
            aadharBackImage: vendor.aadharBackImage,
            firstName: vendor.firstName,
            emailId: vendor.emailId,
            // Car details
            carImage: car.carImage,
            rcImage: car.rcImage,
            fuelType: car.fuelType,
            fuelCapacity: car.fuelCapacity,
            deliveryHub: car.deliveryHub,
            dailyRentalRate: car.dailyRentalRate,
            mileage: car.mileage,
            gearBoxType: car.gearBoxType,
            // Additional details from booking
            modelName: car.modelName,
            bookingId:booking._id,
            pickupDate: booking.bookingHistory[0].pickupDate,
            returnDate: booking.bookingHistory[0].returnDate,
            Amount: booking.bookingHistory[0].Amount,
            bookingStatus: booking.bookingHistory[0].bookingStatus,
          };

          // Add the details object to the combinedDetails array
          combinedDetails.push(details);
        }
      });

      return res.json(combinedDetails);
    } else {
      return res.json({ message: "admin not found" });
    }
  } catch (error) {
    console.log(error);
  }
};



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
  // acceptUser,
  // rejectUser,
  // acceptVendor,
  // rejectVendor,
  // registerCarType,
  // getCartypeslist,
  // blockCarType,
  // unblockCarType,
  // editCarType,
  getCarsList,
  blockCar,
  unblockCar,
  acceptCar,
  rejectCar,
  getVendorNameAndAdharImages,
  getCarouselList,
  deleteCarousel,
  editCarousel,
  loadEditCarousel,
  blockCarousel,
  unblockCarousel,
  getCompleteBookingList
};
