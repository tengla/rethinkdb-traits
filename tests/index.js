    
const Lab = require('lab');
const Code = require('code');
const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;

const Traits = require('../index')({
    db: process.env.TRAITS_DB,
    host: process.env.TRAITS_HOST,
    user: process.env.TRAITS_USER,
    password: process.env.TRAITS_PASSWORD
});

let Rapper; // blargh!*?

lab.before( (done) => {

    Traits.create('_rappers', {
        traits: {
            getBiggie: function (query) {

                return query;
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
            'getBiggie': [
                function afterGetBiggie (query) {

                    return query.coerceTo('array');
                }
            ]
        }
    },{
        indexes: {
            name: {} // no options, just a plain string
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
            name: 'Big Pun'
        },{
            name: 'Grand Master Flash'
        }]).then( (result) => {

            expect(result.generated_keys.length).to.equal(3);
            done();
        });
    });

    it('should get Biggie Smalls', (done) => {

        Rapper.create([{
            name: 'Biggie Smalls'
        },{
            name: 'Big Pun'
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
});
