
const r = require('rethinkdb');
Promise = require('bluebird');
const logger = require('./logger').create();

const ensureTable = conn => tableName => {

    return r.tableList().run(conn)
    .then( (list) => {

        if ( ! list.includes(tableName) ) {

            logger.log(`Creating table '${tableName}'`);
            return r.tableCreate(tableName).run(conn).then( result => result );
        } else {

            logger.log(`Table '${tableName}' exists`);
            return Promise.resolve(`${tableName} already exists`);
        }
    });
};

module.exports = ensureTable;
