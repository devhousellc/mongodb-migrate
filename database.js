const MongoClient     = require('mongodb').MongoClient,
      Migration       = require('./migration'),
      { askQuestion } = require('./utils');


class Database {
  constructor(argsManager) {
    this.argsManager    = argsManager;
    this.collectionName = this.argsManager.getCollectionName();
  }

  getConnection() {
    let connectionString = this.argsManager.getConnectionString();
    return this.mongoConnect(connectionString);
  }

  mongoConnect(uri) {
    return new Promise((resolve, reject) => {
      return MongoClient.connect(uri, function(err, db) {
        if (err) {
          return reject(err);
        } else {
          return resolve(db);
        }
      });
    });
  }

  async cleanUpMigrationsCollection() {
    let db = await this.getConnection();
    return db.collection(this.collectionName)
      .deleteMany({});
  }

  async fixMigrationsCollection() {
    let message = `it looks like you ${this.collectionName} collection is damaged. \x1b[32mWould you like to fix it?\x1b[0m`;

    await askQuestion(message, this.argsManager);

    await this.cleanUpMigrationsCollection();

    let migrations = Migration.getMigrationsFromFolder(this.argsManager);
    for (let migration of migrations) {
      try {
        await askQuestion(`is that migration: \x1b[33m${migration.name}\x1b[0m already applied?`, this.argsManager);
        await this._writeDownMigration(migration);
      } catch (err) {
        //TODO: make common-error module to throw and handle appropriate errors
        if (err === 'declined by user') {
          continue;
        } else {
          throw err;
        }
      }
    }
  }

  async fetchAppliedMigrations() {
    let db = await this.getConnection();

    let result = await db.collection(this.collectionName)
      .find({})
      .toArray()
      .then(migrations => {
          try {
            return migrations
              .map(migration =>
                 new Migration(migration.name, undefined, migration.applied));
          } catch (err) {
            if (err === 'PARSERROR') { //TODO: error...
              return this.fixMigrationsCollection()
                .then(() => this.fetchAppliedMigrations());
            } else {
              throw err;
            }
          }
        }
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
      .updateOne({
        name: migration.name
      }, {
        name: migration.name,
        applied: new Date()
      }, {
        upsert: true
      });
  }

  async _cleanUpMigration(migration) {
    let db = await this.getConnection();

    return db.collection(this.collectionName)
      .deleteMany({
        name: migration.name
      });

  }

  async upMigrations(migrations) {
    return this._applyMigrations(migrations, 'up');
  }

  async downMigrations(migrations) {
    return this._applyMigrations(migrations, 'down');
  }

  async _applyMigrations(migrations, method) {
    for (let migration of migrations) {
      try {
        await migration[method]();
      }
      catch (err) {
        throw (
          `during ${method} migration [${migration.name}] an error occurred:
                     ${JSON.stringify(err, null, 2)} migration process interrupted`
        );
      }

      try {
        switch (method) {
          case 'up':
            await this._writeDownMigration(migration);
            break;
          case 'down':
            await this._cleanUpMigration(migration);
            break;
        }
      }
      catch (err) {
        throw (
          `migration ${this.collectionName} ${method} successfully, but
                     an error occurred during persisting migration in [${migration.name}] collection:
                     ${JSON.stringify(err, null, 2)}
                     migration process interrupted`
        );
      }
    }
  }


}

module.exports = Database;
