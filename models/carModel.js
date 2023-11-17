const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
  },
  deliveryHub: {
    type: String,
    required: true,
  },
  fuelCapacity: {
    type: Number,
    required: true,
  },
  seatNumber: {
    type: Number,
    required: true,
  },
  mileage: {
    type: Number,
    required: true,
  },
  gearBoxType: {
    type: String,
    required: true,
  },
  fuelType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  rcNumber: {
    type: String,
    required: true,
  },
  rcImage: {
    type: String,
    required: true,
  },
  carImage: {
    type: String,
    required: true,
  },
  vendorId: {
    type: mongoose.Types.ObjectId,
    ref: "Vendor",
  },
  carTypeName: {
    type: String,
    required: true,
  },
  hourlyRentalRate: {
    type: Number,
    required: true,
  },
  dailyRentalRate: {
    type: Number,
    required: true,
  },
  monthlyRentalRate: {
    type: Number,
    required: true,
  },
  blockStatus: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "Approved", "Rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // New field for car location (latitude and longitude)
  carLocation: {
    type: {
      latitude: Number,
      longitude: Number,
    },
    required: true,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  distanceToUser: Number,
});

const Car = mongoose.model("Car", carSchema);
module.exports = Car;
