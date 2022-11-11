var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt');
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const paypal = require('paypal-rest-sdk');
const { count } = require('console');
const { Db } = require('mongodb');
const { use } = require('../routes/user');
require('dotenv').config()

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
})

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET
});


module.exports = {

    //USER SIGNUP
    doSignUp: (userData) => {
        // userData.status = true
        return new Promise(async (resolve, reject) => {
            let emailChecking = await db.get().collection(collection.USER_COLLECTION).find({ email: userData.email })
            if (emailChecking.length == null) {
                userData.password = await bcrypt.hash(userData.password, 10);
                userData.address = [] //creating an array for future use
                userData.signupDate = new Date()
                userData.referralId = userData.firstname + new objectId().toString().slice(1, 7)

                userData.status = true
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    db.get().collection(collection.WALLET_COLLECTION).insertOne({
                        userId: userData._id,
                        walletBalance: 0,
                        referralId: userData.referralId,
                        transaction: []
                    })
                    resolve(userData)
                })
            } else {

                reject("This email is Already Existing")
            }
            if (userData.referralCode) {
                db.get().collection(collection.USER_COLLECTION).findOne({ referralId: userData.referralCode }).then(async (response) => {
                    if (response != null) {
                        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: objectId(userData._id) }, { $set: { walletBalance: 100 } })
                        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ referralId: userData.referralCode }, { $inc: { walletBalance: 100 } })
                    }
                })
            }
        })
    },

    //GET WALLET
    getWallet: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: objectId(userId) }).then((response) => {
                resolve(response)
                console.log(response, 'respooooooooooooooonse');
            })
        })
    },

    //USER LOGIN
    doLogin: (userData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({
                email: userData.email, status: true
            })
            console.log(user);
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log('Login Failed');
                        reject({ status: false })
                    }
                }
                )
            }
            else {
                console.log('Login err');
                reject({ status: false })
            }

        })
    },

    //OTP LOGIN
    otpLogin: (userData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })
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
    },

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
            ).then((response) => {
                resolve(response)
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
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.offerPrice' }] } }
                    }
                }
            ]).toArray()
            resolve(total[0]?.total)
        })
    },

    //PLACE ORDER
    placeOrder: (order, products, total, paymentMethod, userId) => {
        return new Promise((resolve, reject) => {
            let status = paymentMethod === 'COD' || 'WALLET' ? 'placed' : 'pending'
            products.forEach(element => {
                element.status = status
            });
            let orderObj = {
                deliveryDetails: {
                    fullname: order[0]?.address.firstname + " " + order[0]?.address.lastname,
                    email: order[0]?.address.email,
                    address: order[0]?.address.address,
                    mobile: order[0]?.address.mobile,
                    country: order[0]?.address.country,
                    state: order[0]?.address.state,
                    district: order[0]?.address.district,
                    city: order[0]?.address.city,
                    pincode: order[0]?.address.pincode
                },
                userId: objectId(userId),
                paymentMethod: paymentMethod,
                products: products,
                totalAmount: total,
                status: status,
                displayDate: new Date().toDateString(),
                date: new Date(),
                return: false
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                if (status === 'placed') {
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
                    products.forEach(element => {
                        console.log('innnnnnnnnnnnnnnnnnnnnnn');
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(element.item) }, { $inc: { stock: -(element.quantity) } })
                    })
                    resolve(response.insertedId)
                } else {
                    console.log('ooouttttttttttttttttttttt');
                    resolve(response.insertedId)
                }
            })
        })
    },

    //DECREASE WALLET
    decreaseWallet: (userId, amount) => {
        db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: objectId(userId) }).then((response) => {
            console.log(response, '000000000000000000000000');
            let updatedBalance = response.walletBalance - amount
            db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: objectId(userId) }, { $set: { walletBalance: updatedBalance } })
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
            let orders = db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { userId: objectId(userId), status: 'placed' }
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
                            status: '$products.status',
                            displayDate: '$displayDate',
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
                            displayDate: 1,
                            date: 1

                        }
                    }
                ]).toArray()
            resolve(orders)
        })
    },

    //ORDERED PRODUCTS
    // getOrderProducts: (orderId) => {
    //     return new Promise(async (resolve, reject) => {
    //         let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
    //             {
    //                 $match: { user: objectId(orderId) }
    //             },
    //             {
    //                 $unwind: '$products'
    //             },
    //             {
    //                 $project: {
    //                     item: '$products.item',
    //                     quantity: '$products.quantity',
    //                     deliveryDetails: '$deliveryDetails',
    //                     paymentMethod: '$paymentMethod',
    //                     totalAmount: '$totalAmount',
    //                     status: '$status',
    //                     date: '$date'
    //                 }
    //             }, {
    //                 $lookup: {
    //                     from: collection.PRODUCT_COLLECTION,
    //                     localField: 'item',
    //                     foreignField: '_id',
    //                     as: 'product'
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     item: 1,
    //                     quantity: 1,
    //                     product: { $arrayElemAt: ['$product', 0] },
    //                     deliveryDetails: 1,
    //                     paymentMethod: 1,
    //                     totalAmount: 1,
    //                     status: 1,
    //                     date: 1

    //                 }
    //             }
    //         ]).toArray()
    //         resolve(orderItems)
    //     })
    // },

    //ADD TO WISHLIST
    addToWishlist: (prodId, userId) => {

        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            let count;
            let prodObj = {
                item: objectId(prodId),
            }

            if (userWish) {
                count = userWish.products.length
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
                        resolve(count)
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
                    count = 0
                    resolve(count)
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

    //WISHLIST COUNT
    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count
            let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wish) {
                count = wish.products.length
            }
            resolve(count)
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
    cancelOrder: (orderId, prodId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId), 'products.item': objectId(prodId) }, { $set: { 'products.$.status': 'canceled' } }).then(() => {
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
            }).then()
            resolve()
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
                    $unwind: { path: '$address' }
                }, {
                    $project: {
                        address: 1,
                    }
                }
            ]).toArray()
            resolve(address)
        })
    },

    //ORDER ADDRESS
    getOrderAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $unwind: {
                        'path': '$address'
                    }

                },
                {
                    $match: {
                        'address._id': objectId(addressId)
                    }
                },
                {
                    $project: {
                        'address': 1,
                    }
                }
            ]).toArray()
            resolve(address)
        })
    },

    //EDIT ADDRESS
    // editAddress: (newAddress, addId, userId) => {
    //     console.log(addId, '@@@@@#####$$$$$$$$%%%%%%%%%');
    //     console.log(newAddress, '@@@@@#####$$$$$$$$%%%%%%%%%');
    //     console.log(userId, '@@@@@#####$$$$$$$$%%%%%%%%%');
    //     return new Promise((resolve, reject) => {
    //         let newData = db.get().collection(collection.USER_COLLECTION).updateOne(
    //             {
    //                 _id: objectId(userId),
    //                 'address._id': objectId(addId)
    //             },
    //             {
    //                 $set: {
    //                     'address': 'newAddress'
    //                 }
    //             }
    //         ).then(() => {
    //             resolve()
    //         })
    //     })
    // },

    //DELETE ADDRESS
    deleteAddress: (userId, addressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id: objectId(userId)
            },
                {
                    $pull: { address: { _id: objectId(addressId) } }
                }
            ).then((response) => {
                resolve()
            })
        })
    },

    //RAZORPAY
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('New order :', order);
                    resolve(order)
                }

            })
        })
    },

    //PAYPAL
    // generatePaypal: () => {
    //     return new Promise((resolve, reject) => {

    // )
    //     },

    //VERIFY PAYMENT
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'm4Q41niB09EATCGA7gVBcSU4');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },

    //CHANGE PAYMENT STATUS
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },

    //EDIT PROFILE
    editProfile: (userId, updatedData) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION)
                .updateOne(
                    {
                        _id: objectId(userId)
                    },
                    {
                        "$set": {
                            firstname: updatedData.firstname,
                            lastname: updatedData.lastname,
                            email: updatedData.email,
                            mobile: updatedData.mobile
                        }
                    }
                )
            resolve()
        })
    },

    //CHANGE PASSWORD
    changePassword: (password, userId) => {
        console.log(password);
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find({ _id: objectId(userId) }).toArray()
            if (user) {
                bcrypt.compare(password.password, user[0].password).then(async (status) => {
                    if (status) {
                        password.newPassword = await bcrypt.hash(password.newPassword, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({
                            _id: objectId(userId)
                        },
                            {
                                $set: { password: password.newPassword }
                            }).then((response) => {
                                resolve(response)
                            })
                    }
                }).catch((response) => {
                    reject()
                })
            }
        })
    },

    //REDEEM COUPON
    redeemCoupon: (couponDetails) => {
        let couponName = couponDetails.coupon.toUpperCase()
        console.log(couponName);
        return new Promise(async (resolve, reject) => {
            currentDate = new Date()
            let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ $and: [{ coupon: couponName }, { expDate: { $gte: currentDate } }] })
            console.log(couponCheck);
            if (couponCheck !== null) {
                resolve(couponCheck)
            } else {
                reject()
            }
        })
    },

    //RETURN PRODUCT
    returnOrder: () => {
        return new Promise((resolve, reject) => {
            // db.get().collection(collection.ORDER_COLLECTION).
        })
    }
}