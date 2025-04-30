const express = require("express");
const { 
  initiateSTKPush,
  handleCallback,
  checkPaymentStatus
} = require("../controllers/payments/paymentController")
// const auth = require("../../middleware/auth");

const paymentRoutes = express.Router();

// Protected routes
// paymentRoutes.use(auth);
paymentRoutes.post("/stkpush", initiateSTKPush);
paymentRoutes.post("/check-status", checkPaymentStatus);

// Public callback endpoint
paymentRoutes.post("/callback", handleCallback);

module.exports = paymentRoutes;