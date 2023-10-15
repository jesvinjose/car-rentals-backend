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
        enum: ["booked", "running", "cancelled"],
        default: "booked",
      },
      Amount: {
        type: Number,
      },
    },
  ],
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
