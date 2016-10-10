'use strict';

const Lab = require('lab');
const Code = require('code');
const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;

const Traits = require('../');

const traits = Traits({
    db: process.env.TRAITS_DB,
    host: process.env.TRAITS_HOST,
    user: process.env.TRAITS_USER,
    password: process.env.TRAITS_PASSWORD || ''
});

lab.after( (done) => {

    traits.close().then( (idx) => {

        done.note(`Goodbye ${idx}!`);
        done();
    });
});

lab.experiment('modelcreate', () => {

    it('should be a function', (done) => {

        expect(traits).to.be.a.function();
        done();
    });

    it('should return a promise/model', (done) => {

        traits('_rappers', {
            gg: function (rql) {

                return rql;
            }
        }).then( (Rapper) => {

            expect(Rapper.gg).to.be.a.function();
            done();
        });
    });
});
