var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt');
var objectId = require('mongodb').ObjectId


module.exports = {
    doSignUp: (userData) => {
        userData.status = true
        return new Promise(async (resolve, reject) => {
            let emailChecking = await db.get().collection(collection.USER_COLLECTION).find({ email: userData.email }).toArray()
            if (emailChecking.length !== 0) {
                console.log(emailChecking)
                resolve({ data: false, message: "Email is already used" })
            } else {
                userData.password = await bcrypt.hash(userData.password, 10);
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((result) => {
                    resolve({ data: true });
                })
            }
        })
    },
    doLogin: (userData) => {
        let response = {};
        console.log(userData);
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            console.log(user);
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log('Login Failed');
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log('Login err');
                resolve({ status: false })
            }

        })
    }

}