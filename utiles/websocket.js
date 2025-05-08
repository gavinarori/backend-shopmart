const WebSocket = require("ws")
const http = require("http")

let wss

// Initialize WebSocket server
const initializeWebSocketServer = (server) => {
  wss = new WebSocket.Server({ server })

  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket")

    // Send a welcome message
    ws.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to payment notification service",
      }),
    )

    // Handle client messages
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message)
        console.log("Received message:", data)

        // Client can subscribe to specific transaction updates
        if (data.type === "subscribe" && data.checkoutRequestID) {
          ws.checkoutRequestID = data.checkoutRequestID
          ws.send(
            JSON.stringify({
              type: "subscribed",
              checkoutRequestID: data.checkoutRequestID,
              message: `Subscribed to updates for transaction ${data.checkoutRequestID}`,
            }),
          )
        }
      } catch (error) {
        console.error("Error processing message:", error)
      }
    })

    ws.on("close", () => {
      console.log("Client disconnected from WebSocket")
    })
  })

  console.log("WebSocket server initialized")
  return wss
}

// Broadcast payment update to all clients or specific clients
const broadcastPaymentUpdate = (transaction) => {
  if (!wss) {
    console.error("WebSocket server not initialized")
    return
  }

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      // Send to clients subscribed to this specific transaction or to all clients if no subscription
      (!client.checkoutRequestID || client.checkoutRequestID === transaction.checkoutRequestID)
    ) {
      client.send(
        JSON.stringify({
          type: "payment_update",
          transaction: {
            checkoutRequestID: transaction.checkoutRequestID,
            status: transaction.status,
            amount: transaction.amount,
            receipt: transaction.mpesaReceiptNumber,
            date: transaction.transactionDate,
            resultDesc: transaction.resultDesc,
          },
        }),
      )
    }
  })
}

module.exports = {
  initializeWebSocketServer,
  broadcastPaymentUpdate,
}
