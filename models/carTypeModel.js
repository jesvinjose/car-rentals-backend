const mongoose=require("mongoose");

const carTypeSchema=new mongoose.Schema({
    carTypeName:{
        type:String,
        required:true
    },
    hourlyRentalRate:{
        type:Number,
        required:true
    },
    dailyRentalRate:{
        type:Number,
        required:true
    },
    monthlyRentalRate:{
        type:Number,
        required:true
    },
    verificationStatus:{
        type: String,
        enum: ["pending", "Approved", "Rejected"],
        default: "pending",
    },
    blockStatus:{
        type:Boolean,
        default:false
    },
})

const CarType=mongoose.model('CarType',carTypeSchema);
module.exports=CarType;