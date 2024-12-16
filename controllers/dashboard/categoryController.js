const categoryModel = require('../../models/categoryModel');
const { responseReturn } = require('../../utiles/response');
const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');

class categoryController {

    add_category = async (req, res) => {
        const form = formidable();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: 'Error parsing the form data' });
            }

            let { name, parentCategory, seoTitle, seoDescription, featured } = fields;
            const { image, bannerImage } = files;
            name = name.trim();
            const slug = name.split(' ').join('-');

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            });

            try {
                let imageUrl = null, bannerImageUrl = null;

                if (image) {
                    const result = await cloudinary.uploader.upload(image.filepath, { folder: 'categories' });
                    imageUrl = result.url;
                }

                if (bannerImage) {
                    const bannerResult = await cloudinary.uploader.upload(bannerImage.filepath, { folder: 'category-banners' });
                    bannerImageUrl = bannerResult.url;
                }

                const category = await categoryModel.create({
                    name,
                    slug,
                    image: imageUrl,
                    bannerImage: bannerImageUrl,
                    parentCategory: parentCategory || null,
                    seo: {
                        title: seoTitle || null,
                        description: seoDescription || null
                    },
                    featured: featured === 'true'
                });

                responseReturn(res, 201, { category, message: 'Category added successfully' });
            } catch (error) {
                responseReturn(res, 500, { error: error.message });
            }
        });
    };

    get_category = async (req, res) => {
        const { page, searchValue, parPage } = req.query;
        try {
            const query = searchValue
                ? { $text: { $search: searchValue } }
                : {};
            const skipPage = parPage && page ? parseInt(parPage) * (parseInt(page) - 1) : 0;

            const categories = await categoryModel.find(query)
                .skip(skipPage)
                .limit(parseInt(parPage) || 0)
                .sort({ createdAt: -1 });

            const totalCategories = await categoryModel.countDocuments(query);

            responseReturn(res, 200, { totalCategories, categories });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    get_category_hierarchy = async (req, res) => {
        try {
            const categories = await categoryModel.aggregate([
                {
                    $graphLookup: {
                        from: 'categories',
                        startWith: '$_id',
                        connectFromField: '_id',
                        connectToField: 'parentCategory',
                        as: 'children'
                    }
                }
            ]);
            responseReturn(res, 200, { categories });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };
}

module.exports = new categoryController();
