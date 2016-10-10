'use strict';
const Lab = require('lab');
const Code = require('code');
const lab = exports.lab = Lab.script({ schedule: true });
const it = lab.it;
const expect = Code.expect;

let Rapper;

const traits = require('../')({
    db: process.env.TRAITS_DB,
    host: process.env.TRAITS_HOST,
    user: process.env.TRAITS_USER,
    password: process.env.TRAITS_PASSWORD || ''
});

lab.before( (done) => {

    traits('_rappers', {
        getBiggie: function (rql) {

            return rql;
        },
        create: function (rql,objects,options = { returnChanges: true }) {

            if ( typeof objects.map === 'function') {
                const _objects = objects.map( (o) => {

                    return Object.assign({}, o, { createdAt: this.$r.now() });
                });
                return rql.insert(_objects,options);
            }
            const _object = Object.assign({}, objects, { createdAt:this.$r.now() });
            return rql.insert(_object,options);
        },
        delete: function (rql) {

            return rql.delete();
        },
        before: {
            'getBiggie': [
                function beforeGetBiggie(rql) {

                    return rql.getAll('Biggie Smalls', { index: 'name' });
                }
            ]
        },
        after: {
            'create': [
                function (rql) {

                    return rql('changes').map( (doc) => {

                        return doc('new_val');
                    });
                }
            ],
            'getBiggie': [
                function afterGetBiggie(rql){

                    return rql.coerceTo('array');
                }
            ]
        }
    },{
        name: {},
        location: { geo: true }
    }).then( (_Rapper) => {

        Rapper = _Rapper;
        done();
    }).catch(done);
});

lab.afterEach( (done) => {

    Rapper.delete().then( (res) => {

        done();
    }).catch(done);
});

lab.after( (done) => {

    traits.close().then( (idx) => {

        done.note(`Goodbye ${idx}!`);
        done();
    });
});

lab.experiment('index', () => {

    it('should create 3 rappers', (done) => {

        Rapper.create([{
            name: 'Biggie Smalls'
        },{
            name: 'Tupac'
        },{
            name: 'Grand Master Flash',
            createdAt: Rapper.$r.now()
        }]).then( (result) => {

            expect(result.length).to.equal(3);
            done();
        }).catch(done);
    });

    it('should get Biggie Smalls', (done) => {

        Rapper.create([{
            name: 'Biggie Smalls'
        },{
            name: 'Tupac'
        },{
            name: 'Grand Master Flash'
        }]).then( () => {

            return Rapper.getBiggie();
        }).then( (rappers) => {

            expect(rappers.length).to.equal(1);
            expect(rappers[0].name).to.equal('Biggie Smalls');
            done();
        }).catch(done);
    });

    it('should merge createdAt to rapper', (done) => {

        Rapper.create({
            name: 'Biggie Smalls',
            location: Rapper.$r.point(-76.289063,39.563353)
        }).then( (rappers) => {

            const [rapper] = rappers;
            expect(rapper.location.coordinates[0]).to.equal(-76.289063);
            expect(rapper.location.coordinates[1]).to.equal(39.563353);
            expect(rapper.createdAt).to.be.date();
            done();
        });
    });

    it('should delete', (done) => {

        Rapper.create({
            name: 'Tobo'
        }).then((rappers) => {

            return Rapper.delete();
        }).then( (res) => {

            Rapper.count().then( (n) => {

                expect(n).to.equal(0);
                done();
            });
        }).catch(done);
    });
});
