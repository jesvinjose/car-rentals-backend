require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto"); // Import the crypto module

const router = express.Router();

router.post("/orders", async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const amount = req.body.amount

    const options = {
      amount: amount*100, // amount in smallest currency unit
      currency: "INR",
      receipt: "receipt_order_74394",
    };

    const order = await instance.orders.create(options);
    console.log(order,"----order--------");
    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/success", async (req, res) => {
  try {
    const secret = "SqOE5s0LXNKEUnmztybQzVkn";
    // getting the details back from our font-end
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    // console.log(razorpaySignature,"-------razorpaySignature");

    // Calculate the expected signature
    const generatedSignature =crypto
      .createHmac("sha256", secret)
      .update(`${orderCreationId}|${razorpayPaymentId}`)
      .digest("hex");


    //   console.log(generatedSignature,"------generatedSignature");

    // Compare the calculated signature with the provided signature
    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ msg: "Transaction not legit!" });
    }

    // Payment is legit and verified
    // You can save the details in your database if needed

    res.json({
      msg: "success",
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    console.error("Error in /success route:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;