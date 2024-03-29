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
        if (adminData == null) {
            console.log('Login Failed');
            resolve({ status: false })
        }
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
                        console.log('Login Failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('Login err');
                resolve({ status: false })
            }
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
                    resolve(response)
                })
            } else {
                reject()
            }
        })
    },

    //EDIT CATEGORY
    // editCategory: (updatedData) => {
    //     console.log(updatedData, 'updateddddddddddd');
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, { "$set": updatedData })
    //         resolve(response)
    //     })
    // },
    editCategory: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            categoryData.inputValue = categoryData.inputValue.toUpperCase()
            let categoryCheck = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: categoryData.inputValue })
            if (categoryCheck == null) {
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne(
                    {
                        // _id: objectId(categoryData.categoryId),
                        category: categoryData.categoryName
                    }, {
                    $set: {
                        category: categoryData.inputValue
                    }
                }
                ).then((response) => {
                    resolve(response)
                })
            } else {
                reject()
            }
        })
    },

    //DELETE CATEGORY
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
                resolve(response)
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
    getOrderDetails: () => {
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
                        offerPrice: '$offerPrice',
                        status: '$products.status',
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
                        offerPrice: '$product.offerPrice',
                        status: 1,
                        date: 1

                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },

    //ORDER STATUS
    changeOrderStatus: (prodId, orderId, status) => {
        return new Promise((resolve, reject) => {
            let dateStatus = new Date()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId), 'products.item': objectId(prodId) },
                { $set: { 'products.$.status': status, statusUpdateDate: dateStatus } }).then(() => {
                    resolve()
                })
        })
    },

    //SALES REPORT
    deliveredOrderList: (yy, mm) => {
        return new Promise(async (resolve, reject) => {
            let agg = [{
                $match: {
                    'products.status': 'delivered'
                }
            }, {
                $unwind: {
                    path: '$products'
                }
            }, {
                $project: {
                    item: '$products.item',
                    totalAmount: '$totalAmount',
                    paymentMethod: '$paymentMethod',
                    statusUpdateDate: '$statusUpdateDate',
                }
            }, {
                $lookup: {
                    from: 'product',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'result'
                }
            }, {
                $project: {
                    totalAmount: 1,
                    productPrice: '$result.offerPrice',
                    statusUpdateDate: 1,
                    paymentMethod: '$paymentMethod'
                }
            }]

            if (mm) {
                let start = "1"
                let end = "30"
                let fromDate = mm.concat("/" + start + "/" + yy)
                let fromD = new Date(new Date(fromDate).getTime() + 3600 * 24 * 1000)

                let endDate = mm.concat("/" + end + "/" + yy)
                let endD = new Date(new Date(endDate).getTime() + 3600 * 24 * 1000)
                dbQuery = {
                    $match: {
                        statusUpdateDate: {
                            $gte: fromD,
                            $lte: endD
                        }
                    }
                }
                agg.unshift(dbQuery)
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            } else if (yy) {
                let dateRange = yy.daterange.split("-")
                let [from, to] = dateRange
                from = from.trim("")
                to = to.trim("")
                fromDate = new Date(new Date(from).getTime() + 3600 * 24 * 1000)
                toDate = new Date(new Date(to).getTime() + 3600 * 24 * 1000)
                dbQuery = {
                    $match: {
                        statusUpdateDate: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }
                }
                agg.unshift(dbQuery)
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            } else {
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            }
        })
    },

    //TOTAL AMOUNT OF DELIVERED PRODUCTS
    totalAmountOfdelivered: () => {
        return new Promise(async (resolve, reject) => {
            let amount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$match': {
                        'products.status': 'delivered'
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'total': {
                            '$sum': '$totalAmount'
                        }
                    }
                }
            ]).toArray()
            resolve(amount[0]?.total)
        })
    },

    //DASHBOARD COUNT
    dashboardCount: (days) => {
        days = parseInt(days)
        return new Promise(async (resolve, reject) => {
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - days)

            let data = {};

            data.deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION).find({
                date: { $gte: startDate, $lte: endDate }, 'products.status': 'delivered'
            }).count()
            data.shippedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: startDate, $lte: endDate }, 'products.status': 'shipped' }).count()
            data.placedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: startDate, $lte: endDate }, 'products.status': 'placed' }).count()
            data.pendingOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: startDate, $lte: endDate }, 'products.status': 'pending' }).count()
            data.canceledOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: startDate, $lte: endDate }, 'products.status': 'canceled' }).count()
            data.returnedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: startDate, $lte: endDate }, 'products.status': 'returned' }).count()

            let codTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: 'COD'
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.codTotal = codTotal?.[0]?.totalAmount
            let onlineTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: 'ONLINE'
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.onlineTotal = onlineTotal?.[0]?.totalAmount
            let totalAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate, $lte: endDate
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.totalAmount = totalAmount?.[0]?.totalAmount
            resolve(data)
        })
    },

    //ADD COUPON
    addCoupon: (data) => {
        data.coupon = data.coupon.toUpperCase()
        data.couponOffer = Number(data.couponOffer)
        data.minPrice = Number(data.minPrice)
        data.priceLimit = Number(data.priceLimit)
        data.expDate = new Date(data.expDate)
        data.user = []
        return new Promise(async (resolve, reject) => {
            let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: data.coupon })
            if (couponCheck == null) {
                db.get().collection(collection.COUPON_COLLECTION).insertOne(data).then((response) => {
                    resolve()
                })
            } else {
                console.log('Rejected');
                reject()
            }
        })
    },

    //GET COUPONS
    getCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find({}).toArray()
            resolve(coupons)
        })
    },

    //DELETE COUPON
    deleteCoupon: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ coupon: data })
            resolve()
        })
    },

    //ADD BANNER
    addBanner: (data, urls) => {
        return new Promise((resolve, reject) => {
            data.image = urls
            db.get().collection(collection.BANNER_COLLECTION).insertOne(data).then(() => {
                resolve()
            })
        })
    },

    //GET BANNER
    getBanner: () => {
        return new Promise(async (resolve, reject) => {
            let bannerImages = await db.get().collection(collection.BANNER_COLLECTION).find({}).toArray()
            resolve(bannerImages)
        })
    },

    //SEARCH
    getSearchProduct: (key, page, productsPerPage) => {
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                "$or": [
                    { product: { $regex: key, '$options': 'i' } },
                    { brand: { $regex: key, '$options': 'i' } },
                    { category: { $regex: key, '$options': 'i' } },
                ]
            }).toArray()
            if (data.length > 0) {
                console.log(data, '%%%%%%%^^^^^^^^');
                resolve(data)
            } else {
                console.log('Errrrrrgscvkd');
                reject()
            }
        })
    }
}