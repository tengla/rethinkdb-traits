# rethinkdb-traits
A (tiny) framework to compose rethinkdb queries.

## To install
```shell
npm i -S athlite/rethinkdb-traits
```
*currently only available from github*

## The deal

```javascript

const r = require('rethinkdb');
const Traits = require('rethinkdb-traits');

const Base = Traits.config({
    db: 'test',
    user: 'test',
    password: ''
});

// Traits.modelCreateFrom is a curry
const modelCreate = Traits.modelCreateFrom(Base);

// traits for model 'person'
const personTraits = {
    withGroup: function (rql) {

        return rql.eqJoin('groupId', r.table('groups')).map(function (doc) {
            return doc('left').merge({
                group: doc('right')
            }).without('groupId')
        }).coerceTo('array');
    }
};

// traits for model 'group'
const groupTraits = {
    withPeople: function (rql) {

        return rql.merge(function(group) {

            return group.merge({
                people: r.table('people').getAll(group('id'), { index: 'groupId' }).coerceTo('array')
            });
        })
    },
    after: {
        withPeople: [
            function (rql) {

                return rql.coerceTo('array');
            }
        ]
    }
};

// modelCreate returns promise, so wrap 'em up
const promises = [
    modelCreate('people', personTraits, {
        name: {}, // index
        groupId: {} // index
    }),
    modelCreate('groups', groupTraits)
];

// run the lot
Promise.all(promises).then( (result) => {

    const [ Person, Group ] = result;

    Group.create([{
        name: 'Biggies group'
    },{
        name: 'Tupacs group'
    }]).then( (res) => {

        return Person.create([{
            name: 'Biggie Smalles',
            groupId: res.generated_keys[0]
        },{
           name: 'Faith Evans',
            groupId: res.generated_keys[0] 
        },{
            name: 'Tupac Shakur',
            groupId: res.generated_keys[1]
        },{
            name: 'Mama',
            groupId: res.generated_keys[1]
        }]);
    }).then( () => {

        return Group.withPeople();
    }).then( (groups) => {

        logJson(groups);
        return Promise.all([Person.delete(),Group.delete()]);
    }).then( () => {

        Base.close();
    });
});
```
More examples in the [wiki](https://github.com/athlite/rethinkdb-traits/wiki)
