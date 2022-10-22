var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId

module.exports = {

    //ADD PRODUCT
    addProduct: (product, callback) => {
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertedId.toString());
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
                console.log(response);
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
                        actualprice: prodDetails.actualprice,
                        offerprice: prodDetails.offerprice,
                        category: prodDetails.category
                    }
                }).then((response) => {
                    resolve()
                })
        })
    }
}