var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId

module.exports = {

    //ADD PRODUCT
    addProduct: (product) => {
        return new Promise(async (resolve, reject) => {
            product.date = new Date()
            product.actualPrice = parseInt(product.actualPrice) //changing value to int for calculatiom
            product.offerPrice = product.actualPrice
            product.productOffer = 0
            product.categoryOffer = 0
            await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                resolve(data.insertedId.toString())
            })
        })
    },

    //ALL PRODUCTS
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
            resolve(products)
        })
    },

    //DELETE PRODUCT
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },

    //PRODUCT DETAILS
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })

        })
    },

    //UPDATE PRODUCT
    updateProduct: (prodId, prodDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(prodId) }, {
                    $set: {
                        product: prodDetails.product,
                        brand: prodDetails.brand,
                        stock: prodDetails.stock,
                        actualPrice: prodDetails.actualPrice,
                        offerPrice: prodDetails.offerPrice,
                        productOffer: prodDetails.productOffer,
                        categoryOffer: prodDetails.categoryOffer,
                        category: prodDetails.category,
                        description: prodDetails.description
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },

    //ADD PRODUCT OFFER
    addProductOffer: (offer) => {
        let prodId = objectId(offer.product)
        let offerPercentage = Number(offer.productOffer)
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                {
                    _id: prodId
                },
                {
                    $set: { productOffer: offerPercentage }
                }
            )
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: prodId })
            if (product.productOffer >= product.categoryOffer) {
                let temp = (product.actualPrice * product.productOffer) / 100
                let updatedOfferPrice = (product.actualPrice - temp)
                let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                    {
                        _id: prodId
                    },
                    {
                        $set: { offerPrice: updatedOfferPrice }
                    }
                )
                resolve(updatedProduct)
            }
            resolve()
        })
    },

    //GET UPDATED PRODUCT WITH OFFER
    getProductOffer: () => {
        return new Promise((resolve, reject) => {
            let productOffer = db.get().collection(collection.PRODUCT_COLLECTION).aggregate(
                [
                    {
                        '$match': {
                            'productOffer': {
                                '$gt': 0
                            }
                        }
                    }, {
                        '$project': {
                            'product': 1,
                            'productOffer': 1
                        }
                    }
                ]
            ).toArray()
            resolve(productOffer)
        })
    },

    //DELETE PORDUCT OFFER
    deleteProductOffer: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
                {
                    $set: { productOffer: 0 }
                }
            ).then((response) => {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((response) => {
                    if (response.productOffer == 07 && response.categoryOffer == 0) {
                        response.offerPrice = response.actualPrice
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                            $set: {
                                offerPrice: response.offerPrice
                            }
                        })
                    }
                })
                resolve()
            })
        })
    },

    //ADD CATEGORY OFFER
    addCategoryOffer: (offer) => {
        let category = offer.category
        let offerPercentage = Number(offer.categoryOffer)
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne(
                {
                    category: category
                },
                {
                    $set: {
                        categoryOffer: offerPercentage
                    }
                }
            )
            db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
                {
                    category: category
                },
                {
                    $set: {
                        categoryOffer: offerPercentage
                    }
                }
            )
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: category
            }).toArray()

            for (let i = 0; i < products.length; i++) {
                if (products[i].categoryOffer > products[i].productOffer) {
                    let temp = (products[i].actualPrice * products[i].categoryOffer) / 100
                    let updatedOfferPrice = (products[i].actualPrice - temp)
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                        _id: objectId(products[i]._id)
                    },
                        {
                            $set: { offerPrice: updatedOfferPrice }
                        }
                    )
                }

            }
            resolve()
        })

    },

    //GET UPDATED CATEGORY WITH OFFER
    getCategoryOffer: () => {
        return new Promise(async (resolve, reject) => {
            let categoryOffer = await db.get().collection(collection.CATEGORY_COLLECTION).find(
                {
                    categoryOffer: { $gt: 0 }
                }
            ).toArray()
            resolve(categoryOffer)
        })
    },

    //DELTE CATEGORY OFFER
    deleteCategoryOffer: (category) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ category: category }, { $set: { categoryOffer: 0 } })
            db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ category: category }, { $set: { categoryOffer: 0 } }).then(async (response) => {
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
                for (i = 0; i < product.length; i++) {
                    if (product[i].productOffer == 0 && product[i].categoryOffer == 0) {
                        product[i].offerPrice = product[i].actualPrice
                        db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ category: category }, { $set: { offerPrice: product[i].offerPrice } })
                    }
                }
            })
            resolve()
        })
    }
}