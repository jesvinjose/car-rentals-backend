const express=require('express');
const connectDB = require('./db'); // Import the database configuration file
const app=express();
const port=process.env.PORT||5000;



// Connect to the database
connectDB();

const bodyParser=require('body-parser');
const cors=require('cors');

// Middleware
app.use(bodyParser.json());
app.use(cors());

const userRoutes=require('./routes/userRoutes');
const adminRoutes=require('./routes/adminRoutes');
const vendorRoutes=require('./routes/vendorRoutes');

app.use('/user',userRoutes);
app.use('/admin',adminRoutes);
app.use('/vendor',vendorRoutes);




app.listen(port, (r) => {
  
    console.log(`Server is running on port ${port}`);
  });