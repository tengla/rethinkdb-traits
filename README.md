# rethinkdb-traits
A (tiny) framework to compose rethinkdb queries with node.js

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
Should return:
```json
[
    {
        "id": "f670cfe1-72d4-4567-9728-f242a18bdca7",
        "name": "Biggies group",
        "people": [
            {
                "groupId": "f670cfe1-72d4-4567-9728-f242a18bdca7",
                "id": "cb623871-b115-4da7-b3ff-193169795345",
                "name": "Faith Evans"
            },
            {
                "groupId": "f670cfe1-72d4-4567-9728-f242a18bdca7",
                "id": "f6b27765-f5ec-41e2-8f92-b0e9939ffb77",
                "name": "Biggie Smalles"
            }
        ]
    },
    {
        "id": "fb53dc48-b7f2-4dcc-beae-a35c70cd210e",
        "name": "Tupacs group",
        "people": [
            {
                "groupId": "fb53dc48-b7f2-4dcc-beae-a35c70cd210e",
                "id": "43746012-de73-4f73-a60e-16d1f7369e8d",
                "name": "Mama"
            },
            {
                "groupId": "fb53dc48-b7f2-4dcc-beae-a35c70cd210e",
                "id": "efb34795-5148-4b39-ac4d-533a206a5138",
                "name": "Tupac Shakur"
            }
        ]
    }
]
```

More examples in the [wiki](https://github.com/athlite/rethinkdb-traits/wiki)
