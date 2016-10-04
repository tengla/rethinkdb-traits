
const r = require('rethinkdb');
Promise = require('bluebird');
const log = require('./logger').singleton();

const ensureTable = conn => tableName => {

    return r.tableList().run(conn)
    .then( (list) => {

        if ( ! list.includes(tableName) ) {

            log(`Creating table '${tableName}'`);
            return r.tableCreate(tableName).run(conn).then( result => result );
        } else {

            log(`Table '${tableName}' exists`);
            return Promise.resolve(`${tableName} already exists`);
        }
    });
};

module.exports = ensureTable;
