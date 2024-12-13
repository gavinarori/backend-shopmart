const formidable = require('formidable');
const cloudinary = require('cloudinary').v2;
const productModel = require('../../models/productModel');
const { responseReturn } = require('../../utiles/response');

class productController {
    add_product = async (req, res) => {
        const { id } = req;
        const form = formidable({ multiples: true });

        form.parse(req, async (err, field, files) => {
            if (err) {
                return responseReturn(res, 500, { error: "Error parsing the form data" });
            }

            let {
                name,
                category,
                description,
                stock,
                price,
                discount,
                shopName,
                brand,
                city,
                state,
                country,
                tags,
                specifications,
                supplierName,
                supplierContact,
                supplierAddress
            } = field;

            const { images } = files;
            name = name.trim();
            const slug = name.split(' ').join('-');

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            });

            try {
                let allImageUrl = [];

                const imageFiles = Array.isArray(images) ? images : [images];

                for (let i = 0; i < imageFiles.length; i++) {
                    const fileType = imageFiles[i].mimetype.split('/')[1].toLowerCase();

                    if (!['jpeg', 'jpg', 'png', 'gif'].includes(fileType)) {
                        throw new Error(`Unsupported file type: ${fileType}`);
                    }

                    const result = await cloudinary.uploader.upload(imageFiles[i].filepath, { folder: 'products' });
                    allImageUrl.push({ url: result.url, alt: name });
                }

                const finalPrice = price - (price * discount) / 100;

                await productModel.create({
                    sellerId: id,
                    name,
                    slug,
                    shopName,
                    category: category.trim(),
                    description: description.trim(),
                    stock: parseInt(stock),
                    price: parseInt(price),
                    discount: parseInt(discount),
                    finalPrice,
                    images: allImageUrl,
                    brand: brand.trim(),
                    location: {
                        city: city.trim(),
                        state: state.trim(),
                        country: country.trim(),
                    },
                    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                    specifications: specifications ? JSON.parse(specifications) : {},
                    suppliers: supplierName
                        ? [
                            {
                                name: supplierName.trim(),
                                contact: supplierContact.trim(),
                                address: supplierAddress.trim()
                            }
                        ]
                        : []
                });

                responseReturn(res, 201, { message: "Product added successfully" });
            } catch (error) {
                responseReturn(res, 500, { error: error.message });
            }
        });
    };

    products_get = async (req, res) => {
        const { page, searchValue, parPage } = req.query;
        const { id } = req;

        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        try {
            const query = searchValue
                ? {
                    $text: { $search: searchValue },
                    sellerId: id
                }
                : { sellerId: id };

            const products = await productModel.find(query)
                .skip(skipPage)
                .limit(parPage)
                .sort({ createdAt: -1 });

            const totalProduct = await productModel.countDocuments(query);

            responseReturn(res, 200, { totalProduct, products });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    product_get = async (req, res) => {
        const { productId } = req.params;
        try {
            const product = await productModel.findById(productId);
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found' });
            }
            responseReturn(res, 200, { product });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    product_update = async (req, res) => {
        let {
            name,
            description,
            discount,
            price,
            brand,
            productId,
            stock,
            city,
            state,
            country,
            tags,
            specifications
        } = req.body;

        name = name.trim();
        const slug = name.split(' ').join('-');

        try {
            const finalPrice = price - (price * discount) / 100;

            await productModel.findByIdAndUpdate(productId, {
                name,
                description,
                discount,
                price,
                brand,
                stock,
                slug,
                finalPrice,
                location: {
                    city: city.trim(),
                    state: state.trim(),
                    country: country.trim()
                },
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                specifications: specifications ? JSON.parse(specifications) : {}
            });

            const product = await productModel.findById(productId);
            responseReturn(res, 200, { product, message: 'Product update success' });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    product_delete = async (req, res) => {
        const { productId } = req.params;
        try {
            const deletedProduct = await productModel.findByIdAndDelete(productId);
            if (!deletedProduct) {
                return responseReturn(res, 404, { error: 'Product not found' });
            }
            responseReturn(res, 200, { message: 'Product deleted successfully', productId });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    product_image_update = async (req, res) => {
        const form = formidable({ multiples: true });

        form.parse(req, async (err, field, files) => {
            const { productId, oldImage } = field;
            const { newImage } = files;

            if (err) {
                responseReturn(res, 500, { error: err.message });
            } else {
                try {
                    cloudinary.config({
                        cloud_name: process.env.cloud_name,
                        api_key: process.env.api_key,
                        api_secret: process.env.api_secret,
                        secure: true
                    });

                    const result = await cloudinary.uploader.upload(newImage.filepath, { folder: 'products' });

                    if (result) {
                        let { images } = await productModel.findById(productId);
                        const index = images.findIndex(img => img.url === oldImage);
                        if (index !== -1) images[index].url = result.url;

                        await productModel.findByIdAndUpdate(productId, { images });

                        const product = await productModel.findById(productId);
                        responseReturn(res, 200, { product, message: 'Product image update success' });
                    } else {
                        responseReturn(res, 500, { error: 'Image upload failed' });
                    }
                } catch (error) {
                    responseReturn(res, 500, { error: error.message });
                }
            }
        });
    };
}

module.exports = new productController();
