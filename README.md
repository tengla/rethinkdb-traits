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
    }
},{
    indexes: {
        name: {},
        location: { geo: true }
    }
}).then(function (Rapper) {

    // We receive a table wrapper for 'rappers'
    Rapper.create([{
        name: 'Tupac'
    },{
        name: 'Biggie Smalls'
    }]).then( (rappers) => {

        console.log(JSON.stringify(rappers,null,4));
        return Rapper.getBiggie();
    }).then( (rapper) => {

        console.assert(rapper.name === 'Biggie Smalls');
        Traits.close();
    })
})
```
