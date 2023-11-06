const express = require("express");
const connectDB = require("./db"); // Import the database configuration file
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const Booking = require("./models/bookingModel");
// app.use(express.json());
const Admin = require("./models/adminModel");
const Vendor = require("./models/vendorModel");
const User = require("./models/userModel");
const http = require("http");
const Server = require("socket.io").Server;
const { ObjectId } = require("mongodb");

const messageModel = require("./models/messageModel"); // Your message model

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
  max_file_size: 500000000,
});

// Connect to the database
connectDB();

app.options("*", cors()); // Enable pre-flight requests for all routes
// Parse incoming requests with JSON payloads
app.use(bodyParser.json({ limit: "500mb" })); // Adjust the limit as needed

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

app.use(cors({ origin: true, credentials: true }));

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
// const { default: axiosInstance } = require("../frontend/src/api/axiosInstance");

app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/vendor", vendorRoutes);
app.use("/payment", paymentRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const server1 = server.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  const admin = await Admin.findOne({ emailId: "admin@gmail.com" });

  // console.log(admin.walletBalance);
  cron.schedule("0 0 * * *", async () => {
    try {
      let currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so add 1 and pad with leading zero if necessary
      const day = String(currentDate.getDate()).padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;

      // console.log(formattedDate); // Example output: "2023-10-16"
      console.log("At every 24 hrs.");
      const bookings = await Booking.find();
      // console.log(bookings[0]);
      for (let i = 0; i < bookings.length; i++) {
        // if(bookings[i].bookingHistory[0].returnDate<=formattedDate && bookings[i].bookingHistory[0].bookingStatus === "booked"){
        //   console.log(bookings[i]._id,"------booking id");
        // }
        if (
          bookings[i].bookingHistory[0].bookingStatus === "booked" &&
          bookings[i].bookingHistory[0].returnDate === formattedDate
        ) {
          bookings[i].bookingHistory[0].bookingStatus =
            "booked and car not taken";
          let BookingId = bookings[i]._id;
          console.log(BookingId, "--------BookingId");

          const userId = bookings[i].bookingHistory[0].userId;
          // Update the booking status
          const result = await User.updateOne(
            { _id: userId, "bookingHistory.bookingId": BookingId },
            {
              $set: {
                "bookingHistory.$.bookingStatus": "booked and car not taken",
              },
            }
          );

          let vendor = await Vendor.findById(bookings[i].vendorId);
          // console.log(vendor.walletBalance, "initial");
          vendor.walletBalance += 0.9 * bookings[i].bookingHistory[0].Amount;
          // console.log(vendor.walletBalance);

          //No need to subtract here admin wallet is to be increased only when the trip ends or at the end of
          //return date if car not taken
          // admin.walletBalance -= 0.9 * bookings[i].bookingHistory[0].Amount;

          admin.walletBalance += 0.1 * bookings[i].bookingHistory[0].Amount;
          // console.log(admin.walletBalance);
          await vendor.save();
          await admin.save();
          await bookings[i].save(); // Save the individual booking
        }
      }
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
});


io.on("connection", (socket) => {
  socket.on("listMessages", async (data) => {
    try {
      const { bookingId, userId, vendorId } = data;
      // Retrieve messages from MongoDB
      const messages = await messageModel.findOne({ bookingId: bookingId });

      // Emit the messages to the client
      socket.emit("messageList", messages);
    } catch (err) {
      console.error(err);
    }
  });
  socket.on("addMessage", async (data) => {
    try {
      const { bookingId, userId, vendorId, message, currentUserId } = data;

      const messageExist = await messageModel.findOne({ bookingId: bookingId });

      const user = await User.findById(currentUserId);
      if (user) {
        var userName = user.firstName;
      }

      const vendor = await Vendor.findById(currentUserId);
      if (vendor) {
        var userName = vendor.firstName;
      }

      if (messageExist) {
        const newMessage = {
          text: message,
          sender: currentUserId, // Replace with the sender's ID
          userName: userName,
        };

        const updateResult = await messageModel.updateOne(
          { bookingId: bookingId },
          {
            $push: {
              messages: newMessage,
            },
          }
        );
        // console.log(updateResult, "---------updateResult----------");
      } else {
        const newMessage = new messageModel({
          bookingId: new ObjectId(bookingId), // Replace with the actual Booking ID
          userId: new ObjectId(userId), // Replace with the actual User ID
          vendorId: new ObjectId(vendorId), // Replace with the actual Vendor ID
          // room:roomName,
          messages: [
            {
              text: message,
              sender: currentUserId, // Replace with the sender's ID
              userName: userName,
            },
            // Add more messages as needed
          ],
        });
        // console.log(newMessage,"--new Message");

        newMessage
          .save()
          .then((savedMessage) => {
            // console.log("Message saved:", savedMessage);
            // Handle the success case
          })
          .catch((error) => {
            console.error("Error saving message:", error);
            // Handle the error case
          });
      }

      // // Emit the messages to the client
      // socket.emit("messageAdded");
      // Emit the "messageAdded" event to all connected sockets
      io.emit("messageAdded");
    } catch (err) {
      console.error(err);
    }
  });
});
