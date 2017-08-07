#! /usr/bin/env node


const path = require('path');
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


async function up(until) {
    let db = new Database(argsManager),
        dbMigrations = await db.fetchAppliedMigrations(),
        dirMigrations = Migration.getMigrationsFromFolder(argsManager),
        needApply = Migration.ascentMigrations(dirMigrations, until),
        set = Migration.subtractMigrationsSets(needApply, dbMigrations),
        dbDifference = Migration.subtractMigrationsSets(dbMigrations, dirMigrations);

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

async function down(until) {
    let db = new Database(argsManager),
        dbMigrations = await db.fetchAppliedMigrations(),
        dirMigrations = Migration.getMigrationsFromFolder(argsManager),
        set = Migration.subtractMigrationsSets(dirMigrations, dbMigrations),
        dbDifference = Migration.subtractMigrationsSets(dbMigrations, dirMigrations);

    if (dbDifference.length && !argsManager.findArg("--force")) {
        console.log(`\x1b[41m>>> THE FOLLOWING ${dbDifference.length} MIGRATIONS ARE IN THE DATABASE BUT NOT IN LOCAL FILES <<<\x1b[0m`);
        let counter = 1;
        for (let migration of dbDifference) {
            console.log(`\x1b[47m${counter++}: ${migration.name}\x1b[0m`);
        }
        console.log(`\x1b[47m migration roll back is not possible, use --force option to skip that migration\x1b[0m`);
        process.exit(1);
    }


}


if (argsManager.findArg("up")) {
    up(argsManager.findKey("up"))
        .then(() => process.exit(0))
        .catch(err => {
            console.log(err);
            process.exit(1);
        })
}
else if (argsManager.findArg("down")) {
    up(argsManager.findKey("down"))
        .then(() => process.exit(0))
        .catch(err => {
            console.log(err);
            process.exit(1);
        })
}

