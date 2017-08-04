let MongoClient = require('mongodb').MongoClient;
let Migration = require('./migration');


class Database {
    constructor(argsManager) {
        this.argsManager = argsManager;
    }

    getConnection() {
        let connectionString = this.argsManager.getConnectionString();
        return this.mongoConnect(connectionString);
    }

    mongoConnect(uri) {
        return new Promise((resolve, reject) => {
            return MongoClient.connect(uri, function (err, db) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(db)
                }
            })
        })
    }

    async fetchAppliedMigrations() {
        let db = await this.getConnection(),
            collectionName = this.argsManager.getCollectionName();

        let result = await db.collection(collectionName)
            .find({})
            .toArray()
            .then(migrations =>
                migrations
                    .map(migration =>
                        new Migration(migration.name, undefined, migration.applied))
            );

        db.close();

        return result;
    }

    async upMigrations(migrations) {
        for (let migration of migrations) {
            await migration.up()
        }
    }
}

module.exports = Database;

