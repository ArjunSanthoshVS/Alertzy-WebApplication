const { response } = require('express');
var express = require('express');
var router = express.Router();
const middleware = require('../middlewares/authentication-check')
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const adminHelpers = require('../helpers/admin-helpers');
const otp = require('../otp-token')
const client = require('twilio')(otp.accountSID, otp.authToken)

/* GET home page. */
router.get('/', function (req, res, next) {
  let user = req.session.user
  res.render('user/landing-page', { user })
})

router.get('/login', middleware.loginUnchecked, (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/login')
  } else {
    res.render('user/login', { not: true, "loginErr": req.session.loginErr, "otpErr": req.session.otpErr });
    req.session.loginErr = false;
  }
});

// router.post('/login', (req, res) => {
//   userHelpers.doLogin(req.body).then((response) => {
//     if (response.status) {
//       req.session.loggedIn = true;
//       req.session.user = response.user;
//       res.redirect('/');
//     } else {
//       req.session.loginErr = "Incorrect email or Password";
//       res.redirect('/login')
//     }
//   });
// });

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
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
    req.session.loginErr = "Incorrect email or Password";
    res.redirect('/login')
  })
})

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


router.get('/logout', (req, res) => {
  req.session.loggedIn = false
  req.session.user = null
  res.redirect('/');
})

router.get('/products', function (req, res, next) {
  let user = req.session.user
  let category = adminHelpers.getCategory()
  productHelpers.getAllProducts().then((products) => {
    res.render('user/products', { products, category, user: true, user })
  })
});

router.get('/product-details/:id', (req, res) => {
  let user = req.session.user
  productHelpers.getProductDetails(req.params.id).then((response) => {
    console.log(response);
    res.render('user/product-details', { response, user: true, user })
  })
})


router.get('/cart', (req, res) => {
  res.render('user/cart')
})
module.exports = router;
