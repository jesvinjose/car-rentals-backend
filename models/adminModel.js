const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
   emailId: {
      type: String,
      required: true
   },
   password: {
      type: String,
      required: true
   },
   walletBalance:{
      type:Number,
      default:0
   }

});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
