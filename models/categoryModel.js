const { Schema, model } = require('mongoose');

const categorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    bannerImage: {
        type: String
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        default: null
    },
    seo: {
        title: { type: String },
        description: { type: String }
    },
    featured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

categorySchema.index({ name: 'text' });

module.exports = model('categories', categorySchema);
