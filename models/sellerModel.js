const { Schema, model } = require('mongoose');

const sellerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        default: 'seller'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'suspended'],
        default: 'pending'
    },
    payment: {
        type: String,
        enum: ['inactive', 'active'],
        default: 'inactive'
    },
    method: {
        type: String,
        enum: ['manual', 'auto'],
        required: true,
    },
    image: {
        type: String,
        default: ''
    },
    shopInfo: {
        type: Object, // Change to an optional object
        default: {}   // Make sure it starts as an empty object
    },
    subscription: {
        type: String,
        enum: ['none', 'basic', 'premium'],
        default: 'none'
    },
    socialLinks: {
        type: Map,
        of: String, 
        default: {}
    },
    analytics: {
        sales: {
            type: Number,
            default: 0
        },
        productsListed: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        }
    },
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        promotions: {
            type: Boolean,
            default: true
        }
    }
}, { timestamps: true });

module.exports = model('sellers', sellerSchema);
