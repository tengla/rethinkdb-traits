'use strict';

const Interceptor = require('./interceptor');
const Analyzechain = require('./analyzechain');
const Ensuretable = require('./ensuretable');
const Ensureindex = require('./ensureindex');
const log = require('./logger').singleton();
const Path = require('path');
const knownTables = new Set();

const modelcreate = function (base, tableName, source, indexes = {}) {

    const slate = {};

    Object.defineProperties(slate, {
        tableName: {
            value: tableName
        },
        before: {
            writable: true,
            value: Analyzechain(source.before || {})
        },
        after: {
            writable: true,
            value: Analyzechain(source.after || {})
        }
    });

    // first inherit functions from base
    for (const key of Object.getOwnPropertyNames(base)) {

        log(`${Path.basename(__filename)}: Set ${key} on ${tableName}`);
        // this is marked for interception
        if ( Object.getOwnPropertyDescriptor(base,key).enumerable ) {

            Object.defineProperty(slate,key,{
                enumerable: true,
                writable: true,
                value: Interceptor.bind(slate,key,base[key],tableName)
            });
        }
        // this is not to be intercepted
        else if (typeof base[key] === 'function' && key !== '$r') {

            Object.defineProperty(slate,key,{
                enumerable: true,
                writable: true,
                value: base[key].bind(slate)
            });
        }
        else {

            Object.defineProperty(slate,key,{
                enumerable: true,
                writable: true,
                value: base[key]
            });
        }
    }

    // then merge with all functions from source
    for (const key in source) {

        if (key === 'before' || key === 'after') {
            continue;
        }

        const intercepted = Interceptor.bind(slate,key,source[key],tableName);
        Object.defineProperty(slate,key,{
            enumerable: true,
            value: intercepted
        });
    }

    try {

        if (knownTables.has(tableName)) {
            return Promise.resolve(slate);
        }

        return base.conn.then( (c) => {

            return Promise.all([c, Ensuretable(c)(tableName)]);
        }).then( (results) => {

            const c = results[0];
            const _ensureindex = Ensureindex(c,tableName);

            const promises = Object.getOwnPropertyNames(indexes).map( (name) => {

                return _ensureindex(name,indexes[name]);
            });

            return Promise.all(promises);
        }).then( (results) => {

            knownTables.add(tableName);
            return Promise.resolve(slate);
        });
    }
    catch (err) {

        return Promise.reject(err);
    }
};

module.exports.modelcreate = modelcreate;

module.exports = function (base) {

    return modelcreate.bind(undefined, base);
};
