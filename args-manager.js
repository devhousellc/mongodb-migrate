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

    /**
     * look up the argument in the argument list
     * @param argName {string} the name of the argument
     * @returns {boolean} true of argument found, false otherwise
     */
    findArg(argName) {
        let found = false;

        for (let i = 0; i < this.args.length; i++) {

            if (this.args[i].includes("=")) { //if --blala=pathto  format
                found = this.args[i].includes(argName) || found;
            } else {
                found = this.args[i].trim() === argName || found;
            }

        }

        return found;
    }

    findKey(argName) {
        for (let i = 0; i < this.args.length; i++) {
            if (this.args[i].includes("=") && this.args[i].includes(argName)) {

                let arg = this.args[i].replace(argName + "=", "");
                return ArgsManager.removeQuotes(arg);

            } else if (this.args[i] === argName) {

                if (i + 1 === this.args.length) {
                    return undefined;
                } else {
                    return ArgsManager.removeQuotes(this.args[i + 1]);
                }

            }
        }
    }


    getConnectionString() {
        let configArg = this.findKey("--configConnection"),
            connectionString;

        if (configArg) {
            connectionString = this.config.get(configArg);
        }
        connectionString = this.config.get(CONFIG_CONNECTION);

        return connectionString;
    }

    migrationsFilesPath() {
        let migrationsArg = this.findKey("--migrationsDir");

        if (migrationsArg) {
            return path.resolve(this.processPath, migrationsArg);
        }

        return path.resolve(this.processPath, MIGRATIONS_DIR);
    }

    getCollectionName() {
        let collectionArg = this.findKey("--collection");
        if (collectionArg) {
            return collectionArg
        }
        return COLLECTION_NAME;
    }
}

module.exports = ArgsManager;