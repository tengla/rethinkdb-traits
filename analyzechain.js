'use strict';

module.exports = function (chain) {

    const map = {};
    const propNames = Object.getOwnPropertyNames(chain);

    for (const propName of propNames) {
        propName.split(',').forEach( (key) => {

            key = key.trim();
            map[key] = Array.prototype.concat.call(
                map[key] || [],
                chain[propName]
            );
        });
    }
    return map;
};
