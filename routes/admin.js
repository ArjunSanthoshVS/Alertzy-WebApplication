var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers');
const middleware = require('../middlewares/authentication-check')
const mkdirp = require('mkdirp')

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.render('admin/login', { not: true });
});

router.get('/login', middleware.adminLoginUnchecked, (req, res) => {
  res.render('admin/login', { "loginErr": req.session.loginErr });
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

// router.get('/signup', middleware.adminLoginUnchecked, (req, res) => {
//   res.render('admin/signup', { "signupErr": req.session.signupErr })
//   req.session.signupErr = false
// })

// router.post('/signup', (req, res) => {
//   adminHelpers.adminSignUp(req.body).then((resolve) => {
//     console.log(resolve)
//     if (resolve.data) {
//       res.redirect('/admin/login')
//     } else {
//       req.session.signupErr = resolve.message;
//       res.redirect('/signup');
//     }
//   })
// })

router.get('/products', middleware.adminLoginChecked, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    let admin = req.session.admin;
    res.render('admin/products', { products, admin: true, admin });
  })
});

router.get('/add-product', async (req, res) => {
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

router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/products')
  })
})

router.get('/users', (req, res) => {
  adminHelpers.listAllUsers().then((users) => {
    let admin = req.session.admin
    res.render('admin/users', { admin: true, users, admin })
  })
})

router.get('/users/:id', (req, res) => {
  adminHelpers.userStatus(req.params.id).then((response) => {
    res.redirect('/admin/users')
  })
})

router.get('/category', (req, res) => {
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

router.get('/delete-category/:id', (req, res) => {
  let catId = req.params.id
  adminHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/category')
  })
})

router.post('/edit-category/:id', (req, res) => {
  let catId = req.params.id
  adminHelpers.editCategory(req.params.id, req.body).then(() => {
    if (!err) {
      let successmsg = encodeURIComponent('Category added successfully');
      res.redirect('/admin/category?msg=' + successmsg)
    }
  }).catch(() => {
    res.redirect('/admin/category')
  })
})

module.exports = router;
