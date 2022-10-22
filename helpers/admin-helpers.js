var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt');
var objectId = require('mongodb').ObjectId
//ADMIN SIGNUP
module.exports = {
    adminSignUp: (adminData) => {
        return new Promise(async (resolve, reject) => {
            if (adminData.name == null || adminData.name.trim() == "" || adminData.password == null || adminData.password.trim() == "") {
                resolve({ data: false, message: "Enter valid data" })
            } else {
                let emailChecking = await db.get().collection(collection.ADMIN_COLLECTION).find({ email: adminData.email }).toArray()
                if (emailChecking.length !== 0) {
                    console.log(emailChecking)
                    resolve({ data: false, message: "Email is already used" })
                } else {
                    adminData.password = await bcrypt.hash(adminData.password, 10);
                    db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((result) => {
                        resolve({ data: true });
                    })
                }
            }
        })
    },

    //ADMIN LOGIN
    adminLogin: (adminData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email });
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        response.admin = admin;
                        response.status = true;
                        resolve(response);
                    } else {
                        reject("Invalid password")
                    }
                })
            } else {
                reject("Invalid email");
            }
        })
    },

    //ADD PRODUCT
    addProduct: (productData, callback) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(productData).then((data) => {
                callback(data.insertedId.toString());
            })
        })
    },

    //EDIT PRODUCT
    editProduct: (proId, updatedData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objId(proId) }, { "$set": updatedData })
            resolve()
        })
    },

    //GET PRODUCTS
    getProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({}).toArray()
            resolve(products)
        })
    },

    //GET PRODUCT BY ID
    getProductById: (proId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },

    //DELETE PRODUCT
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objId(proId) }).then((response) => {
                resolve();
            })
        })
    },

    //CATEGORY
    getCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find({}).sort({ date: -1 }).toArray()
            resolve(category);
        })
    },

    //ADD CATEGORY
    addCategory: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            categoryData.category = categoryData.category.toUpperCase()
            categoryData.date = new Date();
            let categoryCheck = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: categoryData.category })
            if (categoryCheck == null) {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData).then((response) => {
                    resolve(response.insertedId)
                })
            } else {
                reject()
            }
        })
    },

    //EDIT CATEGORY
    editCategory: (catId, updatedData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, { "$set": updatedData })
            resolve()
        })
    },

    //DELETE CATEGORY
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
                resolve()
            })
        })
    },

    //ALL USERS
    listAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray();
            resolve(users)
        })
    },

    //USER STATUS
    userStatus: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, [{ $set: { status: { "$not": "$status" } } }])
            resolve('Success')
        })
    },

    //ORDER DETAILS
    getOrderDetails: (orderStatus) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        deliveryDetails: '$deliveryDetails',
                        paymentMethod: '$paymentMethod',
                        totalAmount: '$totalAmount',
                        status: '$status',
                        date: '$date'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] },
                        deliveryDetails: 1,
                        paymentMethod: 1,
                        totalAmount: 1,
                        status: 1,
                        date: 1

                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },

    //ORDER STATUS
    changeOrderStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {
            let dateStatus = new Date()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                { $set: { status: status, statusUpdateDate: dateStatus } }).then(() => {
                    resolve()
                })
        })
    }
}