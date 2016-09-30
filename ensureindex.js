
const r = require('rethinkdb');
Promise = require('bluebird');
const logger = require('./logger').create();

const ensureIndex = (conn,tableName) => (indexName,options) => {

    return r.table(tableName)
    .indexWait()
    .map(function(index){
        return index('index')
    })
    .run(conn)
    .then( (list) => {

        if (list.includes(indexName)) {
            logger.log(`Index '${indexName}' already exists`);
            return Promise.resolve(`Index '${indexName}' already exists`);
        }
        logger.log(`Creating index '${indexName}' on '${tableName}'`);
        return r.table(tableName)
            .indexCreate(indexName, options||{})
            .run(conn)
            .then( result => result )
            .then( () => {
                return r.table(tableName).indexWait().run(conn);
            });

    }).catch( (err) => {

        console.error(err);
    });
};
module.exports = ensureIndex;
