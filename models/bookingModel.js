const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Types.ObjectId,
    ref: "Vendor",
  },
  carId: {
    type: mongoose.Types.ObjectId,
    ref: "Car",
  },
  startTripOtp:{
    type:Number,
  },
  endTripOtp:{
    type:Number
  },
  bookingHistory: [
    {
      pickupDate: {
        type: String,
        required:true
      },
      returnDate: {
        type: String,
        required:true
      },
      userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      }, 
      bookingStatus: {
        type: String,
        enum: ["booked", "running", "cancelled","trip ended","booked and car not taken"],
        default: "booked",
      },
      Amount: {
        type: Number,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the timestamp when a booking is created
  },
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
