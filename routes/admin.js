var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const middleware = require('../middlewares/authentication-check')
const cloudinary = require('../utils/cloudinary')

const multer = require('multer')
const path = require('path');

upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname)
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".webp") {
      cb(new Error("File type is not supported"), false)
      console.log('Its workinggggggggggggggggggggg');
      return
    }
    cb(null, true)
  }
})

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

router.post('/add-product', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]), async (req, res) => {
  console.log(req.files);
  const cloudinaryImageUploadMethod = (file) => {
    console.log("qwertyui");
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        console.log(err, " asdfgh");
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )
  console.log(urls);

  productHelpers.addProduct(req.body, urls, (id) => {
    res.redirect('/admin/products')
  })
})

//EDIT PRODUCT
router.get('/edit-product/:prodId', async (req, res) => {
  let admin = req.session.admin;
  let product = await productHelpers.getProductDetails(req.params.prodId)
  let category = await adminHelpers.getCategory()
  res.render('admin/edit-product', { product, category, admin: true, admin })
})

router.post('/edit-product/:id', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]), async (req, res) => {
  console.log(req.files);
  const cloudinaryImageUploadMethod = (file) => {
    console.log("qwertyui");
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        console.log(err, " asdfgh");
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )
  console.log(urls);
  productHelpers.updateProduct(req.params.id, req.body, urls).then((id) => {
    res.redirect('/admin/products')
  })
})

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
  adminHelpers.addCategory(req.body).then(() => {
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})

//EDIT CATEGORY
router.put('/edit-category', (req, res) => {
  console.log(req.body, '###########');
  adminHelpers.editCategory(req.body).then(() => {
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})

//DELETE CATEGORY 
router.get('/delete-category/:id', (req, res) => {
  console.log(req.params.id);
  let catId = req.params.id
  adminHelpers.deleteCategory(catId).then((response) => {
    res.json(response)
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
  adminHelpers.changeOrderStatus(req.body.prodId, req.body.orderId, req.body.status).then(() => {
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
  res.render('admin/sales-report', { admin: true, deliveredOrders, amount })
})


//DASHBOARD COUNT
router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard', { admin: true })
})

router.get('/dashboard/:days', (req, res) => {
  adminHelpers.dashboardCount(req.params.days).then((data) => {
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
router.post('/offer-management/delete-product-offer/:id', async (req, res) => {
  let products = await productHelpers.getAllProducts()
  console.log(products);
  productHelpers.deleteProductOffer(req.params.id, products).then((response) => {
    res.json({ status: true })
  })
})

//CATEGORY OFFER
router.post('/offer-management/category-offer', (req, res) => {
  productHelpers.addCategoryOffer(req.body).then((response) => {
    res.redirect('/admin/offer-management')
  })
})

//DELETE CATEGORY OFFER
router.post('/offer-management/delete-category-offer', (req, res) => {
  productHelpers.deleteCategoryOffer(req.body.category).then((response) => {
    res.json({ status: true })
  })
})

//COUPON
router.get('/coupon', async (req, res) => {
  let coupon = await adminHelpers.getCoupon()
  res.render('admin/coupon', { admin: true, coupon })
})

//ADD COUPON
router.post('/add-coupon', (req, res) => {
  adminHelpers.addCoupon(req.body).then(() => {
    res.json({ status: true })
  }).catch(() => {
    console.log('Failed');
    res.json({ status: false })
  })
})

//DELETE COUPON
router.post('/delete-coupon', (req, res) => {
  adminHelpers.deleteCoupon(req.body.coupon).then((response) => {
    res.json({ response })
  })
})

//BANNER MANAGEMENT
router.get('/banner', middleware.adminLoginChecked, async (req, res) => {
  let banner = await adminHelpers.getBanner()
  res.render('admin/banner', { admin: true, banner })
})

router.post('/banner', upload.fields([
  { name: 'banner1', maxCount: 1 },
  { name: 'banner2', maxCount: 1 },
  { name: 'banner3', maxCount: 1 },
  { name: 'banner4', maxCount: 1 },
]), async (req, res) => {
  console.log(req.files);
  const cloudinaryImageUploadMethod = (file) => {
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        console.log(err, " asdfgh");
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )
  console.log(urls);

  adminHelpers.addBanner(req.body, urls).then(() => {
    res.redirect('/admin/banner')
  })
})
module.exports = router;
