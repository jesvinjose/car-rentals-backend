const express=require('express');
const connectDB = require('./db'); // Import the database configuration file
const app=express();
const port=process.env.PORT||5000;

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dz0rmyh4n',
  api_key: '891497115833535',
  api_secret: 'IeuiwEaiE1XmHihxOi4NG9kqwiQ',
});


// Connect to the database
connectDB();

const bodyParser=require('body-parser');
const cors=require('cors');

// Parse incoming requests with JSON payloads
app.use(bodyParser.json({ limit: '10mb' })); // Adjust the limit as needed

// Middleware
// app.use(bodyParser.json());
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