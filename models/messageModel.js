const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'  // Reference to the Booking model 
  }, // Store the room name or identifier
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Reference to the User model (assuming a user is the sender)
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'  // Reference to the User model (assuming a user is the sender)
  },
  messages: [
    {
      text: {
        type: String,
        required: true
      },
      sender: {
        type: String, // You might want to use a user or vendor ID here to specify the sender
        required: true
      },
      userName:{
        type: String, // You might want to use a user or vendor ID here to specify the sender
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true // Automatically add 'createdAt' and 'updatedAt' fields
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
