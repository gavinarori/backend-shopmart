const cardModel = require('../../models/cardModel')
const wishlistModel = require('../../models/wishlistModel')
const {
    responseReturn
} = require('../../utiles/response')
const {
    mongo: {
        ObjectId
    }
} = require('mongoose')
class cardController {
    add_to_card = async (req, res) => {
        const {
            userId,
            productId,
            quantity
        } = req.body
        try {
            const product = await cardModel.findOne({
                $and: [{
                        productId: {
                            $eq: productId
                        }
                    },
                    {
                        userId: {
                            $eq: userId
                        }
                    }
                ]
            })
            if (product) {
                responseReturn(res, 404, {
                    error: 'Product already added to card'
                })
            } else {
                const product = await cardModel.create({
                    userId,
                    productId,
                    quantity
                })
                responseReturn(res, 201, {
                    message: 'Add to card success',
                    product
                })
            }
        } catch (error) {
            console.log(error.message)
        }
    }
    get_card_products = async (req, res) => {
        const co = 5;
        const {
            userId
        } = req.params
        try {
            const card_products = await cardModel.aggregate([{
                    $match: {
                        userId: {
                            $eq: new ObjectId(userId)
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: "_id",
                        as: 'products'
                    }
                }
            ])
            let buy_product_item = 0
            let calculatePrice = 0;
            let card_product_count = 0;
            
            // Include all products, not just in-stock ones
            const allProducts = card_products.filter(p => p.products && p.products.length > 0)
            const outOfStockProduct = allProducts.filter(p => p.products[0].stock < p.quantity)
            const stockProduct = allProducts.filter(p => p.products[0].stock >= p.quantity)
            
            // Count all products for display
            for (let i = 0; i < allProducts.length; i++) {
                card_product_count = card_product_count + allProducts[i].quantity
            }
            
            // Calculate price only for in-stock products
            for (let i = 0; i < stockProduct.length; i++) {
                const {
                    quantity
                } = stockProduct[i]
                buy_product_item = buy_product_item + quantity
                const {
                    price,
                    discount
                } = stockProduct[i].products[0]
                if (discount !== 0) {
                    calculatePrice = calculatePrice + quantity * (price - Math.floor((price * discount) / 100))
                } else {
                    calculatePrice = calculatePrice + quantity * price
                }
            }
            
            let p = []
            let unique = [...new Set(allProducts.map(p => p.products[0].sellerId.toString()))]
            for (let i = 0; i < unique.length; i++) {
                let price = 0;
                let sellerProducts = allProducts.filter(p => p.products[0].sellerId.toString() === unique[i])
                
                for (let j = 0; j < sellerProducts.length; j++) {
                    const tempProduct = sellerProducts[j].products[0]
                    const isOutOfStock = tempProduct.stock < sellerProducts[j].quantity
                    
                    // Only add to price calculation if in stock
                    if (!isOutOfStock) {
                        let pri = 0;
                        if (tempProduct.discount !== 0) {
                            pri = tempProduct.price - Math.floor((tempProduct.price * tempProduct.discount) / 100)
                        } else {
                            pri = tempProduct.price
                        }
                        pri = pri - Math.floor((pri * co) / 100)
                        price = price + pri * sellerProducts[j].quantity
                    }
                    
                    // Add to products array regardless of stock status
                    if (!p[i]) {
                        p[i] = {
                            sellerId: unique[i],
                            shopName: tempProduct.shopName,
                            price: 0, // Will be calculated for in-stock items
                            products: []
                        }
                    }
                    
                    p[i].products.push({
                        _id: sellerProducts[j]._id,
                        quantity: sellerProducts[j].quantity,
                        productInfo: tempProduct,
                        isOutOfStock: isOutOfStock
                    })
                }
                
                // Set the final price for this seller
                p[i].price = price
            }
            
            responseReturn(res, 200, {
                card_products: p,
                price: calculatePrice,
                card_product_count,
                shipping_fee: 85 * p.length,
                outOfStockProduct,
                buy_product_item
            })

        } catch (error) {
            console.log(error.message)
            responseReturn(res, 500, {
                error: 'Failed to get cart products'
            })
        }
    }

    delete_card_product = async (req, res) => {
        const {
            card_id
        } = req.params
        try {
            await cardModel.findByIdAndDelete(card_id)
            responseReturn(res, 200, {
                message: 'success'
            })
        } catch (error) {
            console.log(error.message)
        }
    }
    quantity_inc = async (req, res) => {
        const {
            card_id
        } = req.params
        try {
            const product = await cardModel.findById(card_id)
            const {
                quantity
            } = product
            await cardModel.findByIdAndUpdate(card_id, {
                quantity: quantity + 1
            })
            responseReturn(res, 200, {
                message: 'success'
            })
        } catch (error) {
            console.log(error.message)
        }
    }
    quantity_dec = async (req, res) => {
        const {
            card_id
        } = req.params
        try {
            const product = await cardModel.findById(card_id)
            const {
                quantity
            } = product
            await cardModel.findByIdAndUpdate(card_id, {
                quantity: quantity - 1
            })
            responseReturn(res, 200, {
                message: 'success'
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    add_wishlist = async (req, res) => {
        const {
            slug
        } = req.body
        try {
            const product = await wishlistModel.findOne({
                slug
            })
            if (product) {
                responseReturn(res, 404, {
                    error: 'Allready added'
                })
            } else {
                await wishlistModel.create(req.body)
                responseReturn(res, 201, {
                    message: 'add to wishlist success'
                })
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    get_wishlist = async (req, res) => {
        const {
            userId
        } = req.params;
        try {
            const wishlists = await wishlistModel.find({
                userId
            })
            responseReturn(res, 200, {
                wishlistCount: wishlists.length,
                wishlists
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    delete_wishlist = async (req, res) => {
        const {
            wishlistId
        } = req.params
        try {
            const wishlist = await wishlistModel.findByIdAndDelete(wishlistId)
            responseReturn(res, 200, {
                message: 'Remove success',
                wishlistId
            })
        } catch (error) {
            console.log(error.message)
        }
    }
}

module.exports = new cardController()