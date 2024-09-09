const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load the environment variables

const state = {
    db: null
};

module.exports.connect = function (done) {
    console.log(done,"doneee.....");
    
    const url = process.env.URL; // Load URL from environment variable
    console.log(url,"djnskjgkjns");
    
    const dbname = 'Alertzy';

    MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        tls: true,  // Force using TLS/SSL
        tlsAllowInvalidCertificates: false, // Don't allow invalid certificates
        tlsInsecure: false // Ensure secure connection
    }, (err, client) => {
        if (err) {
            console.error('Connection Failed', err);
            return done(err); // Handle connection error
        }
    
        state.db = client.db(dbname); // Set the connected database instance
        console.log('Database connected successfully');
        done(); // Call done once the connection is established
    });
    
};

module.exports.get = function () {
    return state.db;
};
