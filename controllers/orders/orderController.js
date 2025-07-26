const orderModel = require('../../models/orderModel')
const cardModel = require('../../models/cardModel')
const sellerCustomerMessage = require('../../models/chat/sellerCustomerMessage')
const { responseReturn } = require('../../utiles/response')
const { mongo: { ObjectId } } = require('mongoose')

class orderController {
  // Create new order
  createOrder = async (req, res) => {
    const {
      customerId,
      sellerId,
      products,
      totalAmount,
      orderFee,
      shippingFee,
      deliveryAddress,
      deliveryInstructions,
      expectedDeliveryDate,
      customerNotes
    } = req.body

    console.log('Received order data:', {
      customerId,
      sellerId,
      products: products?.length,
      totalAmount,
      orderFee,
      shippingFee,
      deliveryAddress,
      expectedDeliveryDate
    })

    try {
      // Generate unique order ID
      const timestamp = Date.now().toString()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const orderId = `ORD-${timestamp}-${random}`

      console.log('Generated order ID:', orderId)

      // Create the order
      const order = await orderModel.create({
        orderId,
        customerId,
        sellerId,
        products,
        totalAmount,
        orderFee,
        shippingFee,
        deliveryAddress,
        deliveryInstructions,
        expectedDeliveryDate,
        customerNotes
      })

      console.log('Order created successfully:', order.orderId)

      // Clear cart items for this customer and seller
      await cardModel.deleteMany({
        userId: customerId,
        productId: { $in: products.map(p => p.productId) }
      })

      // Send notification message to seller
      const notificationMessage = await sellerCustomerMessage.create({
        senderId: customerId,
        senderName: 'System',
        receverId: sellerId,
        message: `New order received! Order ID: ${order.orderId}. Total amount: $${totalAmount.toFixed(2)}. Please check your dashboard for details.`
      })

      responseReturn(res, 201, {
        message: 'Order created successfully',
        order,
        notificationMessage
      })
    } catch (error) {
      console.log('Create order error:', error.message)
      
      // Provide more specific error messages
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message)
        return responseReturn(res, 400, {
          error: `Validation failed: ${validationErrors.join(', ')}`
        })
      }
      
      if (error.code === 11000) {
        return responseReturn(res, 400, {
          error: 'Order ID already exists. Please try again.'
        })
      }
      
      responseReturn(res, 500, {
        error: 'Failed to create order'
      })
    }
  }

  // Get customer orders
  getCustomerOrders = async (req, res) => {
    const { customerId } = req.params

    try {
      const orders = await orderModel.find({ customerId })
        .populate('sellerId', 'shopInfo.shopName image')
        .populate('products.productId', 'name images')
        .sort({ createdAt: -1 })

      responseReturn(res, 200, {
        orders
      })
    } catch (error) {
      console.log('Get customer orders error:', error.message)
      responseReturn(res, 500, {
        error: 'Failed to fetch orders'
      })
    }
  }

  // Get seller orders
  getSellerOrders = async (req, res) => {
    const { sellerId } = req.params

    try {
      const orders = await orderModel.find({ sellerId })
        .populate('customerId', 'name email')
        .populate('products.productId', 'name images')
        .sort({ createdAt: -1 })

      responseReturn(res, 200, {
        orders
      })
    } catch (error) {
      console.log('Get seller orders error:', error.message)
      responseReturn(res, 500, {
        error: 'Failed to fetch orders'
      })
    }
  }

  // Get single order
  getOrder = async (req, res) => {
    const { orderId } = req.params

    try {
      const order = await orderModel.findOne({ orderId })
        .populate('customerId', 'name email phone')
        .populate('sellerId', 'shopInfo.shopName image')
        .populate('products.productId', 'name images description')

      if (!order) {
        return responseReturn(res, 404, {
          error: 'Order not found'
        })
      }

      responseReturn(res, 200, {
        order
      })
    } catch (error) {
      console.log('Get order error:', error.message)
      responseReturn(res, 500, {
        error: 'Failed to fetch order'
      })
    }
  }

  // Update order status (seller only)
  updateOrderStatus = async (req, res) => {
    const { orderId } = req.params
    const { orderStatus, sellerNotes } = req.body
    const sellerId = req.id // From auth middleware

    try {
      const order = await orderModel.findOne({ orderId, sellerId })

      if (!order) {
        return responseReturn(res, 404, {
          error: 'Order not found or unauthorized'
        })
      }

      order.orderStatus = orderStatus
      if (sellerNotes) {
        order.sellerNotes = sellerNotes
      }
      order.updatedAt = new Date()

      await order.save()

      // Send notification to customer about status update
      await sellerCustomerMessage.create({
        senderId: sellerId,
        senderName: 'System',
        receverId: order.customerId,
        message: `Your order ${orderId} status has been updated to: ${orderStatus}. ${sellerNotes ? `Notes: ${sellerNotes}` : ''}`
      })

      responseReturn(res, 200, {
        message: 'Order status updated successfully',
        order
      })
    } catch (error) {
      console.log('Update order status error:', error.message)
      responseReturn(res, 500, {
        error: 'Failed to update order status'
      })
    }
  }

  // Calculate order fee based on location
  calculateOrderFee = async (req, res) => {
    const { location, totalAmount } = req.body

    try {
      // Simple fee calculation based on location
      let orderFee = 0
      let shippingFee = 0

      // Base order fee
      orderFee = Math.max(5, totalAmount * 0.05) // 5% or minimum $5

      // Shipping fee based on location
      switch (location?.toLowerCase()) {
        case 'nairobi':
          shippingFee = 10
          break
        case 'mombasa':
        case 'kisumu':
          shippingFee = 15
          break
        default:
          shippingFee = 20
      }

      responseReturn(res, 200, {
        orderFee,
        shippingFee,
        totalFee: orderFee + shippingFee
      })
    } catch (error) {
      console.log('Calculate order fee error:', error.message)
      responseReturn(res, 500, {
        error: 'Failed to calculate fees'
      })
    }
  }

  // Get order statistics
  getOrderStats = async (req, res) => {
    const { sellerId } = req.params

    try {
      const totalOrders = await orderModel.countDocuments({ sellerId })
      const pendingOrders = await orderModel.countDocuments({ 
        sellerId, 
        orderStatus: 'pending' 
      })
      const completedOrders = await orderModel.countDocuments({ 
        sellerId, 
        orderStatus: 'delivered' 
      })

      const totalRevenue = await orderModel.aggregate([
        { $match: { sellerId: new ObjectId(sellerId) } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])

      responseReturn(res, 200, {
        stats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        }
      })
    } catch (error) {
      console.log('Get order stats error:', error.message)
      responseReturn(res, 500, {
        error: 'Failed to fetch order statistics'
      })
    }
  }
}

module.exports = new orderController() 