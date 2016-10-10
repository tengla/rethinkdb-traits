'use strict';

const $r = require('rethinkdb');
Promise = require('bluebird');
const log = require('./logger').singleton();

const ensureIndex = (conn,tableName) => (indexName,options) => {

    return $r.table(tableName)
    .indexWait()
    .map( (index) => {

        return index('index');
    })
    .run(conn)
    .then( (list) => {

        if (list.includes(indexName)) {
            log(`Index '${indexName}' already exists`);
            return Promise.resolve(`Index '${indexName}' already exists`);
        }

        log(`Creating index '${indexName}' on '${tableName}'`);

        return $r.table(tableName)
            .indexCreate(indexName, options || {})
            .run(conn)
            .then( () => {

                return $r.table(tableName).indexWait().run(conn);
            });

    }).catch( (err) => {

        console.error(err);
    });
};
module.exports = ensureIndex;
