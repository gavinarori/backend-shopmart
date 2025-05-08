const axios = require("axios")
const moment = require("moment")
const Transaction = require("../../models/payment/paymentModel")
const Wallet = require("../../models/payment/walletModel")
const { broadcastPaymentUpdate } = require("../../utiles/websocket")

// Generate Access Token
const getAccessToken = async () => {
  const consumer_key = process.env.MPESA_CONSUMER_KEY
  const consumer_secret = process.env.MPESA_CONSUMER_SECRET
  const auth = "Basic " + Buffer.from(consumer_key + ":" + consumer_secret).toString("base64")

  const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: auth },
  })

  return response.data.access_token
}

// Get security credential
const getSecurityCredential = () => {
  // In production, this should be properly encrypted using M-Pesa's public key
  // For sandbox, you can use a placeholder or the actual encrypted credential
  return process.env.MPESA_SECURITY_CREDENTIAL || "Safaricom999!*!"
}

// Query transaction status directly from M-Pesa
const queryTransactionStatus = async (req, res) => {
  try {
    const { transactionId, checkoutRequestID } = req.body

    if (!transactionId && !checkoutRequestID) {
      return res.status(400).json({
        status: "failed",
        error: "Either transactionId or checkoutRequestID is required",
      })
    }

    // First, try to find the transaction in our database
    let transaction
    if (checkoutRequestID) {
      transaction = await Transaction.findOne({ checkoutRequestID })
    } else if (transactionId) {
      transaction = await Transaction.findOne({ mpesaReceiptNumber: transactionId })
    }

    if (!transaction) {
      return res.status(404).json({
        status: "failed",
        error: "Transaction not found in our records",
      })
    }

    // If transaction is already marked as completed or failed in our database, return that status
    if (transaction.status === "completed" || transaction.status === "failed") {
      return res.status(200).json({
        status: "success",
        data: {
          status: transaction.status,
          amount: transaction.amount,
          receipt: transaction.mpesaReceiptNumber,
          date: transaction.transactionDate,
          resultDesc: transaction.resultDesc,
          checkoutRequestID: transaction.checkoutRequestID,
        },
      })
    }

    // If transaction is still pending, query M-Pesa for the latest status
    const accessToken = await getAccessToken()
    const securityCredential = getSecurityCredential()

    // Prepare the request to M-Pesa Transaction Status API
    const requestBody = {
      Initiator: process.env.MPESA_INITIATOR_NAME || "testapi",
      SecurityCredential: securityCredential,
      CommandID: "TransactionStatusQuery",
      TransactionID: transaction.mpesaReceiptNumber || "",
      OriginatorConversationID: transaction.merchantRequestID || "",
      PartyA: process.env.MPESA_SHORTCODE || "174379",
      IdentifierType: "4", // For organization shortcode
      ResultURL: process.env.MPESA_RESULT_URL || "https://yourdomain.com/api/transaction-status/result",
      QueueTimeOutURL: process.env.MPESA_TIMEOUT_URL || "https://yourdomain.com/api/transaction-status/timeout",
      Remarks: "Check transaction status",
      Occasion: "Transaction status query",
    }

    // Make the request to M-Pesa
    const mpesaResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query",
      requestBody,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    // Store the response for debugging
    console.log("M-Pesa Transaction Status Response:", mpesaResponse.data)

    // Return the response to the client
    // Note: The actual status update will happen when M-Pesa calls our ResultURL
    res.status(200).json({
      status: "success",
      message: "Transaction status query initiated",
      data: {
        status: transaction.status,
        amount: transaction.amount,
        receipt: transaction.mpesaReceiptNumber,
        date: transaction.transactionDate,
        mpesaResponse: mpesaResponse.data,
        checkoutRequestID: transaction.checkoutRequestID,
      },
    })
  } catch (error) {
    console.error("Transaction Status Error:", error)
    res.status(500).json({
      status: "failed",
      error: error.message || "Failed to query transaction status",
    })
  }
}

// Handle the result from M-Pesa Transaction Status API
const handleTransactionStatusResult = async (req, res) => {
  try {
    const resultData = req.body.Result
    console.log("Transaction Status Result:", resultData)

    // Find the transaction status parameter
    const statusParam = resultData.ResultParameters.ResultParameter.find((param) => param.Key === "TransactionStatus")

    const receiptParam = resultData.ResultParameters.ResultParameter.find((param) => param.Key === "ReceiptNo")

    const amountParam = resultData.ResultParameters.ResultParameter.find((param) => param.Key === "Amount")

    // Update our transaction record
    if (statusParam && receiptParam) {
      const transactionStatus = statusParam.Value
      const receiptNo = receiptParam.Value

      const transaction = await Transaction.findOne({
        $or: [{ mpesaReceiptNumber: receiptNo }, { merchantRequestID: resultData.OriginatorConversationID }],
      })

      if (transaction) {
        // Update transaction status
        transaction.status = transactionStatus === "Completed" ? "completed" : "failed"
        transaction.resultDesc = resultData.ResultDesc

        // Update receipt number if not already set
        if (!transaction.mpesaReceiptNumber && receiptNo) {
          transaction.mpesaReceiptNumber = receiptNo
        }

        // Update amount if available
        if (amountParam && amountParam.Value) {
          transaction.amount = Number.parseFloat(amountParam.Value)
        }

        await transaction.save()

        // Broadcast the payment update
        broadcastPaymentUpdate(transaction)

        // If transaction is completed, update seller wallet
        if (transaction.status === "completed") {
          let wallet = await Wallet.findOne({ seller: transaction.seller })
          if (!wallet) {
            wallet = await Wallet.create({
              seller: transaction.seller,
              balance: transaction.amount,
              transactions: [transaction._id],
            })
          } else {
            wallet.balance += transaction.amount
            wallet.transactions.push(transaction._id)
            await wallet.save()
          }
        }
      }
    }

    res.status(200).send("Transaction status result processed successfully")
  } catch (error) {
    console.error("Transaction Status Result Error:", error)
    res.status(500).json({ status: "failed", error: error.message })
  }
}

// Handle timeout from M-Pesa Transaction Status API
const handleTransactionStatusTimeout = async (req, res) => {
  console.log("Transaction Status Timeout:", req.body)
  res.status(200).send("Transaction status timeout received")
}

module.exports = {
  queryTransactionStatus,
  handleTransactionStatusResult,
  handleTransactionStatusTimeout,
}
