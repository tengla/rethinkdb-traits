'use strict';

module.exports = function (ary1,ary2) {

    return Array.prototype.concat.call(
        ary1,
        Array.prototype.slice.call(ary2)
    );
};
