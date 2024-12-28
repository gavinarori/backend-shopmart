const adminSellerMessage = require('../../models/chat/adminSellerMessage');
const sellerCustomerMessage = require('../../models/chat/sellerCustomerMessage');
const productModel = require('../../models/productModel');

const { mongo: { ObjectId } } = require('mongoose');
const { responseReturn } = require('../../utiles/response');

module.exports.get_seller_dashboard_data = async (req, res) => {
    const { id } = req;

    try {
        const totalProduct = await productModel.find({
            sellerId: new ObjectId(id)
        }).countDocuments();

        const messages = await sellerCustomerMessage.find({
            $or: [
                {
                    senderId: {
                        $eq: id
                    }
                },
                {
                    receverId: {
                        $eq: id
                    }
                }
            ]
        }).limit(3);

        responseReturn(res, 200, {
            messages,
            totalProduct
        });
    } catch (error) {
        console.log('get seller dashboard data error ' + error.messages);
    }
};

module.exports.get_admin_dashboard_data = async (req, res) => {
    try {
        const totalProduct = await productModel.find({}).countDocuments();

        const messages = await adminSellerMessage.find({}).limit(3);

        responseReturn(res, 200, {
            messages,
            totalProduct
        });

    } catch (error) {
        console.log('get admin dashboard data error ' + error.messages);
    }
};
