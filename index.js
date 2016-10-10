'use strict';

const Modelcreate = require('./modelcreate');
const Base = require('./base');
Promise = require('bluebird');

const _base = [];
let idx = 0;

const traits = function (config) {

    _base[idx] = Base(Object.assign({}, config));

    const modelcreate = Modelcreate(_base[idx]);

    modelcreate.close = (function (i) {

        return _base[i].close().then( (r) => {

            return i;
        });
    }).bind(undefined,idx);

    idx += 1;

    return modelcreate;
};

module.exports = traits;
