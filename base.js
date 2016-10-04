
const r = require('rethinkdb');

// Note: props that that are enumerable will be wrapped 
// and monkey patched. rql(rethinkdb query object) and 
// parameters will be injected.
module.exports = function (config) {

    const base = Object.create(Object.prototype, {

        connect: {
            value: function (config) {

                return this.conn = r.connect(config);
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

                        return this.conn = undefined;
                    });
                })
            }
        },

        conn: {
            set: function (conn) {
                return this[Symbol.for('conn')] = conn;
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
            value: function (rql,object){

                return rql.insert(object);
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
            value: function (rql,id,object) {

                return rql.get(id).update(object);
            }
        },

        delete: {
            value: function (rql) {
                return this.conn.then( (c) => {

                    return r.table(this.tableName).delete().run(c);
                });
            }
        },

        get: {
            value: function (id) {

                return this.conn.then( (c) => {

                    return r.table(this.tableName).get(id).run(c);
                });
            }
        },

        nth: {
            value: function (n) {
                return this.conn.then( (c) => {
                    return r.table(this.tableName).nth(n).run(c);
                });
            }
        }
    });

    base.connect(config);
    return base;
};
