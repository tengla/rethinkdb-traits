
const r = require('rethinkdb');
Promise = require('bluebird');
const _uniq = require('lodash/uniq');
const BaseModel = require('./BaseModel');
const ensureTable = require('./ensuretable');
const ensureIndex = require('./ensureindex');
const logger = require('./logger').create();

const ensuredTableSet = {
    ary: [],
    has: function (name) {

        return this.ary.includes(name);
    },
    add: function (name) {

        if ( ! this.ary.includes(name) ) {
            this.ary.push(name);
        }
        return this.ary;
    }
};

const analyseChain = function (chain) {

    const map = {};
    const propNames = Object.getOwnPropertyNames(chain);

    for (let propName of propNames) {
        propName.split(',').forEach( function (key) {
            key = key.trim();
            map[key] = Array.prototype.concat.call(
                map[key] || [], 
                chain[propName]
            );
        });
    }
    return map;
};

const applyChain = function (query,chain) {

    chain.forEach( (fn) => {
        query = fn.call(undefined,query);
    });
    return query;
};

const close = function (conn) {

    return function () {

        return conn.then( (c) => {

            return c.close();
        });
    }
};

const createModel = function (definition) {

    const before = analyseChain(definition.before || {});
    const around = analyseChain(definition.around || {});
    const after  = analyseChain(definition.after || {});
    const traits = definition.traits || {};

    return {
        base: new BaseModel(),
        before,
        around,
        after,
        traits
    };
};

const _create = function (conn,tableName,definition) {

    var model = Object.assign({},
        { tableName: tableName },
        createModel(definition)
    );

    const names = _uniq(
        Array.prototype.concat.call(
            Object.getOwnPropertyNames(model.traits),
            Object.getOwnPropertyNames(BaseModel.prototype)
        )
    );

    for (let name of names) {

        const fn = function () {

            let query = r.table(this.tableName);

            // call 'before' chain
            if (this.before[name]) {
                query = applyChain(query,this.before[name]);
            }

            // call 'around' chain
            if (this.around[name]) {
                query = applyChain(query, this.around[name]);
            }
            
            // prepend query to make it the first param
            const args = prependToArguments([query], arguments);

            // lookup function
            const fn = (this.traits[name] || this.base[name]);

            // apply the actual meat
            query = fn.apply(this,args);
            
            if ( ! query ) {
                throw new Error(`${tableName} ${name} failed to return query\n${fn.toString()}`);
            }

            // call 'after' chain
            if (this.after[name]) {
                query = applyChain(query, this.after[name]);
            }

            // call conn, then resolve or reject
            return new Promise((resolve,reject) => {

                return conn.then( (_conn) => {

                    return resolve(query.run(_conn));
                }).catch(reject);
            });
        };
        model[name] = fn
    }
    return Object.create(model);
};

const create = function (conn) {

    return function (tableName, definition, options) {

        if (ensuredTableSet.has(tableName)) {
            logger.log(`Ensure table and indexes for '${tableName}' already done`);
            return Promise.resolve(_create(conn,tableName,definition));
        }

        logger.log(`Must ensure table and indexes for '${tableName}'`);
        let _conn;

        return conn.then( (c) => {
            _conn = c;
            return ensureTable(_conn)(tableName)
        })
        .then( () => {

            if ( ! (options && options.indexes)) {

                return Promise.resolve(_create(conn,tableName,definition));
            }

            const indexes = (options && options.indexes) || {};
            const _ensureIndex = ensureIndex(_conn,tableName);
            return Promise.all(
                Object.getOwnPropertyNames(indexes).map( (name) => {
                    return _ensureIndex(name,indexes[name]);
                })
            );
        })
        .then( (results) => {
            logger.log(`Done ensuring for '${tableName}'`);
            ensuredTableSet.add(tableName);
            return _create(conn,tableName,definition);
        });
    };
};

const prependToArguments = function (preargs,args) {

    return Array.prototype.concat.call(
        preargs,
        Array.prototype.slice.call(args)
    );
};

module.exports = function (config) {

    // clone config 
    // - rethinkdb driver has (unintentional?) side effects
    const conn = r.connect(Object.assign({}, config));
    return {
        create: create(conn),
        close: close(conn)
    };
};
