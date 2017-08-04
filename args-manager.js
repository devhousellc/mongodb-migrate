'use strict';

const path = require('path');

const COLLECTION_NAME = "migrations";
const CONFIG_CONNECTION = "db.connectionString";
const MIGRATIONS_DIR = "./migrations";


class ArgsManager {

    constructor(args, config, processPath) {
        this.args = args;
        this.config = config;
        this.processPath = processPath;
    }

    static removeQuotes(string) {
        return string.replace(/"/g, '').replace(/'/g, '');
    }

    findArg(argName) {
        for (let i = 0; i < this.args.length; i++) {
            if (this.args[i].includes(argName)) {
                if (this.args[i].includes("=")) {
                    let arg = this.args[i].replace(argName + "=", "");
                    return {
                        key: argName,
                        value: ArgsManager.removeQuotes(arg)
                    };
                } else { //if not returns the next argument
                    if (i + 1 === this.args.length) {
                        return undefined;
                    } else {
                        return {
                            key: argName,
                            value: ArgsManager.removeQuotes(this.args[i + 1])
                        };
                    }
                }
            }
        }
    }


    getConnectionString() {
        let configArg = this.findArg("--configConnection"),
            connectionString;

        if (configArg && configArg.value) {
            connectionString = this.config.get(configArg.value);
        }
        connectionString = this.config.get(CONFIG_CONNECTION);

        return connectionString;
    }

    migrationsFilesPath() {
        let migrationsArg = this.findArg("--migrationsDir");

        if (migrationsArg && migrationsArg.value) {
            return path.resolve(this.processPath, migrationsArg.value);
        }

        return path.resolve(this.processPath, MIGRATIONS_DIR);
    }

    getCollectionName() {
        let collectionArg = this.findArg("--collection");
        if (collectionArg && collectionArg.value) {
            return collectionArg.value
        }
        return COLLECTION_NAME;
    }
}

module.exports = ArgsManager;