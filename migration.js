const fs = require('fs'),
    path = require('path');


function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


class Migration {
    constructor(name, path, applied) {
        this.name = name;
        this.path = path;
        this.applied = applied;

        if (this.path) {
            this.file = require(this.path);
        }
    }

    async up() {
        let randomColour = getRandomIntInclusive(32, 36);
        console.time(`${this.name}`);
        console.log(`\x1b[${randomColour}m up migration ${this.name} started\x1b[0m`);
        await this.file.up();
        console.timeEnd(`${this.name}`);
        console.log(`\x1b[${randomColour}m up migration ${this.name} finished\x1b[0m`);
    }

    async down() {
        let randomColour = getRandomIntInclusive(32, 36);
        console.time(`${this.name}`);
        console.log(`\x1b[${randomColour}m down migration ${this.name} started\x1b[0m`);
        await this.file.up();
        console.timeEnd(`${this.name}`);
        console.log(`\x1b[${randomColour}m down migration ${this.name} finished\x1b[0m`);
    }

    get isApplied() {
        return !!this.applied;
    }

    get timeStamp() {
        let regex = /^[0-9]+(?!-)/;
        return +regex.exec(this.name)[0];
    }

    static getMigrationsFromFolder(argsManager) {
        let migrationDir = argsManager.migrationsFilesPath();
        let files = fs.readdirSync(migrationDir);

        return files.map(file => {
            let fullPath = path.resolve(migrationDir, file);
            return new Migration(file, fullPath)
        });
    }

    isEqual(to) {
        return this.timeStamp === to.timeStamp &&
            this.name === to.name;
    }

    static compare(a, b) {
        if (a.timeStamp < b.timeStamp) {
            return -1;
        }
        if (a.timeStamp > b.timeStamp) {
            return 1;
        }
        return 0;
    }

    static sortMigrationsArray(array) {
        return array.sort(Migration.compare)
    }

    static subtractMigrationsSets(minuend, deduction) {
        let result = [];
        for (let migration of minuend) {
            let contains = false;

            for (let toFind of deduction) {
                if (toFind.isEqual(migration)) {
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                result.push(migration);
            }
        }

        return Migration.sortMigrationsArray(result);
    }
}


module.exports = Migration;