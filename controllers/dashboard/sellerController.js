const sellerModel = require('../../models/sellerModel');
const { responseReturn } = require('../../utiles/response');
const cloudinary = require('cloudinary').v2;

class sellerController {
    get_seller_request = async (req, res) => {
        const { page, searchValue, parPage } = req.query;
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);
        try {
            const query = { status: 'pending' };
            if (searchValue) query.$text = { $search: searchValue };

            const sellers = await sellerModel.find(query).skip(skipPage).limit(parPage).sort({ createdAt: -1 });
            const totalSeller = await sellerModel.countDocuments(query);
            responseReturn(res, 200, { totalSeller, sellers });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_seller = async (req, res) => {
        const { sellerId } = req.params;
        try {
            const seller = await sellerModel.findById(sellerId);
            if (!seller) {
                return responseReturn(res, 404, { error: 'Seller not found' });
            }
            responseReturn(res, 200, { seller });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    seller_status_update = async (req, res) => {
        const { sellerId, status } = req.body;
        try {
            if (!['pending', 'approved', 'suspended'].includes(status)) {
                return responseReturn(res, 400, { error: 'Invalid status value' });
            }

            const seller = await sellerModel.findByIdAndUpdate(
                sellerId,
                { status },
                { new: true }
            );
            if (!seller) {
                return responseReturn(res, 404, { error: 'Seller not found' });
            }
            responseReturn(res, 200, { seller, message: 'Seller status updated successfully' });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    update_seller_profile = async (req, res) => {
        const { sellerId } = req.params;
        const form = formidable();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: 'Form parsing error' });
            }

            const { name, email, shopInfo, socialLinks, preferences } = fields;
            const { image, logo } = files;

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true,
            });

            try {
                let updatedFields = {};

                if (name) updatedFields.name = name;
                if (email) updatedFields.email = email;
                if (shopInfo) updatedFields.shopInfo = JSON.parse(shopInfo);
                if (socialLinks) updatedFields.socialLinks = JSON.parse(socialLinks);
                if (preferences) updatedFields.preferences = JSON.parse(preferences);

                if (image) {
                    const result = await cloudinary.uploader.upload(image.filepath, { folder: 'sellers' });
                    updatedFields.image = result.url;
                }

                if (logo) {
                    const result = await cloudinary.uploader.upload(logo.filepath, { folder: 'shop-logos' });
                    updatedFields.shopInfo = {
                        ...updatedFields.shopInfo,
                        logo: result.url,
                    };
                }

                const seller = await sellerModel.findByIdAndUpdate(sellerId, updatedFields, { new: true });
                if (!seller) {
                    return responseReturn(res, 404, { error: 'Seller not found' });
                }

                responseReturn(res, 200, { seller, message: 'Seller profile updated successfully' });
            } catch (error) {
                responseReturn(res, 500, { error: error.message });
            }
        });
    };

    get_sellers_by_status = async (req, res) => {
        const { page, searchValue, parPage, status } = req.query;
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);
        try {
            const query = { status };
            if (searchValue) query.$text = { $search: searchValue };

            const sellers = await sellerModel.find(query).skip(skipPage).limit(parPage).sort({ createdAt: -1 });
            const totalSeller = await sellerModel.countDocuments(query);

            responseReturn(res, 200, { totalSeller, sellers });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_seller_analytics = async (req, res) => {
        const { sellerId } = req.params;
        try {
            const seller = await sellerModel.findById(sellerId, 'analytics');
            if (!seller) {
                return responseReturn(res, 404, { error: 'Seller not found' });
            }
            responseReturn(res, 200, { analytics: seller.analytics });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };
    get_active_sellers = async (req, res) => {
        const { page = 1, searchValue, parPage = 10 } = req.query;
    
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);
    
        try {
            const query = { status: 'approved' }; // Updated to match the schema's `approved` status.
            if (searchValue) query.$text = { $search: searchValue };
    
            const sellers = await sellerModel
                .find(query)
                .skip(skipPage)
                .limit(parseInt(parPage))
                .sort({ createdAt: -1 });
    
            const totalSeller = await sellerModel.countDocuments(query);
    
            responseReturn(res, 200, { totalSeller, sellers });
        } catch (error) {
            console.error('Error fetching active sellers:', error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };
    
    get_deactive_sellers = async (req, res) => {
        const { page = 1, searchValue, parPage = 10 } = req.query;
    
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);
    
        try {
            const query = { status: 'suspended' }; 
            if (searchValue) query.$text = { $search: searchValue };
    
            const sellers = await sellerModel
                .find(query)
                .skip(skipPage)
                .limit(parseInt(parPage))
                .sort({ createdAt: -1 });
    
            const totalSeller = await sellerModel.countDocuments(query);
    
            responseReturn(res, 200, { totalSeller, sellers });
        } catch (error) {
            console.error('Error fetching deactive sellers:', error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };
    
}

module.exports = new sellerController();
