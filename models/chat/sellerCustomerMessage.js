const { Schema, model } = require('mongoose');

const sellerCustomerSchema = new Schema({
    senderName: {
        type: String,
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'file', 'audio', 'link'],
        default: 'text'
    },
    attachments: [
        {
            url: {
                type: String,
                required: true
            },
            fileType: {
                type: String,
                required: true
            },
            fileName: {
                type: String,
                default: ''
            }
        }
    ],
    metadata: {
        isEdited: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    status: {
        type: String,
        enum: ['unseen', 'seen', 'delivered'],
        default: 'unseen'
    }
}, { timestamps: true });

module.exports = model('seller_customer_messages', sellerCustomerSchema);
