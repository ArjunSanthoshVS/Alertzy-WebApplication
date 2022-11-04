var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const middleware = require('../middlewares/authentication-check')
const mkdirp = require('mkdirp');

//ENTERING PAGE
router.get('/', function (req, res, next) {
  if (req.session.adminloggedIn) {
    res.redirect('/admin/dashboard')
  } else {
    res.render('admin/login', { not: true, "loginErr": req.session.loginErr });
    req.session.loginErr = false;
  }
});

//LOGIN
router.get('/login', (req, res) => {
  res.render('admin/login', { not: true });
});

router.post('/login', (req, res) => {
  adminHelpers.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      res.redirect('/admin/dashboard');
    } else {
      req.session.loginErr = "Incorrect email or Password";
      res.redirect('/admin/login')
    }
  });
});

//ADMIN LOGOUT
router.get('/logout', (req, res) => {
  req.session.adminloggedIn = false
  req.session.admin = null
  res.redirect('/admin/login');
})

//ADMIN SIGNUP
router.get('/signup', middleware.adminLoginUnchecked, (req, res) => {
  res.render('admin/signup', { "signupErr": req.session.signupErr })
  req.session.signupErr = false
})

router.post('/signup', (req, res) => {
  adminHelpers.adminSignUp(req.body).then((resolve) => {
    console.log(resolve)
    if (resolve.data) {
      res.redirect('/admin/login')
    } else {
      req.session.signupErr = resolve.message;
      res.redirect('/signup');
    }
  })
})

//PRODUCTS LISTING
router.get('/products', middleware.adminLoginChecked, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    let admin = req.session.admin;
    res.render('admin/products', { products, admin: true, admin });
  })
});

//ADD PRODUCT
router.get('/add-product', middleware.adminLoginChecked, async (req, res) => {
  let admin = req.session.admin;
  let category = await adminHelpers.getCategory()
  res.render('admin/add-product', { category, admin: true, admin })
})

router.post('/add-product', (req, res) => {
  console.log(req.body);
  adminHelpers.addProduct(req.body, (id) => {
    let image1 = req.files?.image1;
    let image2 = req.files?.image2;
    let image3 = req.files?.image3;
    let image4 = req.files?.image4;
    mkdirp('./public/product-images/' + id).then(() => {
      image1.mv('./public/product-images/' + id + "/" + id + "_0" + '.png')
      image2.mv('./public/product-images/' + id + "/" + id + "_1" + '.png')
      image3.mv('./public/product-images/' + id + "/" + id + "_2" + '.png')
      image4.mv('./public/product-images/' + id + "/" + id + "_3" + '.png')
    })
    res.redirect('/admin/products')
  })
})

// router.post("/add-productSample", (req, res) => {
//   productHelpers.addProduct(req.body, (id) => {
//     let image = req.files?.image;
//     if (Array.isArray(image)) {
//       mkdirp('./public/product-images/' + id).then(() => {
//         image.forEach((element, index) => {
//           element.mv('./public/product-images/' + id + "/" + id + "_" + index + '.png')
//         });
//       })
//       res.redirect('/admin/products')
//     } else {
//       image?.mv('./public/product-images/' + id + '.png')
//       res.redirect('/admin/products')
//     }
//   })
// })

//EDIT PRODUCT
router.get('/edit-product/:prodId', async (req, res) => {
  let admin = req.session.admin;
  console.log('###################', req.params.prodId, ' &&&&&&&&&&&&&&& ');
  let product = await productHelpers.getProductDetails(req.params.prodId)
  let category = await adminHelpers.getCategory()
  console.log(product);
  res.render('admin/edit-product', { product, category, admin: true, admin })
})

router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    let id = req.params.id;
    let image1 = req.files?.image1
    let image2 = req.files?.image2
    let image3 = req.files?.image3
    let image4 = req.files?.image4

    if (image1) {
      image1.mv('./public/product-images/' + id + "/" + id + "_0" + '.png')
    }
    if (image2) {
      image2.mv('./public/product-images/' + id + "/" + id + "_1" + '.png')
    }

    if (image3) {
      image3.mv('./public/product-images/' + id + "/" + id + "_2" + '.png')
    }
    if (image4) {
      image4.mv('./public/product-images/' + id + "/" + id + "_3" + '.png')
    }
    res.redirect('/admin/products')
  })
})

// router.post('/edit-product/:id', (req, res) => {
//   let id = req.params.id
//   productHelpers.updateProduct(req.params.id, req.body).then(() => {
//     res.redirect('/admin/products')
//     let image = req.files?.image;
//     if (Array.isArray(image)) {
//       mkdirp('./public/product-images/' + id).then(() => {
//         image.forEach((element, index) => {
//           element.mv('./public/product-images/' + id + "/" + id + "_" + index + '.png')
//         });
//       })
//     } else {
//       image?.mv('./public/product-images/' + id + '.png')
//     }
//   })
// })

//DELETE PRODUCT
router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id
  productHelpers.deleteProduct(prodId).then((response) => {
    //res.redirect('/admin/products')
    res.json(response)
  })
})

//USERS LISTING
router.get('/users', middleware.adminLoginChecked, (req, res) => {
  adminHelpers.listAllUsers().then((users) => {
    let admin = req.session.admin
    res.render('admin/users', { admin: true, users, admin })
  })
})

//USER STATUS
router.get('/users/:id', (req, res) => {
  adminHelpers.userStatus(req.params.id).then((response) => {
    res.redirect('/admin/users')
  })
})

//CATEGORY LISTING
router.get('/category', middleware.adminLoginChecked, (req, res) => {
  adminHelpers.getCategory().then((category) => {
    let admin = req.session.admin
    res.render('admin/manage-category', { admin: true, category, admin })
  })

})

router.post('/category', (req, res) => {
  console.log(req.body);
  adminHelpers.addCategory(req.body).then(() => {
    if (!err) {
      let successmsg = encodeURIComponent('Category added successfully');
      res.redirect('/admin/category?msg=' + successmsg)
    }
  }).catch(() => {
    res.redirect('/admin/category')
  })

})

//DELETE CATEGORY 
router.get('/delete-category/:id', (req, res) => {
  let catId = req.params.id
  adminHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/category')
  })
})

//ORDERS
router.get('/orders', middleware.adminLoginChecked, (req, res) => {
  adminHelpers.getOrderDetails('placed').then((orderItems) => {
    res.render('admin/orders', { admin: true, orderItems })
  })
})

//ORDER STATUS
router.get('/orders/:status', (req, res) => {
  adminHelpers.getOrderDetails(req.params.status).then((response) => {
    res.json(response)
  })
})

router.post('/order-status', (req, res) => {
  adminHelpers.changeOrderStatus(req.body.orderId, req.body.status).then(() => {
    res.json({ status: true })
  })
})

//CANCEL ORDER
router.get('cancel-order/:orderId', (req, res) => {
  userHelpers.cancelOrder(req.params.orderId).then(() => {
    res.json({ status: true })
  })
})

//SALES REPORT
router.get('/sales-report', async (req, res) => {
  if (req.query?.month) {
    let month = req.query?.month.split("-")
    let [yy, mm] = month;

    deliveredOrders = await adminHelpers.deliveredOrderList(yy, mm)
  } else if (req.query?.daterange) {
    deliveredOrders = await adminHelpers.deliveredOrderList(req.query);
  } else {
    deliveredOrders = await adminHelpers.deliveredOrderList();
  }
  let amount = await adminHelpers.totalAmountOfdelivered()
  console.log(amount);
  res.render('admin/sales-report', { admin: true, deliveredOrders, amount })
})


//DASHBOARD COUNT
router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard', { admin: true })
})

router.get('/dashboard/:days', (req, res) => {
  adminHelpers.dashboardCount(req.params.days).then((data) => {
    console.log('45678uygdejbnoljw', data);
    res.json(data)
  })
})

//OFFER MANAGEMENT
router.get('/offer-management', async (req, res) => {
  let products = await productHelpers.getAllProducts()
  let category = await adminHelpers.getCategory()
  let productOffer = await productHelpers.getProductOffer()
  let categoryOffer = await productHelpers.getCategoryOffer()
  res.render('admin/offer', { admin: true, products, category, productOffer, categoryOffer })
})

//PRODUCT OFFER
router.post('/offer-management/product-offer', (req, res) => {
  productHelpers.addProductOffer(req.body).then((response) => {
    res.redirect('/admin/offer-management')
    //res.json(response)
  })
})

//DELETE PRODUCT OFFER
router.post('/offer-management/delete-product-offer/:id', (req, res) => {
  console.log(req.body);
  productHelpers.deleteProductOffer(req.params.id).then((response) => {
    res.json({ status: true })
  })
})

//CATEGORY OFFER
router.post('/offer-management/category-offer', (req, res) => {
  productHelpers.addCategoryOffer(req.body).then((response) => {
    console.log(req.body);
    res.redirect('/admin/offer-management')
  })
})

//DELETE CATEGORY OFFER
router.post('/offer-management/delete-category-offer', (req, res) => {
  console.log(req.body);
  productHelpers.deleteCategoryOffer(req.body.category).then((response) => {
    res.json({ status: true })
  })
})
module.exports = router;
