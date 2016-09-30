# rethinkdb-traits
A (tiny) framework to compose rethinkdb queries.

## The deal

```javascript
// pass db options
const Traits = require('rethinkdb-traits')({
    db: 'test',
    host: 'localhost',
    user: 'test',
    password: ''
});

// table 'rappers' gets created if not present,
// as does indexes 
Traits.create('rappers', {
    traits: {
        getBiggie: function (rql) {

            // Trivially return, the interesting part getsdone in 'before' and 'after',
            // just to make an example.
            return rql;
        }
    },
    before: {
        'getBiggie': [
            // functions get called in the order of appearance
            function (rql) {

                return rql.getAll('Biggie Smalls', { index: 'name' });
            }
        ]
    },
    after: {
        'create': [
            function (rql) {

                return rql('generated_keys');
            }
        ],
        'getBiggie': [
            function (rql) {

                return rql.coerceTo('array')(0);
            }
        ]
    }
},{
    indexes: {
        name: {},
        location: { geo: true }
    }
}).then(function (Rapper) {

    // We receive a table wrapper for 'rappers'
    // Pun not intended.
    Rapper.create([{
        name: 'Tupac'
    },{
        name: 'Biggie Smalls'
    }], { returnChanges: false }).then( (ids) => {

        // This was transformed from 'generated_keys' after 'create', remember?
        console.log(ids);

        // Call function defined in 'traits'.
        return Rapper.getBiggie();
    }).then( (rapper) => {

        console.assert(rapper.name === 'Biggie Smalls');
        Traits.close();
    });
})
```
