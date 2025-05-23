import mongoose, { Schema,  } from "mongoose"

const OrderSchema = new Schema({
  paymentId: { type: String, required: true },
  productId: { type: String, required: true },
  buyerId: { type: String },
  sellerId: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  platformCommission: { type: Number, required: true },
  sellerAmount: { type: Number, required: true },
  sellerPaid: { type: Boolean, default: false },
  sellerPaymentReference: { type: String },
  status: {
    type: String,
    enum: ["processing", "completed", "cancelled", "refunded"],
    default: "processing",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
})

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema)

