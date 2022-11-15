var express = require('express');
var router = express.Router();
const middleware = require('../middlewares/authentication-check')
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const adminHelpers = require('../helpers/admin-helpers');
// const otp = require('../otp-token');
require('dotenv').config()
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)
const paypal = require('paypal-rest-sdk');
const { response } = require('express');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret': process.env.CLIENT_SECRET
});

//ENTERING PAGE
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishCount = await userHelpers.getWishCount(req.session.user._id)
  }
  adminHelpers.getCategory().then(async (category) => {
    let random = await productHelpers.randomProducts()
    let banner = await adminHelpers.getBanner()
    res.render('user/landing-page', { user, cartCount, category, random, banner, wishCount })
  })
})

//USER LOGIN
router.get('/login', middleware.loginUnchecked, (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/login')
  } else {
    res.render('user/login', { not: true, "loginErr": req.session.loginErr, "otpErr": req.session.otpErr });
    req.session.loginErr = false;
  }
});

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect('/');
    } else {
      req.session.loginErr = "Incorrect email or Password";
      res.redirect('/login')
    }
  });
});

//LOGIN MODAL
router.post('/modal-login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    req.session.loggedIn = true;
    req.session.user = response.user;
    res.json({ status: true })
  }).catch((response) => {
    let msg = "Invalid Email Or Password...!"
    console.log(response, '(((((((((((');
    res.json({ status: false, msg: msg })
  })
});

//SIGNUP MODAL
router.post('/modal-signup', (req, res) => {
  userHelpers.doSignUp(req.body).then((response) => {
    req.session.loggedIn = true;
    req.session.user = response.user;
    res.json({ status: true })
  }).catch((response) => {
    console.log(response, 'GGGGGGGGGGGG');
    res.json({ status: false })
  })
});

//OTP LOGIN
router.get('/otp-login', (req, res) => {
  res.render('user/otp-login', { not: true })
})

router.post('/otp-login', (req, res) => {
  userHelpers.otpLogin(req.body).then((response) => {
    let phone = response.user.mobile
    client
      .verify
      .services(process.env.SERVICE_ID)
      .verifications
      .create({
        to: `+91${phone}`,
        channel: 'sms'
      }).then((data) => {
        req.session.user = response.user;
        res.render('user/otp-verification', { phone, not: true })
      }).catch((err) => {
        console.log(err);
      })
  }).catch((response) => {
    req.session.loginErr = "Please check your mobile number";
    res.redirect('/login')
  })
})

//OTP VERIFICATION
router.get('/otp-verification', (req, res) => {
  res.render('user/otp-verification', { not: true })
})

router.post('/otp-verification', (req, res) => {
  client
    .verify
    .services(process.env.SERVICE_ID)
    .verificationChecks
    .create({
      to: `+91${req.body.mobile}`,
      code: req.body.otp
    }).then((data) => {
      console.log(data);
      if (data.valid) {
        req.session.loggedIn = true;
        res.redirect('/')
      } else {
        delete req.session.user
        req.session.otpErr = "Enter valid OTP"
        res.redirect('/login')
      }
    }).catch((err) => {
      delete req.session.user
      res.redirect('/login')
    })
})

//USER SIGNUP
router.get('/signup', middleware.loginUnchecked, (req, res) => {
  res.render('user/signup', { "signupErr": req.session.signupErr, not: true });
  req.session.signupErr = false;
});

router.post('/signup', (req, res) => {
  userHelpers.doSignUp(req.body).then((resolve) => {
    if (resolve.data) {
      res.render('user/login')
    } else {
      req.session.signupErr = resolve.message;
      res.redirect('/signup');
    }
  })
})

//USER LOGOUT
router.get('/logout', (req, res) => {
  req.session.loggedIn = false
  req.session.user = null
  res.redirect('/');
})

// //PRODUCTS LIST
router.get('/products/', async function (req, res, next) {
  console.log(req.query.search);
  let cartCount
  let wishCount
  let user = req.session.user
  // cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishCount = await userHelpers.getWishCount(req.session.user._id)
  }
  adminHelpers.getSearchProduct(req.query.search).then((response) => {
    adminHelpers.getCategory().then((category) => {
      console.log(category);
      console.log(response);
      res.render('user/products', { category, response, user, cartCount, wishCount, logout: !req.session.loggedIn })
    })
  }).catch(() => {
    console.log('ERrrrrrrrrrrrrrr');
    adminHelpers.getCategory().then((category) => {
      res.render('user/products', { category, user: req.session.user, cartCount: req.session.cartCount, logout: !req.session.loggedIn })
    })
  })
})

//PRODUCTS DETAILS
router.get('/product-details/:id', async (req, res) => {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  let random = await productHelpers.randomProducts()
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishCount = await userHelpers.getWishCount(req.session.user._id)
  }
  await productHelpers.getProductDetails(req.params.id).then((response) => {
    res.render('user/product-details', { response, user: true, user, cartCount, wishCount, random })
  })
})

//CART
router.get('/cart', middleware.loginChecked, async (req, res) => {
  let userId = req.session.user._id
  let totalValue = await userHelpers.getTotalAmount(userId)
  let cartCount = await userHelpers.getCartCount(userId)
  let wishCount = await userHelpers.getWishCount(userId)
  let products = await userHelpers.getCartProducts(userId)
  let user = req.session.user
  res.render('user/cart', { products, user, userId, totalValue, cartCount, wishCount })
})

//ADD TO CART
router.get('/add-to-cart/:id', (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then((count) => {
    res.json({ status: true })
  })
})

//CART PRODUCT QUANTITY
router.post('/change-product-quantity', (req, res) => {
  console.log(req.body, 'EEeeeeeeeeeeeeeeEe');
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

//DELETE CART PRODUCT
router.get('/delete-cart-product/:id', (req, res) => {
  console.log(req.params.id);
  userHelpers.deleteProductFromCart(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  })
})

//WISHLIST
router.get('/wishlist', middleware.loginChecked, async (req, res) => {
  let userId = req.session.user._id
  let products = await userHelpers.getWishProducts(userId)
  let cartCount = await userHelpers.getCartCount(userId)
  let wishCount = await userHelpers.getWishCount(userId)
  let user = req.session.user
  res.render('user/wishlist', { products, user, userId, cartCount, wishCount })
})

//ADD TO WISHLIST
router.get('/add-to-wishlist/:id', (req, res) => {
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  }).catch((response) => {
    res.json({ status: false })
  })
})

//DELETE WISHLIST PRODUCT
router.get('/delete-wish-product/:id', (req, res) => {
  userHelpers.deleteProductFromWish(req.params.id, req.session.user._id).then(() => {
    res.redirect('/wishlist')
  })
})

//CHECKOUT FORM
router.get('/place-order', middleware.loginChecked, async (req, res) => {
  let user = req.session.user
  let total = await userHelpers.getTotalAmount(user._id)
  let cartProducts = await userHelpers.getCartProducts(user._id)
  let wishCount = await userHelpers.getWishCount(user._id)
  let address = await userHelpers.addressDetails(user._id)
  let cartCount = await userHelpers.getCartCount(user._id)
  let wallet = await userHelpers.getWallet(user._id)
  console.log();
  res.render('user/place-order', { total, user, cartProducts, wishCount, address, wallet, cartCount })
})

router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.session.user._id)
  let totalPrice = Number(req.body.total)
  console.log(totalPrice, '@@@@@@@@@@@@@@@');
  let walletBalance = Number(req.body.wallet)
  if (walletBalance) {
    if (totalPrice >= walletBalance) {
      totalPrice = totalPrice - walletBalance
      console.log(totalPrice, "QQQQQQQQQWWWWWWW");
      userHelpers.decreaseWallet(req.session.user._id, walletBalance)
    } else {
      userHelpers.decreaseWallet(req.session.user._id, totalPrice)
      totalPrice = walletBalance - totalPrice
    }
  } else {
    totalPrice = totalPrice
  }
  let userAddress = await userHelpers.getOrderAddress(req.session.user._id, req.body.addressId)

  userHelpers.placeOrder(userAddress, products, totalPrice, req.body['paymentMethod'], req.session.user._id).then((orderId) => {
    if (req.body['paymentMethod'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['paymentMethod'] === 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json({ razorpay: true, response })
      })
    } else {
      req.session.orderId = orderId
      var create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://cancel.url"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": 'item',
              "sku": "item",
              "price": '1.00',
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": '1.00'
          },
          "description": "This is the payment description."
        }]
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          console.log("Create Payment Response");
          console.log(payment);
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              console.log(payment.links[i].href);
              res.json({ url: payment.links[i].href, paypal: true });
            }
          }
        }
      });
    }
  })
})

router.get('/success', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.session.user._id)
  userHelpers.changePaymentStatus(req.session.orderId, req.session.user._id, products).then(() => {
    req.session.orderId = null
    res.redirect('/orders')
  })
})

//REDEEM COUPON 
// router.post('/redeem-coupon', async (req, res) => {
//   console.log(req.body);
//   let userId = req.session.user._id
//   let totalAmount = await userHelpers.getTotalAmount(userId)
//   console.log(totalAmount, '*******');
//   await userHelpers.redeemCoupon(req.body).then((couponData) => {
//     let minMsg = "This coupen is only valid for purchase above ₹" + couponData.minPrice
//     let maxMsg = "This coupen is only valid for purchase below ₹" + couponData.maxPrice
//     if (totalAmount >= couponData.minPrice && totalAmount <= couponData.maxPrice) {
//       let temp = (totalAmount * couponData.couponOffer) / 100
//       totalAmount = (totalAmount - temp)
//       console.log(totalAmount);
//       res.json({ total: totalAmount, offer: temp })
//     } else if (totalAmount <= couponData.minPrice) {
//       res.json({ msg: minMsg, total: totalAmount })
//     } else if (totalAmount >= couponData.maxPrice) {
//       res.json({ msg: maxMsg, total: totalAmount })
//     }
//   }).catch(() => {
//     let msg = "Invalid Coupon Or It's already Expired"
//     res.json({ msg: msg, total: totalAmount })
//   })
// })

router.post('/redeem-coupon', async (req, res) => {
  console.log(req.body);
  let userId = req.session.user._id
  let totalAmount = await userHelpers.getTotalAmount(userId)
  console.log(totalAmount, '*******');

  await userHelpers.redeemCoupon(req.body).then((couponData) => {
    let minMsg = "This coupen is only valid for purchase above ₹" + couponData.minPrice

    if (totalAmount >= couponData.minPrice) {
      console.log('yeyeyeeeeeeee');
      let temp = (totalAmount * couponData.couponOffer) / 100
      console.log(temp, '__________________');

      if (temp < couponData.priceLimit) {
        console.log('temp<<<<<<<<<<<');
        totalAmount = (totalAmount - temp)
        console.log(totalAmount);
      } else if (temp >= couponData.priceLimit) {
        console.log('temp>>>>>>>>>>>>>');
        temp = couponData.priceLimit
        totalAmount = (totalAmount - temp)
      }

      res.json({ total: totalAmount, offer: temp })

    } else if (totalAmount <= couponData.minPrice) {

      res.json({ msg: minMsg, total: totalAmount })

    }
  }).catch(() => {
    let msg = "Invalid Coupon Or It's already Expired"
    res.json({ msg: msg, total: totalAmount })
  })
})

//ORDERS
router.get('/orders', middleware.loginChecked, async (req, res) => {
  await userHelpers.deletePendingOrders()
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  res.render('user/orders', { orders, user: req.session.user, cartCount, wishCount })

})

//CANCEL ORDER
router.put('/cancel-order', (req, res) => {
  userHelpers.cancelOrder(req.body.orderId, req.body.prodId).then((response) => {
    res.json({ status: true })
  })
})

//USER PROFILE
router.get('/profile', middleware.loginChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  res.render('user/profile', { user, cartCount, wishCount })
})

//EDIT PROFILE
router.post('/profile', (req, res) => {
  userHelpers.editProfile(req.session.user._id, req.body).then(() => {
    req.session.user = req.body
    res.redirect('/profile')
  })
})


//ADD ADDRESS IN PROFILE
router.post('/add-address', (req, res) => {
  let userId = req.session.user._id
  userHelpers.addAddress(req.body, userId).then(() => {
    res.redirect('/address')
  })
})

//ADD ADDRESS IN CHECKOUT PAGE
router.post('/add-address-checkout', (req, res) => {
  let userId = req.session.user._id
  userHelpers.addAddress(req.body, userId).then(() => {
    res.redirect('/place-order')
  })
})


//DELETE ADDRESS
router.get('/delete-address/:id', middleware.loginChecked, (req, res) => {
  userHelpers.deleteAddress(req.session.user._id, req.params.id).then(() => {
    res.redirect('/address')
  })
})

//ADDRESS LIST
router.get('/address', middleware.loginChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  let address = await userHelpers.addressDetails(user._id)
  res.render('user/address', { user, address, cartCount, wishCount })
})

//CHANGE PASSWORD
router.get('/password', middleware.loginChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  res.render('user/password', { user, cartCount, wishCount })
})

router.post('/password', (req, res) => {
  userHelpers.changePassword(req.body, req.session.user._id).then(() => {
    req.session.loggedIn = false
    req.session.user = null
    res.redirect('/login')
  })
})

//WALLET
router.get('/wallet', middleware.loginChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  let wallet = await userHelpers.getWallet(user._id)
  res.render('user/wallet', { user, wallet, cartCount, wishCount })
})

//VERIFY PAYMENT
router.post('/verify-payment', async (req, res) => {
  console.log(req.body);
  let products = await userHelpers.getCartProductList(req.session.user._id)
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]'], req.session.user._id, products).then(() => {
      console.log('Payment Successfull');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})

//RETURN PRODUCT
router.post('/return-product', async (req, res) => {
  console.log(req.body, '************************8');
  let product = await productHelpers.getProductDetails(req.body.prodId)
  userHelpers.returnOrder(req.session.user._id, req.body, product).then(async (response) => {
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})

module.exports = router;
