const mongoose=require("mongoose")

const carSchema=new mongoose.Schema({
    deliveryHub:{
        type:String,
        required:true
    },
    modelName:{
        type:String,
        required:true
    },
    fuelCapacity:{
        type:Number,
        required:true
    },
    gearBox:{
        type:String,
        required:true
    },
    seatNumber:{
        type:Number,
        required:true
    },
    mileage:{
        type:Number,
        required:true
    },
    fuelType:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    rcNumber:{
        type:String,
        required:true
    },
    rcImage:{
        type:String,
        required:true
    },
    carImage:{
        type:String,
        required:true
    },
    vendorId:{
        type:mongoose.Types.ObjectId,
        ref:'Vendor',
        required:true
    },
    carId:{
        type:mongoose.Types.ObjectId,
        ref:'CarType',
        required:true
    }
}) 

const Car=mongoose.model('Car',carSchema);
module.exports=Car;

// const User = mongoose.model('User', userSchema);
// module.exports = User;