# Migration CLI for mongodb

[![NPM](https://nodei.co/npm/devhouse-migrate.svg?downloads=true&downloadRank=true)](https://www.npmjs.com/package/devhouse-migrate)&nbsp;&nbsp;

```
npm install -g devhouse-migrate
```

This module requires `nodejs 8`.


All migrations staged in database in `migrations` collection by default (you can change that, see _usage_). The form of the stored database object:
```
{
    "_id" : ObjectId("5988679406f2faeaab6a3b2a"),
    "name" : "1484640085344-addCurrentOrderProcessIdToUsers.js",
    "applied" : ISODate("2017-08-07T13:13:56.835Z")
}
```
The connection string is retrieved from `config` module. By default `db.connectionString` property is taken. 
The module expects to have configuration files in `./config` directory

## Usage

In order to show usage type
```
migrate help
```

```
usage: 
        
        migrate [keys] arguments [param]
    
    arguments:
        
        create [name]    creates new migration, and the name of the migration [optional] (optional)
        up [name]        migrates from current position up to migration name [optional] (INCLUSIVELY)
        down [name]      downgrades database from current position down to migration name [optional] (INCLUSIVELY)
        applied          show currently applied migrations
        pending          list migration that could be applied
        help             show this help message
    
    keys: 
        
        --migrationsDir='./new-migration'                absolute or relative path to the migrations dir. By default './migrations'
        --collection='db-migrations'                     the name of the collection to persist in the database. By default 'migrations'
        --configConnection='database.connectionString'   the name of the property of the 'config' module to be used as connection string. By default 'db.connectionString'
        --force                                          ignore migration that has no related files in case of down way
        --silence                                        do not ask at all
    

```



## Examples


-----

If you want to show all migration to be applied type 

```
migrate pending
```
This will returns the full list of migration to apply 

```
The following 6 migrations could be applied:
1: 1484640085344-addCurrentOrderProcessIdToUsers.js
2: 1485165880117-UpdatePropertyBankInfoSchema.js
3: 1497443127517-UpdateUsersBirthdays.js
4: 1497531877195-SetFromAmbitaMark.js
5: 1499927755913-SetFromAmbitaForApartmentOwnersAndUsers.js
```
-----
In order apply all migration

```
migration up 
```

Migrate to specific migration. This will migrate to provided migration **inclusively**

```
migration up 1497531877195-SetFromAmbitaMark.js
```
----
In order to show currently applied migrations 

```
migrate applied
```

this will return

```
The following 7 already applied on the database:
1: 1497443127600-SuperMigration.js
2: 1484640085344-addCurrentOrderProcessIdToUsers.js
3: 1485165880117-UpdatePropertyBankInfoSchema.js
4: 1497443127517-UpdateUsersBirthdays.js
5: 1497531877195-SetFromAmbitaMark.js
6: 1499927755913-SetFromAmbitaForApartmentOwnersAndUsers.js
```
----
In order to downgrade to specific migration use
```
migrate down 1497443127517-UpdateUsersBirthdays.js
```
And that will downgrate from migration #6 down to #4 **inclusively**

-----

In some cases you might noticed the following warning

```
THE FOLLOWING 1 MIGRATIONS ARE IN THE DATABASE BUT NOT IN LOCAL FILES <<<
1: 1497443127600-SuperMigration.js
```

That means that you cannot downgrade without `--force` option, that will ignore that migration

---

In case of `up` and `down` migrations you will be asked to approve connection string

```
with current working environment will be used mongodb://localhost/mongomigrate are you agree with that? [y/n]: y
```
choose `y` or `n` in order to accept/decline

If you don't want to see such messages and reply always `yes` use `--silence` key.

----
In order to create migration use. The name is optional.
```
migrate create MyNewMigration
```
This will generate file in you `migrations` (or `--migrationsDir`) folder file
```
file 1502115579733-MyNewMigration.js successfully created
```
----
When something wroing with your `--collection`, you will be asked to fix it. Just reply `yes` and `no` to question:

```
it looks like you migrations collection is damaged. Would you like to fix it? [y/n]: y
is that migration: 1484640085344-addCurrentOrderProcessIdToUsers.js already applied? [y/n]: y
is that migration: 1485165880117-UpdatePropertyBankInfoSchema.js already applied? [y/n]: n
is that migration: 1497443127517-UpdateUsersBirthdays.js already applied? [y/n]: y
is that migration: 1497531877195-SetFromAmbitaMark.js already applied? [y/n]: n
is that migration: 1499927755913-SetFromAmbitaForApartmentOwnersAndUsers.js already applied? [y/n]: y
is that migration: 1502110122262-newmigra.js already applied? [y/n]: y
is that migration: 1502115579733-MyNewMigration.js already applied? [y/n]: n

```

----

For futher details see 

```
migrate help
```
