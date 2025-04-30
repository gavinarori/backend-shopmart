const axios = require("axios");
const moment = require("moment");
const Wallet = require("../../models/payment/walletModel");
const Transaction = require("../../models/payment/paymentModel");

// Generate B2C Access Token
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

const withdrawFunds = async (req, res) => {
  try {
    const sellerId = req.user._id; // Seller is authenticated
    const { amount, phone } = req.body;

    let wallet = await Wallet.findOne({ seller: sellerId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ status: "failed", error: "Insufficient wallet balance" });
    }

    const accessToken = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");

    const payload = {
      InitiatorName: "testapi",
      SecurityCredential: "YOUR_ENCRYPTED_CREDENTIAL", // You get this from Safaricom
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: "600987", // Shortcode
      PartyB: phone,
      Remarks: "Withdrawal from Wallet",
      QueueTimeOutURL: "https://yourdomain.com/api/b2c/timeout",
      ResultURL: "https://yourdomain.com/api/b2c/result",
      Occasion: "Withdrawal"
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const transaction = new Transaction({
      buyer: sellerId, // can reuse buyer for withdrawal by seller
      seller: sellerId,
      amount,
      phone,
      type: "withdrawal",
      status: "pending"
    });

    await transaction.save();

    // Deduct from wallet immediately (optional — or wait until callback)
    wallet.balance -= amount;
    wallet.transactions.push(transaction._id);
    await wallet.save();

    res.status(200).json({
      status: "success",
      message: "Withdrawal request sent successfully",
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      error: error.message
    });
  }
};

module.exports = { withdrawFunds };
