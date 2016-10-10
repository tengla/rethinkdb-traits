'use strict';
const Lab = require('lab');
const Code = require('code');
const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;
const log = require('../logger').singleton();

const Traits = require('../');
let Rapper;

const traits = Traits({
    db: process.env.TRAITS_DB,
    host: process.env.TRAITS_HOST,
    user: process.env.TRAITS_USER,
    password: process.env.TRAITS_PASSWORD || ''
});

lab.before( (done) => {

    traits('_rappers',{},{ name: {} }).then( (rapper) => {

        Rapper = rapper;
        done();
    });
});

lab.after( (done) => {

    traits.close().then( (idx) => {

        log(`Goodbye ${idx}`);
        done();
    });
});

lab.experiment('generic', () => {

    it('should be able to write a generic insert/get', (done) => {

        const $r = Rapper.$r;

        Rapper.conn.then( (c) => {

            return $r.table('_rappers').insert({
                name: 'Grand Poobah'
            }).run(c)
            .then( (res) => {

                const id = res.generated_keys[0];
                done.note(`rapper id: ${id}\n`);
                return $r.table('_rappers').get(id).run(c);
            })
            .then( (rapper) => {

                expect(rapper.name).to.equal('Grand Poobah');
                done.note(`rapper name: ${rapper.name}\n`);
                return $r.table('_rappers').delete().run(c);
            })
            .then( (res) => {

                done.note(`deleted: ${res.deleted}\n`);
                done();
            });
        });
    });
});
