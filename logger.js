'use strict';


const Logger = function () {

    this.startTime = Date.now();
};

const padEnd = function (s,n) {

    const p = n - s.length;
    if (p < 1) {
        return s;
    }
    const padStr = new Array(p).fill(0).map( i => " ").join('');
    return s.concat(padStr);
};

Logger.prototype.log = function (s,level) {

    if ( ! process.env.VERBOSITY ) {
        return;
    }

    const elapsed = padEnd( (Date.now() - this.startTime).toString(), 7);
    /* $lab:coverage:off$ */
    if ( ! level ) {
        console.log(`${elapsed}: '${s}'`);
    }
    else if (level == process.env.VERBOSITY) {
        console.log(`${elapsed}: '${s}'`);
    }
};

let logger;

module.exports = {
    create: function () {
        return logger = logger || new Logger();
    },
    Logger: Logger
};
