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
const { Router } = require('express');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret': process.env.CLIENT_SECRET
});



//ENTERING PAGE
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  adminHelpers.getCategory().then((category) => {
    res.render('user/landing-page', { user, cartCount, category })
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
  console.log(req.body.mobile);
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
    console.log(resolve)
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

//PRODUCTS LIST
router.get('/products', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let category = adminHelpers.getCategory()
  productHelpers.getAllProducts().then((products) => {
    res.render('user/products', { products, category, user: true, user, cartCount })
  })
});

//PRODUCTS DETAILS
router.get('/product-details/:id', async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getProductDetails(req.params.id).then((response) => {
    console.log(response);
    res.render('user/product-details', { response, user: true, user, cartCount })
    console.log(response.description);
  })
})

//CART
router.get('/cart', middleware.loginChecked, async (req, res) => {
  let userId = req.session.user._id
  let totalValue = await userHelpers.getTotalAmount(userId)
  let cartCount = await userHelpers.getCartCount(userId)
  let products = await userHelpers.getCartProducts(userId)
  let user = req.session.user
  res.render('user/cart', { products, user, userId, totalValue, cartCount })
})

//ADD TO CART
router.get('/add-to-cart/:id', (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then((count) => {
    res.json({ status: true })
  })
})

//CART PRODUCT QUANTITY
router.post('/change-product-quantity', (req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })

})

//DELETE CART PRODUCT
router.get('/delete-cart-product/:id', (req, res) => {
  userHelpers.deleteProductFromCart(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  })
})

//WISHLIST
router.get('/wishlist', middleware.loginChecked, async (req, res) => {
  let userId = req.session.user._id
  let products = await userHelpers.getWishProducts(userId)
  let user = req.session.user
  console.log(products);
  res.render('user/wishlist', { products, user, userId })
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
  let address = await userHelpers.addressDetails(user._id)
  res.render('user/place-order', { total, user, cartProducts, address })
})

router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.session.user._id)
  let totalPrice = await userHelpers.getTotalAmount(req.session.user._id)
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

router.get('/success', (req, res) => {
  userHelpers.changePaymentStatus(req.session.orderId).then(() => {
    req.session.orderId = null
    res.redirect('/orders')
  })
})

//ORDERS
router.get('/orders', middleware.loginChecked, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { orders, user: req.session.user })

})

// //ORDERED PRODUCTS
// router.get('/view-ordered-products/:id', async (req, res) => {
//   let products = await userHelpers.getOrderProducts(req.params._id)
//   res.render('user/view-ordered-products', { user: req.session.user, products })
// })

//CANCEL ORDER
router.get('/cancel-order/:id', (req, res) => {
  userHelpers.cancelOrder(req.params.id).then((response) => {
    res.json({ status: true })
  })
})

//USER PROFILE
router.get('/profile', middleware.loginChecked, (req, res) => {
  let user = req.session.user
  res.render('user/profile', { user })
})

//EDIT PROFILE
router.post('/profile', (req, res) => {
  userHelpers.editProfile(req.session.user._id, req.body).then(() => {
    req.session.user = req.body
    console.log(req.session.user);
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

//EDIT ADDRESS
// router.post('/edit-address/:addId', (req, res) => {
//   userHelpers.editAddress(req.body, req.params.addId, req.session.user._id).then((newData) => {
//     res.redirect('/address')
//   })
// })

//DELETE ADDRESS
router.get('/delete-address/:id', middleware.loginChecked, (req, res) => {
  userHelpers.deleteAddress(req.session.user._id, req.params.id).then(() => {
    res.redirect('/address')
  })
})

//ADDRESS LIST
router.get('/address', middleware.loginChecked, async (req, res) => {
  let user = req.session.user
  let address = await userHelpers.addressDetails(user._id)
  res.render('user/address', { user, address })
})

//CHANGE PASSWORD
router.get('/password', middleware.loginChecked, (req, res) => {
  let user = req.session.user
  res.render('user/password', { user })
})

router.post('/password', (req, res) => {
  userHelpers.changePassword(req.body, req.session.user._id).then(() => {
    req.session.loggedIn = false
    req.session.user = null
    res.redirect('/login')
  })
})

//VERIFY PAYMENT
router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('Payment Successfull');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})

module.exports = router;
