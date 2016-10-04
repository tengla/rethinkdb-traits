'use strict';

const interceptor = require('./interceptor');
const analyzechain = require('./analyzechain');
const ensuretable = require('./ensuretable');
const ensureindex = require('./ensureindex');
const log = require('./logger').singleton();

const knownTables = new Set();

const modelcreate = function (base, tableName, source, indexes={}) {

    let slate = {};

    Object.defineProperties(slate, {
        tableName: {
            value: tableName
        },
        before: {
            writable: true,
            value: analyzechain(source.before || {})
        },
        after: {
            writable: true,
            value: analyzechain(source.after || {})
        }
    });

    // first inherit functions from base
    for (const key of Object.getOwnPropertyNames(base)) {
    
        // this is marked for interception
        if ( Object.getOwnPropertyDescriptor(base,key).enumerable ) {
            Object.defineProperty(slate,key,{
                enumerable: true,
                value: interceptor.bind(slate,key,base[key],tableName)
            });
        }
        // this is not to be intercepted
        else {
            Object.defineProperty(slate,key,{
                enumerable: true,
                value: base[key].bind(slate)
            });
        }
    }

    // then merge with all functions from source
    for (const key in source) {

        if (key === 'before' || key === 'after') {
            continue;
        }

        const intercepted = interceptor.bind(slate,key,source[key],tableName);
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

            return Promise.all([c, ensuretable(c)(tableName)]);
        }).then( (results) => {

            const c = results[0];
            const _ensureindex = ensureindex(c,tableName);

            const promises = Object.getOwnPropertyNames(indexes).map( (name) => {
                return _ensureindex(name,indexes[name]);
            });

            return Promise.all(promises);
        }).then( (results) => {

            knownTables.add(tableName);
            return Promise.resolve(slate);
        });
    } catch (err) {

        return Promise.reject(err);
    }
};

module.exports.modelcreate = modelcreate;

module.exports = function (base) {

    return modelcreate.bind(undefined, base);
};
