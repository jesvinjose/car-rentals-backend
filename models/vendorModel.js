const mongoose=require('mongoose');

const vendorSchema=mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    password:{
        type: String,
        required: true
    },
    emailId:{
        type: String,
        required: true
    },
    mobileNumber:{
        type:Number,
        required:true
    },
    address:{
        type: String,
    },
    pinCode:{
        type: String,
    },
    state:{
        type: String,
    },
    walletBalance:{
        type:Number,
        default:0
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    blockStatus:{
        type:Boolean,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    verificationStatus: {
        type: String,
        enum: ["pending", "Approved", "Rejected"],
        default: "pending",
    },
    
})

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;