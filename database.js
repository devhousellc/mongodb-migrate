let MongoClient = require('mongodb').MongoClient;
let Migration = require('./migration');


class Database {
    constructor(argsManager) {
        this.argsManager = argsManager;
        this.collectionName = this.argsManager.getCollectionName()
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
        let db = await this.getConnection();

        let result = await db.collection(this.collectionName)
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

    /**
     * make a note in database that specified migration applied
     * @param migration {Migration}
     * @returns {Promise.<void>}
     */
    async _writeDownMigration(migration) {
        let db = await this.getConnection();

        return db.collection(this.collectionName)
            .update({
                name: migration.name
            }, {
                name: migration.name,
                applied: new Date()
            }, {
                upsert: true
            })
    }

    async _cleanUpMigration(migration) {
        let db = await this.getConnection();

        return db.collection(this.collectionName)
            .remove({
                name: migration.name
            })

    }

    async upMigrations(migrations) {
        return this._applyMigrations(migrations, "up");
    }

    async downMigrations(migrations) {
        return this._applyMigrations(migrations, "down");
    }

    async _applyMigrations(migrations, method) {
        for (let migration of migrations) {
            try {
                await migration[method]()
            }
            catch (err) {
                throw ({
                    message: `during ${method} migration [${migration.name}] an error occurred:
                     ${JSON.stringify(err, null, 2)} migration process interrupted`
                });
            }

            try {
                switch (method) {
                    case "up":
                        await this._writeDownMigration(migration);
                        break;
                    case "down":
                        await this._cleanUpMigration(migration);
                        break;
                }
            }
            catch (err) {
                throw ({
                    message: `migration ${this.collectionName} ${method} successfully, but
                     an error occurred during persisting migration in [${migration.name}] collection:
                     ${JSON.stringify(err, null, 2)}
                     migration process interrupted`
                });
            }
        }
    }


}

module.exports = Database;

