const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: String, // Store the room name or identifier
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Reference to the User model (assuming a user is the sender)
  },
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Automatically add 'createdAt' and 'updatedAt' fields
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
