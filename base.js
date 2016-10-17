'use strict';

const $r = require('rethinkdb');

// Note: props that that are enumerable will be
// monkey patched. rql(rethinkdb query object) and
// parameters will be injected.
module.exports = function (config) {

    const base = Object.create(Object.prototype, {

        connect: {
            value: function (_config) {

                this.conn = $r.connect(_config);
                return this.conn;
            }
        },

        close: {
            value: function () {

                if (this.tableName) {
                    const message = `Can't close connection from Model['${this.tableName}'].\nYou should do that from Base.`;
                    const err = new Error(message);
                    return Promise.reject(err);
                }

                return this.conn.then( (c) => {

                    return c.close().then( () => {

                        this.conn = undefined;
                        return undefined;
                    });
                });
            }
        },
        // You going to need access to r in many cases
        // To use it inside a trait:
        // ie. this.$r.point(-1, 2)
        $r: {
            value: $r
        },
        conn: {
            set: function (conn) {

                this[Symbol.for('conn')] = conn;
                return this[Symbol.for('conn')];
            },
            get: function () {

                if (!this[Symbol.for('conn')]) {
                    throw new Error('You have to make a connection before trying to access this property. ie. Base.connect(config)');
                }
                return this[Symbol.for('conn')];
            }
        },

        all: {
            enumerable: true,
            value: function (rql) {

                return rql.coerceTo('array');
            }
        },

        create: {
            enumerable: true,
            value: function (rql,object,options = {}){

                return rql.insert(object,options);
            }
        },

        find: {
            enumerable: true,
            value: function (rql,filter) {

                return rql.filter(filter).coerceTo('array');
            }
        },
        update: {
            enumerable: true,
            value: function (rql,id,object,options = { returnChanges: true }) {

                return rql.get(id).update(object,options);
            }
        },
        deleteOne: {
            value: function (id) {

                return this.conn.then( (c) => {

                    return $r.table(this.tableName).get(id).delete().run(c);
                });
            } 
        },
        delete: {
            value: function () {

                return this.conn.then( (c) => {

                    return $r.table(this.tableName).delete().run(c);
                });
            }
        },

        get: {
            value: function (id) {

                return this.conn.then( (c) => {

                    return $r.table(this.tableName).get(id).run(c);
                });
            }
        },

        getAll: {
            value: function (id, options) {

                return this.conn.then( (c) => {

                    return $r.table(this.tableName).getAll(id, options).run(c);
                });
            }
        },

        nth: {
            value: function (n) {

                return this.conn.then( (c) => {

                    return $r.table(this.tableName).nth(n).run(c);
                });
            }
        },

        count: {
            value: function () {

                return this.conn.then( (c) => {

                    return $r.table(this.tableName).count().run(c);
                });
            }
        }
    });

    base.connect(config);
    return base;
};

