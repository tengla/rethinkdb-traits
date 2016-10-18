# rethinkdb-traits

A library to compose rethinkdb queries with NodeJS.

This is not an ORM. It's a library to organize your queries. It does not assume anything about relations.

It *does* create table on definition, and indexes as well. It makes it easier to perform queries, in a modelish way, without having a reference to the connection.

## To install
```shell
npm i -S rethinkdb-traits
```

## The deal

```javascript

const config = {
    db: 'test',
    user: 'test',
    password: ''
};

// Connect, and get 'traits' function back
const traits = require('rethinkdb-traits')(config);

// traits for model 'group'
const groupTraits = {
    byName: function (rql,name) {
        return rql.filter({ name });
    }, 
    withPeople: function (rql) {

        const $r = this.$r;
        return rql.merge(function(group) {

            return group.merge({
                people: $r.table('people').getAll(group('id'), { index: 'groupId' });
            });
        })
    },
    // you can chain and reuse 'before' and 'after' functions
    after: {
        'byName,withPeople': [
            function (rql) {

                return rql.coerceTo('array');
            }
        ]
    }
};

// 'traits' returns promise, so wrap 'em up
const promises = [
    traits('people', {} , {
        name: {}, // index
        groupId: {} // index
    }),
    traits('groups', groupTraits)
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

        console.log(groups);
        return Promise.all([Person.delete(),Group.delete()]);
    }).then( () => {

        traits.close();
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
