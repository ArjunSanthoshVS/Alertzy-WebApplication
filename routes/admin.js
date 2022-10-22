var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const middleware = require('../middlewares/authentication-check')
const mkdirp = require('mkdirp')

//ENTERING PAGE
router.get('/', function (req, res, next) {
  res.render('admin/login', { not: true });
});

//LOGIN
router.get('/login', middleware.adminLoginUnchecked, (req, res) => {
  res.render('admin/login', { "loginErr": req.session.loginErr, not: true });
  req.session.loginErr = false;
});

router.post('/login', (req, res) => {
  adminHelpers.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      res.redirect('/admin/products');
    } else {
      req.session.loginErr = "Incorrect email or Password";
      res.redirect('/admin/login')
    }
  });
});

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

router.post("/add-product", (req, res) => {
  console.log(req.body);
  console.log(req.files.image);
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files?.image;
    if (Array.isArray(image)) {
      mkdirp('./public/product-images/' + id).then(() => {
        image.forEach((element, index) => {
          element.mv('./public/product-images/' + id + "/" + id + "_" + index + '.png')
        });
      })
      res.redirect('/admin/products')
    } else {
      image?.mv('./public/product-images/' + id + '.png')
    }
  })
})

//EDIT PRODUCT
router.get('/edit-product/:id', async (req, res) => {
  let admin = req.session.admin;
  let product = await productHelpers.getProductDetails(req.params.id)
  let category = await adminHelpers.getCategory()
  console.log(product);
  res.render('admin/edit-product', { product, category, admin: true, admin })
})

router.post('/edit-product/:id', (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/products')
    let image = req.files?.image;
    if (Array.isArray(image)) {
      mkdirp('./public/product-images/' + id).then(() => {
        image.forEach((element, index) => {
          element.mv('./public/product-images/' + id + "/" + id + "_" + index + '.png')
        });
      })
    } else {
      image?.mv('./public/product-images/' + id + '.png')
    }
  })
})

//DELETE PRODUCT
router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/products')
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
module.exports = router;
