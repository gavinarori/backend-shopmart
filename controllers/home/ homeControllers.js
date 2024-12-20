const categoryModel = require('../../models/categoryModel');
const productModel = require('../../models/productModel');
const queryProducts = require('../../utiles/queryProducts');
const reviewModel = require('../../models/reviewModel');
const moment = require('moment');
const { mongo: { ObjectId } } = require('mongoose');
const { responseReturn } = require('../../utiles/response');

class homeControllers {

    formateProduct = (products) => {
        const productArray = [];
        let i = 0;
        while (i < products.length) {
            let temp = [];
            let j = i;
            while (j < i + 3) {
                if (products[j]) {
                    temp.push(products[j]);
                }
                j++;
            }
            productArray.push([...temp]);
            i = j;
        }
        return productArray;
    };

    get_categorys = async (req, res) => {
        try {
            const categories = await categoryModel.find({});
            responseReturn(res, 200, { categories });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_products = async (req, res) => {
        try {
            const products = await productModel.find({}).limit(16).sort({ createdAt: -1 });
            const latestProducts = await productModel.find({}).limit(9).sort({ createdAt: -1 });
            const latest_product = this.formateProduct(latestProducts);

            const topRatedProducts = await productModel.find({}).limit(9).sort({ rating: -1 });
            const topRated_product = this.formateProduct(topRatedProducts);

            const discountProducts = await productModel.find({}).limit(9).sort({ discount: -1 });
            const discount_product = this.formateProduct(discountProducts);

            responseReturn(res, 200, { products, latest_product, topRated_product, discount_product });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_product = async (req, res) => {
        const { slug } = req.params;
        try {
            const product = await productModel.findOne({ slug }).populate('category').populate('sellerId');
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found' });
            }

            const relatedProducts = await productModel.find({
                _id: { $ne: product.id },
                category: product.category
            }).limit(20);

            const moreProducts = await productModel.find({
                _id: { $ne: product.id },
                sellerId: product.sellerId
            }).limit(3);

            responseReturn(res, 200, { product, relatedProducts, moreProducts });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };

    price_range_product = async (req, res) => {
        try {
            const priceRange = { low: 0, high: 0 };
            const products = await productModel.find({}).limit(9).sort({ createdAt: -1 });
            const latest_product = this.formateProduct(products);

            const priceSortedProducts = await productModel.find({}).sort({ price: 1 });
            if (priceSortedProducts.length > 0) {
                priceRange.high = priceSortedProducts[priceSortedProducts.length - 1].price;
                priceRange.low = priceSortedProducts[0].price;
            }

            responseReturn(res, 200, { latest_product, priceRange });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };

    query_products = async (req, res) => {
        const parPage = 12;
        req.query.parPage = parPage;
        try {
            const products = await productModel.find({}).sort({ createdAt: -1 });
            const totalProduct = new queryProducts(products, req.query)
                .categoryQuery()
                .searchQuery()
                .priceQuery()
                .ratingQuery()
                .sortByPrice()
                .countProducts();

            const result = new queryProducts(products, req.query)
                .categoryQuery()
                .searchQuery()
                .ratingQuery()
                .priceQuery()
                .sortByPrice()
                .skip()
                .limit()
                .getProducts();

            responseReturn(res, 200, { products: result, totalProduct, parPage });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };

    submit_review = async (req, res) => {
        const { name, rating, review, productId } = req.body;
        try {
            await reviewModel.create({
                productId,
                name,
                rating,
                review,
                date: moment(Date.now()).format('LL')
            });

            const reviews = await reviewModel.find({ productId });
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            const averageRating = (reviews.length > 0) ? (totalRating / reviews.length).toFixed(1) : 0;

            await productModel.findByIdAndUpdate(productId, { rating: averageRating });

            responseReturn(res, 201, { message: 'Review submitted successfully' });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_reviews = async (req, res) => {
        const { productId } = req.params;
        let { pageNo } = req.query;
        pageNo = parseInt(pageNo) || 1;
        const limit = 5;
        const skipPage = limit * (pageNo - 1);
        try {
            const ratingCounts = await reviewModel.aggregate([
                {
                    $match: { productId: new ObjectId(productId) }
                },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const ratingReviewSummary = [5, 4, 3, 2, 1].map(rating => {
                const found = ratingCounts.find(r => r._id === rating);
                return { rating, sum: found ? found.count : 0 };
            });

            const totalReviews = await reviewModel.countDocuments({ productId });
            const reviews = await reviewModel.find({ productId }).skip(skipPage).limit(limit).sort({ createdAt: -1 });

            responseReturn(res, 200, { reviews, totalReviews, ratingReviewSummary });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };
}

module.exports = new homeControllers();
