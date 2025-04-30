const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // The buyer
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // The seller
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // The purchased product
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  merchantRequestID: String,
  checkoutRequestID: String,
  mpesaReceiptNumber: String,
  transactionDate: String,
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
  resultCode: Number,
  resultDesc: String,
  type: {
    type: String,
    enum: ["deposit", "withdrawal"],
    default: "deposit"
  }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
