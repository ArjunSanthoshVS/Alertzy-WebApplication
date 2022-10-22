module.exports = {
    loginChecked: (req, res, next) => {
        console.log(req.session.user)
        if (req.session.loggedIn) {
            next()
        } else {
            res.redirect('/');
        }
    },
    loginUnchecked: (req, res, next) => {
        console.log(req.session.user)
        if (req.session.user) {
            res.redirect('/');
        } else {
            next()
        }
    },

    adminLoginChecked: (req, res, next) => {
        console.log(req.session.admin)
        if (req.session.adminloggedIn) {
            next();
        } else {
            res.redirect('/admin/login');
        }
    },
    adminLoginUnchecked: (req, res, next) => {
        console.log(req.session.admin)
        if (req.session.admin) {
            res.redirect('/admin/products');
        } else {
            next();
        }
    }
}