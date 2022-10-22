const { response } = require('express');
var express = require('express');
var router = express.Router();
const middleware = require('../middlewares/authentication-check')
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const adminHelpers = require('../helpers/admin-helpers');
const otp = require('../otp-token')
const client = require('twilio')(otp.accountSID, otp.authToken)

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

//OTP LOGIN
router.get('/otp-login', (req, res) => {
  res.render('user/otp-login', { not: true })
})
//OTP LOGIN
router.post('/otp-login', (req, res) => {
  userHelpers.otpLogin(req.body).then((response) => {
    let phone = response.user.mobile
    client
      .verify
      .services(otp.serviceID)
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
    .services(otp.serviceID)
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
  })
})

//CART
router.get('/cart', middleware.loginChecked, async (req, res) => {
  let userId = req.session.user._id
  let totalValue = await userHelpers.getTotalAmount(userId)
  let cartCount = await userHelpers.getCartCount(userId)
  let products = await userHelpers.getCartProducts(userId)
  let user = req.session.user
  console.log(products);
  res.render('user/cart', { products, user, userId, totalValue, cartCount })
})

//ADD TO CART
router.get('/add-to-cart/:id', (req, res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id, req.session.user._id).then((count) => {
    res.json({ status: true })
  })
})

//CART PRODUCT QUANTITY
router.post('/change-product-quantity', (req, res) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    console.log(req.body.user);
    res.json(response)
  })

})

//DELETE CART PRODUCT
router.get('/delete-cart-product/:id', (req, res) => {
  userHelpers.deleteProductFromCart(req.params.id, req.session.user._id).then(() => {
    res.redirect('/cart')
  })
})

//WISHLIST
router.get('/wishlist', middleware.loginChecked, async (req, res) => {
  let userId = req.session.user._id
  let products = await userHelpers.getWishProducts(userId)
  let user = req.session.user
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
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let cartProducts = await userHelpers.getCartProducts(req.session.user._id)
  res.render('user/place-order', { total, user, cartProducts })
})

router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    res.json({ status: true })
  })
  console.log(req.body);
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
module.exports = router;
