'use strict';

const VERBOSITY = Number(process.env.VERBOSITY);

const Logger = function () {

    this.startTime = Date.now();
};

const padEnd = function (s,n) {

    const p = n - s.length;
    if (p < 1) {
        return s;
    }
    const padStr = new Array(p).fill(0).map( (i) => {

        return ' ';
    }).join('');
    return s.concat(padStr);
};

Logger.prototype.log = function (s) {

    if ( !process.env.VERBOSITY ) {
        return;
    }

    const elapsed = padEnd( (Date.now() - this.startTime).toString(), 7);

    if (VERBOSITY) {
        console.log(`${elapsed}: '${s}'`);
    }
};

let logger;

module.exports = {
    singleton: function () {

        logger = logger || new Logger();
        return logger.log.bind(logger);
    },
    Logger
};
