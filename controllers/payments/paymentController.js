const mongoose = require("mongoose");
const axios = require("axios");
const moment = require("moment");
const Transaction = require("../../models/payment/paymentModel");
const Wallet = require("../../models/payment/walletModel");

const getAccessToken = async () => {
  const consumer_key = "YOUR_CONSUMER_KEY";
  const consumer_secret = "YOUR_CONSUMER_SECRET";
  const auth = "Basic " + Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  const response = await axios.get(
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: auth } }
  );

  return response.data.access_token;
};

const initiateSTKPush = async (req, res) => {
  try {
    let phoneNumber = req.body.phone;
    const { amount, sellerId, productId, shopName } = req.body;
    const buyerId = req.user._id; // from authenticated user

    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.slice(1);
    }

    const accessToken = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(
      "174379" + "YOUR_PASSKEY" + timestamp
    ).toString("base64");

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: "174379",
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: "174379",
        PhoneNumber: phoneNumber,
        CallBackURL: "https://yourdomain.com/api/callback",
        AccountReference: shopName,
        TransactionDesc: "Purchase on " + shopName
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const transaction = new Transaction({
      buyer: buyerId,
      seller: sellerId,
      product: productId,
      shopName,
      amount,
      phone: phoneNumber,
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID,
      status: 'pending'
    });

    await transaction.save();

    res.status(200).json({
      status: "success",
      message: "STK push sent to phone",
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      error: error.message,
    });
  }
};

// Handle M-Pesa Callback
const handleCallback = async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;
    const transaction = await Transaction.findOne({
      checkoutRequestID: callbackData.CheckoutRequestID
    });

    if (!transaction) {
      return res.status(404).json({ status: "failed", error: "Transaction not found" });
    }

    transaction.status = callbackData.ResultCode === 0 ? 'completed' : 'failed';
    transaction.resultCode = callbackData.ResultCode;
    transaction.resultDesc = callbackData.ResultDesc;

    if (callbackData.CallbackMetadata) {
      transaction.mpesaReceiptNumber = callbackData.CallbackMetadata.Item[1].Value;
      transaction.transactionDate = callbackData.CallbackMetadata.Item[3].Value;

      // Update seller wallet
      let wallet = await Wallet.findOne({ seller: transaction.seller });
      if (!wallet) {
        wallet = await Wallet.create({
          seller: transaction.seller,
          balance: transaction.amount,
          transactions: [transaction._id]
        });
      } else {
        wallet.balance += transaction.amount;
        wallet.transactions.push(transaction._id);
        await wallet.save();
      }
    }

    await transaction.save();
    res.status(200).send("Callback processed successfully");

  } catch (error) {
    res.status(500).json({ status: "failed", error: error.message });
  }
};

// Check Payment Status
const checkPaymentStatus = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      checkoutRequestID: req.body.checkoutRequestID
    });

    if (!transaction) {
      return res.status(404).json({ status: "failed", error: "Transaction not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        status: transaction.status,
        amount: transaction.amount,
        receipt: transaction.mpesaReceiptNumber,
        date: transaction.transactionDate
      }
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      error: error.message
    });
  }
};

module.exports = { initiateSTKPush, handleCallback, checkPaymentStatus };
