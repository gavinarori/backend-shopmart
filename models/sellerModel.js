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
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        address: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        },
        rating: {
            type: Number,
            default: 0
        },
        reviews: {
            type: Number,
            default: 0
        }
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

sellerSchema.index({
    name: 'text',
    email: 'text',
    'shopInfo.name': 'text',
    'shopInfo.description': 'text'
}, {
    weights: {
        name: 5,
        email: 4,
        'shopInfo.name': 3,
        'shopInfo.description': 2
    }
});

module.exports = model('sellers', sellerSchema);
