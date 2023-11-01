// controllers/adminController.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Vendor = require("../models/vendorModel");
const ADMIN_TOKEN_SECRETKEY = process.env.admintoken_secretKey;
// const CarType = require("../models/carTypeModel");
const Car = require("../models/carModel");
const Carousel = require("../models/carouselModel");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const Booking = require("../models/bookingModel");
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
  // console.log(token);
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
    // console.log(req.body, "------------------");
    // console.log(req.files, "--------------");
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
    // console.log(imageUrls, "---------------");

    // Create a new carousel instance with image URLs
    const newCarousel = new Carousel({
      carouselImages: imageUrls,
      carouselName,
      carouselDescription,
    });

    // console.log(newCarousel, "---------newCarousel----------");
    // Save the new carousel to the database
    await newCarousel.save();
    // console.log(imageUrls, "imageUrls----------");

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
  // console.log(req.params.id, "this is the id of vendor");
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
  // console.log(id, "id in blockCar");
  const car = await Car.findById(id);
  car.blockStatus = true;
  await car.save();
  res.json({ message: "Car blocked successfully" });
};

const blockCarousel = async (req, res) => {
  const id = req.params.id;
  // console.log(id, "id in blockCarousel");
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

const unblockCarousel = async (req, res) => {
  const id = req.params.id;
  // console.log(id, "id in unblockCarousel");
  const carousel = await Carousel.findById(id);
  carousel.blockStatus = false;
  await carousel.save();
  res.json({ message: "Carousel unblocked successfully" });
};

const acceptCar = async (req, res) => {
  const id = req.params.id;
  // console.log(id, "id in acceptCar");
  const car = await Car.findById(id);
  car.verificationStatus = "Approved";
  await car.save();
  // console.log(car.vendorId,"--------vendorId of vendor");
  const vendor = await Vendor.findById(car.vendorId);
  // console.log(vendor,"-------vendor Details-------");
  // console.log(vendor.emailId, "--vendors emailId");
  var message = `Your car with the following details has been accepted:\n\n
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
  CarLocation:${car.carLocation}\n`;
  statusEmail(vendor.emailId, message);
  res.json({ message: "Car is Accepted" });
};

async function statusEmail(email, message) {
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
  // console.log(id, "id in rejectCar");
  const car = await Car.findById(id);
  car.verificationStatus = "Rejected";
  await car.save();
  // console.log(car.vendorId,"--------vendorId of vendor");
  const vendor = await Vendor.findById(car.vendorId);
  // console.log(vendor,"-------vendor Details-------");
  // console.log(vendor.emailId, "--vendors emailId");
  var message = `Your car with the following details has been rejected:\n\n
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
    CarLocation:${car.carLocation}\n`;
  // ... Add other car details as needed ...\n
  // \n\nReason for rejection: ${req.body.reason}`;
  statusEmail(vendor.emailId, message);
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
  // console.log(carousel);
  return res.json(carousel);
};

const deleteCarousel = async (req, res) => {
  const carouselId = req.params.carouselId;
  try {
    // Find the carousel by ID and remove it
    await Carousel.findByIdAndRemove(carouselId);
    // console.log(carouselId, "-------deleting carousel---------");
    res.status(200).json({ message: "Carousel deleted successfully" });
  } catch (error) {
    console.error("Error deleting carousel:", error);
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

    const updatedCarousel = await Carousel.findByIdAndUpdate(
      { _id: carouselId },
      {
        $set: {
          carouselName: name,
          carouselDescription: description,
          carouselImages: imageUrls,
        },
      }
    );
    return res.json(updatedCarousel);
  } catch (error) {
    console.log(error);
  }
};

const loadEditCarousel = async (req, res) => {
  try {
    const carouselId = req.params.carouselId;
    // console.log(carouselId, "----carouselId--------");
    const carousel = await Carousel.findById(carouselId);
    // console.log(carousel, "inside loadEditCarousel");
    return res.json(carousel);
  } catch (error) {
    console.log(error);
  }
};

const getCompleteBookingList = async (req, res) => {
  try {
    const adminEmailId = req.params.adminEmailId;
    // console.log(adminEmailId, "-----adminEmailId");
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
        const vendor = completeVendors.find(
          (v) => v._id.toString() === booking.vendorId.toString()
        );
        const car = completeCars.find(
          (c) => c._id.toString() === booking.carId.toString()
        );

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
            bookingId: booking._id,
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

const getStatsofAdmin = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const vendorCount = await Vendor.countDocuments();
    const carCount = await Car.countDocuments();

    // Get the start and end dates of the current week
    const { startDate, endDate } = getCurrentWeekDates();

    const totalBookingsThisWeek = await Booking.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });
    // console.log(calculateTotalBookingAmountWithinWeek());
    // console.log("---above---");
    let totalEarningsThisWeek;
    let x = await calculateEarningsThisWeek();
    totalEarningsThisWeek = 0.1 * x;

    let totalEarningsThisMonth;
    let y = await calculateEarningsPerMonth();
    totalEarningsThisMonth = 0.1 * y;
    // console.log(totalEarningsThisMonth, "-----totalEarningsThisMonth");
    // console.log(totalEarningsThisWeek, "---------totalEarningsThisWeek");
    return res.json({
      userCount,
      carCount,
      vendorCount,
      totalBookingsThisWeek,
      totalEarningsThisWeek,
      totalEarningsThisMonth,
    });
  } catch (error) {
    console.log(error);
  }
};

async function calculateEarningsThisWeek() {
  try {
    const { weekStartDate, weekEndDate } = getCurrentWeekDates();

    const result = await Booking.aggregate([
      {
        $match: {
          "bookingHistory.bookingStatus": {
            $in: ["trip ended", "booked and car not taken"],
          },
          createdAt: {
            $gte: weekStartDate,
            $lte: weekEndDate,
          },
        },
      },
      {
        $unwind: "$bookingHistory"
      },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: "$bookingHistory.Amount"
          },
        },
      },
    ]);

    if (result.length > 0) {
      return result[0].totalEarnings;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}


function getCurrentWeekDates() {
  const currentDate = new Date();
  const currentDay = currentDate.getUTCDay(); // Use getUTCDay to avoid time zone offsets
  const daysUntilSunday = 0 - currentDay;
  const daysUntilSaturday = 6 - currentDay;

  const startDate = new Date(currentDate);
  startDate.setUTCDate(currentDate.getUTCDate() + daysUntilSunday); // Set the start date to the beginning of the week (Sunday)
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(currentDate);
  endDate.setUTCDate(currentDate.getUTCDate() + daysUntilSaturday); // Set the end date to the end of the week (Saturday)
  endDate.setUTCHours(23, 59, 59, 999);

  return { startDate, endDate };
}

async function calculateEarningsPerMonth() {
  try {
    const { startMonthDate, endMonthDate } = getCurrentMonthDates();

    const result = await Booking.aggregate([
      {
        $match: {
          "bookingHistory.bookingStatus": {
            $in: ["trip ended", "booked and car not taken"],
          },
          createdAt: {
            $gte: startMonthDate,
            $lte: endMonthDate,
          },
        },
      },
      {
        $unwind: "$bookingHistory"
      },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: "$bookingHistory.Amount"
          },
        },
      },
    ]);

    // console.log(result,"------------result");
    if (result.length > 0) {
      return result[0].totalEarnings;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}

function getCurrentMonthDates() {
  const currentDate = new Date();
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();

  // Calculate the first day of the current month
  const startMonthDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // Calculate the last day of the current month
  const endMonthDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  return { startMonthDate, endMonthDate };
}

const getBookingsvsMonthandEarningsvsMonthChartInAdmin = async (req, res) => {
  try {
    const bookingData = await Booking.find({}, "createdAt"); // Fetch the 'createdAt' field

    // Process the data to count the number of bookings for each date
    const chartData = {};
    bookingData.forEach((booking) => {
      const createdAt = new Date(booking.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1; // Months are zero-based, so add 1
      const key = `${year}-${month}`;

      if (chartData[key]) {
        chartData[key]++;
      } else {
        chartData[key] = 1;
      }
    });

    // Prepare the data for the chart in a format that your charting library expects
    const chartDataArray = Object.entries(chartData).map(([key, count]) => ({
      month: key,
      count,
    }));

    const earningsData = await Booking.aggregate([
      {
        $match: {
          "bookingHistory": {
            $elemMatch: {
              "bookingStatus": {
                $in: ["trip ended", "booked and car not taken"]
              }
            }
          }
        }
      },
      {
        $unwind: "$bookingHistory" // Unwind the array to create a separate document for each booking
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalEarnings: { $sum: "$bookingHistory.Amount" }
        }
      },
      {
        $project: {
          _id: 1,
          totalEarnings: { $multiply: ["$totalEarnings", 0.1] } // Calculate 10% of totalEarnings
        }
      }
    ]);    
    
    console.log(earningsData, "-------earningsData");
    return res.json({chartDataArray,earningsData});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
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
  getCompleteBookingList,
  getStatsofAdmin,
  getBookingsvsMonthandEarningsvsMonthChartInAdmin,
};


// async function calculateTotalBookingAmountWithinWeek() {
//   try {
//     const { startDate, endDate } = getCurrentWeekDates();

//     console.log(startDate, endDate, "-------startDate and endDate");

//     // const result = await Booking.aggregate([
//     //   {
//     //     $match: {
//     //       'bookingHistory.bookingStatus': { $in: ['trip ended', 'booked and car not taken'] },
//     //       'bookingHistory.pickupDate': { $gte: startDate, $lte: endDate }
//     //     }
//     //   },
//     //   {
//     //     $group: {
//     //       _id: null, // Group all documents into a single group
//     //       totalAmount: {
//     //         $sum: '$bookingHistory.0.Amount' // Calculate the sum of Amount in the first element of bookingHistory
//     //       }
//     //     }
//     //   }
//     // ]);

//     const result = await Booking.aggregate([
//       {
//         $match: {
//           "bookingHistory.bookingStatus": {
//             $in: ["trip ended", "booked and car not taken"],
//           },
//           "bookingHistory.pickupDate": {
//             $gte: { $toDate: startDate },
//             $lte: { $toDate: endDate },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalAmount: {
//             $sum: "$bookingHistory.0.Amount",
//           },
//         },
//       },
//     ]);

//     console.log(result, "----result");

//     if (result.length > 0) {
//       // console.log('Total Amount within the current week:', result[0].totalAmount);
//       return result[0].totalAmount;
//     } else {
//       // console.log('No earnings within the current week.');
//       return 0;
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     return 0;
//   }
// }

// const getBookingsvsDateChartInAdmin = async (req, res) => {
//   try {
//     const bookingData = await Booking.find({}, 'createdAt'); // Fetch the 'createdAt' field

//     // Process the data to count the number of bookings for each date
//     const chartData = {};
//     bookingData.forEach((booking) => {
//       const date = booking.createdAt.toISOString().split('T')[0];
//       if (chartData[date]) {
//         chartData[date]++;
//       } else {
//         chartData[date] = 1;
//       }
//     });

//     // Prepare the data for the chart in a format that your charting library expects
//     const chartDataArray = Object.entries(chartData).map(([date, count]) => ({
//       date,
//       count,
//     }));
//     console.log(chartDataArray,"----------chartDataArray");
//     return res.json(chartDataArray);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// async function calculateEarningsPerMonth() {
//   try {
//     console.log("inside calculateEarningsPerMonth");
//     const { startMonthDate, endMonthDate } = getCurrentMonthDates();
//     console.log(startMonthDate,endMonthDate,"------startMonthDate and endMonthDate ");

//     const result = await Booking.find({
//       'bookingHistory[0].bookingStatus': { $in: ['trip ended', 'booked and car not taken'] },
//       'bookingHistory[0].pickupDate': { $gte: startMonthDate, $lte: endMonthDate }
//     });

//     console.log(result,"--------result");
//     if (result.length > 0) {
//       // Calculate earnings per month
//       const monthlyEarnings = {};

//       result.forEach((booking) => {
//         if (booking.bookingHistory[0] && booking.bookingHistory[0].Amount !== null && booking.bookingHistory[0].Amount !== undefined) {
//           const monthYear = booking.bookingHistory[0].pickupDate.substring(0, 7); // Extract YYYY-MM
//           if (!monthlyEarnings[monthYear]) {
//             monthlyEarnings[monthYear] = 0;
//           }
//           monthlyEarnings[monthYear] += booking.bookingHistory[0].Amount;
//         }
//       });
//       console.log(monthlyEarnings,"------monthlyEarnings");

//       return monthlyEarnings;
//     } else {
//       return {};
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     return {};
//   }
// }

// async function calculateEarningsPerMonth() {
//   try {
//     const { startMonthDate, endMonthDate } = getCurrentMonthDates();
//     // console.log(
//     //   startMonthDate,
//     //   endMonthDate,
//     //   "------startMonthDate and endMonthDate "
//     // );

//     // const result = await Booking.aggregate([
//     //   {
//     //     $match: {
//     //       "bookingHistory.0.bookingStatus": {
//     //         $in: ["trip ended", "booked and car not taken"],
//     //       },
//     //       // 'bookingHistory.0.pickupDate': {
//     //       //   $gte: { $toDate: startMonthDate },
//     //       //   $lte: { $toDate: endMonthDate }
//     //       // }
//     //     },
//     //   },
//     // ]);

//     const result = await Booking.aggregate([
//       {
//         $match: {
//           "bookingHistory.bookingStatus": {
//             $in: ["trip ended", "booked and car not taken"],
//           },
//           createdAt: {
//             $gte: startMonthDate,
//             $lte: endMonthDate,
//           },
//         },
//       },
//       {
//         $unwind: "$bookingHistory"
//       },
//       {
//         $group: {
//           _id: null,
//           totalEarnings: {
//             $sum: "$bookingHistory.Amount"
//           },
//         },
//       },
//     ]);

//     // const totalEarnings = [];
//     // let total = 0;

//     // result
//     //   .map((el) => el.bookingHistory)
//     //   .forEach((val) => {
//     //     val.forEach((a) => {
//     //       // console.log(a);
//     //       // console.log(startMonthDate.toString(), endMonthDate.toString(), new Date(a.returnDate)  );
//     //       if (
//     //         new Date(a.pickupDate) > startMonthDate &&
//     //         new Date(a.returnDate) < endMonthDate
//     //       ) {
//     //         totalEarnings.push(a);
//     //       }
//     //     });
//     //   });

//     // totalEarnings.forEach((e) => (total += e.Amount));

//     // //  console.log(bookingHistory, 'ellllllllllllllllllllllll')
//     // // console.log(totalEarnings, "dddddddddddddd", total);
//     // return total;
//     console.log(result,"------------result");
//     if (result.length > 0) {
//       return (result[0].totalEarnings*0.1);
//     } else {
//       return 0;
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     return 0;
//   }
// }
