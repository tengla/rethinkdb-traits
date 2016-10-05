
const modelcreate = require('./modelcreate');
const base = require('./base');

module.exports = {
    config: function (config) {
        return base(config);
    },
    modelCreateFrom: function (base) {

        return modelcreate(base);
    }
};
