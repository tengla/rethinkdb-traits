'use strict';

Promise = require('bluebird');

const BaseModel = function () {};

BaseModel.prototype = Object.create(Object.prototype, {

    all: {
        enumerable: true,
        value: function (query) {

            return query;
        }
    },

    create: {
        enumerable: true,
        value: function (query,object,options = { returnChanges: true }) {
            return query.insert(object,options);
        }
    },

    delete: {
        enumerable: true,
        value: function(query,filter) {

            if (filter) {
                return query.filter(filter).delete();
            }
            return query.delete();
        }
    },

    find: {
        enumerable: true,
        value: function (query,options) {

            if (options.match) {
                const { key, val } = options.match;
                return query
                    .filter(function (project) {
                        return project(key).match(val);
                    });
            }

            if (options.filter) {
                return query.filter(options.filter);
            }
        }
    },

    count: {
        enumerable: true,
        value: function (query) {

            return query.count();
        }
    }
});

module.exports = BaseModel;
