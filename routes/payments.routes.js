const express = require("express");
const { 
  initiateSTKPush,
  handleCallback,
  checkPaymentStatus
} = require("../controllers/payments/paymentController")
const { authMiddleware } = require('../middlewares/authMiddleware')
const transactionStatusController = require("../controllers/payments/transactionStatusController")

const router = require('express').Router()


// Protected routes
router.post("/stkpush",authMiddleware, initiateSTKPush);
router.post("/check-status",authMiddleware, checkPaymentStatus);

// Public callback
router.post("/callback", handleCallback);

router.post("/transaction-status", transactionStatusController.queryTransactionStatus)
router.post("/transaction-status/result", transactionStatusController.handleTransactionStatusResult)
router.post("/transaction-status/timeout", transactionStatusController.handleTransactionStatusTimeout)

module.exports = router;