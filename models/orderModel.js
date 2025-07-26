const { Schema, model } = require('mongoose')

const orderSchema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: Schema.ObjectId,
    ref: 'customers',
    required: true
  },
  sellerId: {
    type: Schema.ObjectId,
    ref: 'sellers',
    required: true
  },
  products: [{
    productId: {
      type: Schema.ObjectId,
      ref: 'products',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productImage: {
      type: String
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  orderFee: {
    type: Number,
    default: 0
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  deliveryInstructions: {
    type: String
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  sellerNotes: {
    type: String
  },
  customerNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

module.exports = model('orders', orderSchema) 