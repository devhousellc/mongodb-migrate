const mongoose = require('mongoose'),
    config = require('config'),
    connectionString = config.get('db.connectionString');

mongoose.Promise = global.Promise;

let connectCount = 0;

function connectWithRetry() {
    connectCount++;
    mongoose.connect(connectionString, {
            socketOptions: {
                keepAlive: 300000, connectTimeoutMS: 3000000
            }
        },
        (err) => {
            if (err) {
                console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
                setTimeout(connectWithRetry, 5000);
            }
            else {
                let connection = mongoose.connection;

                connection.on('error', function (error) {
                    console.error('Error in MongoDb connection: ' + error);
                    mongoose.disconnect();
                });
                connection.on('connected', function () {
                    console.log('MongoDB connected!');
                });
                connection.once('open', function () {
                    console.log('MongoDB connection opened!', connectionString);
                });
                connection.on('reconnected', function () {
                    console.log('MongoDB reconnected!');
                });
            }
        });
}

connectWithRetry();

module.exports = {
    connection: mongoose.connection,
    db: mongoose.connection.db
};