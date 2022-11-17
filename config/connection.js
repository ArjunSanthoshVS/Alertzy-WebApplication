const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}
module.exports.connect = function (done) {
    const url = 'mongodb+srv://Arjun:UtKC2pI08DgNkLbb@cluster0.9jrdgji.mongodb.net/?retryWrites=true&w=majority'
    const dbname = 'Alertzy'
    mongoClient.connect(url, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
    })
    done()
}
module.exports.get = function () {
    return state.db
}