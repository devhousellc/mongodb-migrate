#! /usr/bin/env node

const path = require('path'),
    ArgsManager = require('./args-manager'),
    Database = require('./database'),
    Migration = require('./migration'),
    readLine = require('readline');

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
});


const CONFIG_DIR = "./config";

process.env.NODE_CONFIG_DIR = path.resolve(process.cwd(), CONFIG_DIR);

let config = require('config');

let argsManager = new ArgsManager(process.argv, config, process.cwd());

function askAboutConnection() {
    return new Promise((resolve, reject) => {
        if (argsManager.findArg('--silence')) {
            resolve();
            return;
        }

        rl.question(`with current working environment will be used \x1b[32m${argsManager.getConnectionString()}\x1b[0m are you agree with that? [y/n]: `, (answer) => {

            if (answer === 'y' || answer === 'yes') {
                resolve()
            } else {
                reject('declined by user')
            }

            rl.close();
        })
    });

}

function showRaggedMigrations(dbMigrations, dirMigrations) {
    const dbDifference = Migration.subtractMigrationsSets(dbMigrations, dirMigrations);

    if (dbDifference.length) {
        console.log(`\x1b[41m>>> THE FOLLOWING ${dbDifference.length} MIGRATIONS ARE IN THE DATABASE BUT NOT IN LOCAL FILES <<<\x1b[0m`);
        let counter = 1;
        for (let migration of dbDifference) {
            console.log(`\x1b[47m${counter++}: ${migration.name}\x1b[0m`);
        }
        console.log();
        return true;
    }
    return false;
}

async function up(until) {
    let db = new Database(argsManager),
        dbMigrations = await db.fetchAppliedMigrations(),
        dirMigrations = Migration.getMigrationsFromFolder(argsManager),
        needApply = Migration.ascentMigrations(dirMigrations, until),
        set = Migration.subtractMigrationsSets(needApply, dbMigrations);

    showRaggedMigrations(dbMigrations, dirMigrations);

    await db.upMigrations(set);
}

async function down(until) {
    let db = new Database(argsManager),
        dbMigrations = await db.fetchAppliedMigrations(),
        dirMigrations = Migration.getMigrationsFromFolder(argsManager);

    if (showRaggedMigrations(dbMigrations, dirMigrations) && !argsManager.findArg("--force")) {
        console.log(`\x1b[47m migration roll back is not possible, use --force option to skip that migrations\x1b[0m`);
        process.exit(1);
    }

    let intersection = Migration.intersectMigrationsSets(dirMigrations, dbMigrations),
        needMisapply = Migration.descentMigrations(intersection, until);

    await db.downMigrations(needMisapply);
}

async function listPending() {
    let db = new Database(argsManager),
        dbMigrations = await db.fetchAppliedMigrations(),
        dirMigrations = Migration.getMigrationsFromFolder(argsManager),
        applicable = Migration.subtractMigrationsSets(dirMigrations, dbMigrations);

    showRaggedMigrations(dbMigrations, dirMigrations);

    if (applicable.length) {
        console.log(`The following ${applicable.length} migrations could be applied:`)
    } else {
        console.log("There are no migrations to be applied")
    }
    let counter = 0;
    for (let migration of applicable) {
        console.log(`${++counter}: ${migration.name}`)
    }
}

async function listApplied() {
    let db = new Database(argsManager),
        dbMigrations = await db.fetchAppliedMigrations(),
        dirMigrations = Migration.getMigrationsFromFolder(argsManager);

    showRaggedMigrations(dbMigrations, dirMigrations);

    if (dbMigrations.length) {
        console.log(`The following ${dbMigrations.length} already applied on the database:`)
    } else {
        console.log("There are no applied migrations")
    }
    let counter = 0;
    for (let migration of dbMigrations) {
        console.log(`${++counter}: ${migration.name}`)
    }
}


if (argsManager.findArg("up")) {

    askAboutConnection()
        .then(() => up(argsManager.findKey("up")))
        .then(() => process.exit(0))
        .catch(err => {
            console.log(err);
            process.exit(1);
        })

}
else if (argsManager.findArg("down")) {

    askAboutConnection()
        .then(() => down(argsManager.findKey("down")))
        .then(() => process.exit(0))
        .catch(err => {
            console.log(err);
            process.exit(1);
        })

} else if (argsManager.findArg("create")) {

    Migration.createMigration(argsManager)

} else if (argsManager.findArg("pending")) {

    listPending()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        })

} else if (argsManager.findArg("applied")) {

    listApplied()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        })

} else if (argsManager.findArg("help")) {
    console.log(`
    usage: 
        
        migrate [keys] arguments [param]
    
    arguments:
        
        create [name] \t creates new migration, and the name of the migration [optional] (optional)
        up [name] \t migrates from current position up to migration name [optional] (INCLUSIVELY)
        down [name] \t downgrades database from current position down to migration name [optional] (INCLUSIVELY)
        applied \t show currently applied migrations
        pending \t list migration that could be applied
        help \t\t show this help message
    
    keys: 
        
        --migrationsDir='./new-migration' \t\t absolute or relative path to the migrations dir. By default './migrations'
        --collection='db-migrations' \t\t\t the name of the collection to persist in the database. By default 'migrations'
        --configConnection='database.connectionString' \t the name of the property of the 'config' module to be used as connection string. By default 'db.connectionString'
        --force \t\t\t\t\t ignore migration that has no related files in case of down way
        --silence \t\t\t\t\t do not ask at all
    
    `);
    process.exit(0);
} else {
    console.log("Unknown argument type. Please use 'help' argument to find out how to use.");
    process.exit(0);
}

