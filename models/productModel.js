const { Schema, model } = require('mongoose');

const productSchema = new Schema({
    sellerId: {
        type: Schema.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    subCategory: {
        type: String,
        default: ''
    },
    brand: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    outOfStock: {
        type: Boolean,
        default: false
    },
    suppliers: [
        {
            name: {
                type: String,
                required: true
            },
            contact: {
                type: String,
                required: true
            },
            address: {
                type: String,
                default: ''
            }
        }
    ],
    discount: {
        type: Number,
        default: 0
    },
    finalPrice: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    specifications: {
        type: Map,
        of: String,
        default: {}
    },
    shopName: {
        type: String,
        required: true
    },
    images: [
        {
            url: {
                type: String,
                required: true
            },
            alt: {
                type: String,
                default: ''
            }
        }
    ],
    location: {
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    rating: {
        type: Number,
        default: 0
    },
    reviews: {
        type: Number,
        default: 0
    },
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        sales: {
            type: Number,
            default: 0
        }
    },
    tags: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    }
}, { timestamps: true });

productSchema.pre('save', function (next) {
    this.outOfStock = this.stock <= 0;
    this.finalPrice = this.price - (this.price * this.discount) / 100;
    next();
});

productSchema.index({
    name: 'text',
    category: 'text',
    brand: 'text',
    description: 'text'
}, {
    weights: {
        name: 5,
        category: 4,
        brand: 3,
        description: 2
    }
});

module.exports = model('products', productSchema);
