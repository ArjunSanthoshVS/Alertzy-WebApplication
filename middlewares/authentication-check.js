module.exports = {
    loginChecked: (req, res, next) => {
        if (req.session.loggedIn) {
            next()
        } else {
            res.redirect('/');
        }
    },
    loginUnchecked: (req, res, next) => {
        if (req.session.user) {
            res.redirect('/');
        } else {
            next()
        }
    },

    adminLoginChecked: (req, res, next) => {
        if (req.session.adminloggedIn) {
            next();
        } else {
            res.redirect('/admin/login');
        }
    },
    adminLoginUnchecked: (req, res, next) => {
        if (req.session.admin) {
            res.redirect('/admin/products');
        } else {
            next();
        }
    }
}