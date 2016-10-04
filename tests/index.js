
const r = require('rethinkdb');
const Lab = require('lab');
const Code = require('code');
const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;

const Traits = require('../index').connect({
    db: process.env.TRAITS_DB,
    host: process.env.TRAITS_HOST,
    user: process.env.TRAITS_USER,
    password: process.env.TRAITS_PASSWORD
});

let Rapper;

lab.before( (done) => {

    Traits.create('_rappers', {
        traits: {
            getBiggie: function (query) {

                return query;
            },
            create: function (query,objects,options = { returnChanges: true }) {

                if( typeof objects.map === 'function') {
                    const _objects = objects.map( o => Object.assign({}, o, { createdAt: new Date() }) )
                    return query.insert(_objects,options);
                }
                else {
                    const _object = Object.assign({}, objects, { createdAt: new Date() });
                    return query.insert(_object,options);
                }
            }
        },
        before: {
            'getBiggie': [
                function beforeGetBiggie (query) {

                    return query.getAll('Biggie Smalls', { index: 'name' })
                }
            ]
        },
        after: {
            'create': [
                function (query) {

                    return query('changes').map(function(doc) {
                        return doc('new_val');
                    });
                }
            ],
            'getBiggie': [
                function afterGetBiggie (query) {

                    return query.coerceTo('array');
                }
            ]
        }
    },{
        indexes: {
            name: {},
            location: { geo: true }
        }
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

lab.experiment('Traits', () => {

    it('should create 3 rappers', (done) => {

        Rapper.create([{
            name: 'Biggie Smalls'
        },{
            name: 'Tupac'
        },{
            name: 'Grand Master Flash'
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
            location: r.point(0,0)
        }).then( (rappers) => {

            const [ rapper ] = rappers;
            expect(rapper.createdAt).to.be.date();
            done();
        });
    })
});
