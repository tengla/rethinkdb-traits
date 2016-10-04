
module.exports = function (chain) {

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
