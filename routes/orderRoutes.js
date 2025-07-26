const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orders/orderController')
const { authMiddleware } = require('../middlewares/authMiddleware')

// Create new order
router.post('/create', authMiddleware, orderController.createOrder)

// Get customer orders
router.get('/customer/:customerId', authMiddleware, orderController.getCustomerOrders)

// Get seller orders
router.get('/seller/:sellerId', authMiddleware, orderController.getSellerOrders)

// Get single order
router.get('/:orderId', authMiddleware, orderController.getOrder)

// Update order status (seller only)
router.put('/:orderId/status', authMiddleware, orderController.updateOrderStatus)

// Calculate order fees
router.post('/calculate-fees', orderController.calculateOrderFee)

// Get order statistics
router.get('/stats/:sellerId', authMiddleware, orderController.getOrderStats)

module.exports = router 