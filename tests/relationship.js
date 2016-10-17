'use strict';

const Lab = require('lab');
const Code = require('code');
const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;

const traits = require('../')({
    db: process.env.TRAITS_DB,
    host: process.env.TRAITS_HOST,
    user: process.env.TRAITS_USER,
    password: process.env.TRAITS_PASSWORD || ''
});

let Person;
let Group;

const personTraits = {
    withGroup: function (rql) {

        return rql;
    }
};

const groupTraits = {
    withPeople: function (rql,filter = {}) {

        const $r = this.$r;

        return rql.filter(filter).map(function (group) {

            return group.merge({
                people: $r.table('_people')
                    .getAll(group('id'), { index: 'groupId' })
                    .coerceTo('array')
            });
        }).coerceTo('array');
    }
};

lab.before( (done) => {

    Promise.all([
        traits('_people',personTraits, { groupId: {} }),
        traits('_groups',groupTraits,{})]
    ).then((res) => {

        [Person,Group] = res;
        done();
    });
});

lab.after( (done) => {

    Promise.all([Person.delete(),Group.delete()]).then( res => done());
});

lab.after( (done) => {

    traits.close().then( idx => done());
});

lab.experiment('relationship', () => {

    it('group should have people', (done) => {

        Group.create([{
            name: `John's group`
        },{
            name: `Sara's group`
        }]).then( (res) => {

            return Person.create([{
                name: 'John Doe',
                groupId: res.generated_keys[0]
            }, {
                name: 'Sara Jane',
                groupId: res.generated_keys[1]
            }]);
        }).then( (res) => {

            return Group.withPeople({ name: `Sara's group` });
        }).then( (groups) => {

            const [group] = groups;
            expect(group.name).to.equal(`Sara's group`);
            expect(group.people[0].name).to.equal('Sara Jane');
            done();
        }).catch(done);
    });
});
