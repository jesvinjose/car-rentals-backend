const mongoose=require('mongoose');

const userSchema=mongoose.Schema({
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
        type: Number,
    },
    state:{
        type: String,
    },
    aadharNumber:{
        type:Number,
    },
    dlNumber:{
        type:String,
    },
    aadharFrontImage:{
        type:String,
    },
    aadharBackImage:{
        type:String,
    },
    dlFrontImage:{
        type:String,
    },
    dlBackImage:{
        type:String,
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
    bookingHistory:{
        type:Array
    },
    profileImage:{
        type:String,
    }
    // verificationStatus: {
    //     type: String,
    //     enum: ["pending", "Approved", "Rejected"],
    //     default: "pending",
    // },
    
})

const User = mongoose.model('User', userSchema);
module.exports = User;
