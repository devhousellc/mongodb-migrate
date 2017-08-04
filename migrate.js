#! /usr/bin/env node


const path = require('path');
const fs = require('fs');

const ArgsManager = require('./args-manager');
const Database = require('./database');
const Migration = require('./migration');


const CONFIG_DIR = "./config";

process.env.NODE_CONFIG_DIR = path.resolve(process.cwd(), CONFIG_DIR);


let config = require('config');


if (!process.env.NODE_ENV) {
    console.error(`NODE_ENV is ${process.env.NODE_ENV}. You must set it manually for complete control over migrations!`);
    process.exit(1);
} else {
    console.log(`migration started with environment NODE_ENV=${process.env.NODE_ENV}`);
}


let argsManager = new ArgsManager(process.argv, config, process.cwd());


async function up() {
    let db = new Database(argsManager);
    let dbMigrations = await db.fetchAppliedMigrations();
    let dirMigrations = Migration.getMigrationsFromFolder(argsManager);
    let set = Migration.subtractMigrationsSets(dirMigrations, dbMigrations);
    let dbDifference = Migration.subtractMigrationsSets(dbMigrations, dirMigrations);

    console.log();
    if (dbDifference.length) {
        console.log(`\x1b[41m>>> THE FOLLOWING ${dbDifference.length} MIGRATIONS ARE IN THE DATABASE BUT NOT IN LOCAL FILES <<<\x1b[0m`);
        let counter = 1;
        for (let migration of dbDifference) {
            console.log(`\x1b[47m${counter++}: ${migration.name}\x1b[0m`);
        }
        console.log();
    }
    await db.upMigrations(set);
}

async function down() {
    let db = new Database(argsManager);

    let dbMigrations = await db.fetchAppliedMigrations();
    let dirMigrations = Migration.getMigrationsFromFolder(argsManager);
    let set = Migration.subtractMigrationsSets(dirMigrations, dbMigrations);
    let dbDifference = Migration.subtractMigrationsSets(dbMigrations, dirMigrations);

}


if (argsManager.findArg("up")) {
    up()
        .then(() => process.exit(0))
}
else if (argsManager.findArg("down")) {
    up()
        .then(() => process.exit(0))
}

