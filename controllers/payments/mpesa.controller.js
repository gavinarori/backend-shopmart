
const Transaction = require("../../models/payment/paymentModel");

const handleB2CResult = async (req, res) => {
  const result = req.body.Result;
  const transactionId = result.ConversationID;

  const transaction = await Transaction.findOne({ /* Match using metadata if you stored it */ });
  if (transaction) {
    transaction.status = result.ResultCode === 0 ? "completed" : "failed";
    transaction.resultCode = result.ResultCode;
    transaction.resultDesc = result.ResultDesc;
    await transaction.save();
  }

  res.status(200).send("B2C Result received");
};

const handleB2CTimeout = async (req, res) => {
  console.log("B2C Timeout", req.body);
  res.status(200).send("Timeout received");
};

module.exports = { handleB2CResult, handleB2CTimeout };
