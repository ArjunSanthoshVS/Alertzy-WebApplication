var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt');
const { response } = require('express');
var objectId = require('mongodb').ObjectId


module.exports = {

    //USER SIGNUP
    doSignUp: (userData) => {
        userData.status = true
        return new Promise(async (resolve, reject) => {
            let emailChecking = await db.get().collection(collection.USER_COLLECTION).find({ email: userData.email }).toArray()
            if (emailChecking.length !== 0) {
                console.log(emailChecking)
                resolve({ data: false, message: "Email is already used" })
            } else {
                userData.password = await bcrypt.hash(userData.password, 10);
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((result) => {
                    resolve({ data: true });
                })
            }
        })
    },

    //USER LOGIN
    doLogin: (userData) => {
        let response = {};
        console.log(userData);
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            console.log(user);
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log('Login Failed');
                        resolve({ status: false })
                    }
                }
                )
            }
            else {
                console.log('Login err');
                resolve({ status: false })
            }

        })
    },

    //OTP LOGIN
    otpLogin: (userData) => {
        let response = {};
        console.log(userData);
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })
            console.log(user);
            if (user) {
                response.user = user;
                response.status = true;
                resolve(response);
            } else {
                console.log('Login Failed');
                resolve({ status: false })
            }
        }
        )
    }
    ,
    //ADD TO CART
    addToCart: (prodId, userId) => {
        let prodObj = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            let count;
            if (userCart) {
                count = userCart.products.length
                let prodExist = userCart.products.findIndex(product => product.item == prodId)
                console.log(prodExist);
                if (prodExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: prodObj }

                            }).then((response) => {
                                resolve(count)
                            })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    count = 0;
                    resolve(count)
                })
            }
        })
    },

    //CART PRODUCTS
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
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
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    //CART COUNT
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    //CART PRODUCT QUANTITY
    changeProductQuantity: (details) => {
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
            }

        })
    },

    //DELTE PRODUCT FROM CART
    deleteProductFromCart: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({
                user: objectId(userId)
            },
                {
                    $pull: { products: { item: objectId(prodId) } }
                }
            ).then(() => {
                resolve()
            })
        })
    },

    //TOTAL AMOUNT OF CART PRODUCTS
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
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
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.offerprice' }] } }
                    }
                }
            ]).toArray()
            resolve(total[0]?.total)
        })
    },

    //PLACE ORDER
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['paymentMethod'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order['paymentMethod'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date().toISOString().substring(0, 10)
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve()
            })
        })
    },

    //CART PRODUCTS
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },

    //USER ORDERS
    getUserOrders: (userId) => {
        return new Promise((resolve, reject) => {
            console.log(userId);
            let orders = db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { userId: objectId(userId) }
                    },
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
            resolve(orders)
        })
    },

    //ORDERED PRODUCTS
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { user: objectId(orderId) }
                },
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

    //ADD TO WISHLIST
    addToWishlist: (prodId, userId) => {

        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            let prodObj = {
                item: objectId(prodId),
            }
            if (userWish) {
                let prodExist = userWish.products.findIndex(product => product.item == prodId)
                console.log(prodExist);
                if (prodExist == -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
                        user: objectId(userId)
                    },
                        {
                            $push: { products: { item: objectId(prodId) } }
                        }
                    ).then((response) => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $pull: { products: { item: objectId(prodId) } }
                            }).then((response) => {
                                reject()
                            })
                }
            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    //WISHLIST PRODUCTS
    getWishProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
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
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(wishlist)
        })
    },

    //DELTE PRODUCT FROM CART
    deleteProductFromWish: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
                user: objectId(userId)
            },
                {
                    $pull: { products: { item: objectId(prodId) } }
                }
            ).then(() => {
                resolve()
            })
        })
    },

    //CANCEL ORDER
    cancelOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { status: 'canceled' } }).then(() => {
                resolve('Success')
            })
        })
    },

    //ADD ADDRESS
    addAddress: (data, userId) => {
        return new Promise((resolve, reject) => {
            data._id = new objectId()
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id: objectId(userId)
            }, {
                $push: {
                    address: data
                }
            }).then(response)
            resolve(response)
        })
    },

    //ADDRESS DETAILS
    addressDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $unwind: '$address'
                }, {
                    $project: {
                        address: 1,
                        email: 1
                    }
                }
            ]).toArray()
            resolve(address)
        })
    }
}