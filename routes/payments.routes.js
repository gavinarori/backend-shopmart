const express = require("express");
const { 
  initiateSTKPush,
  handleCallback,
  checkPaymentStatus
} = require("../controllers/payments/paymentController")
const { authMiddleware } = require('../middlewares/authMiddleware')
const router = require('express').Router()


// Protected routes
router.post("/stkpush",authMiddleware, initiateSTKPush);
router.post("/check-status",authMiddleware, checkPaymentStatus);

// Public callback
router.post("/callback", handleCallback);

module.exports = router;