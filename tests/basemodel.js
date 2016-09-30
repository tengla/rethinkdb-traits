const Lab = require('lab');
const Code = require('code');
const BaseModel = require('../basemodel');
const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;

lab.experiment('BaseModel', () => {

    it('all', (done) => {

        const model = new BaseModel();
        expect(model.all(1)).to.equal(1);
        done();
    });

    it('create', (done) => {

        const model = new BaseModel();
        
        const query = {
            insert: function (object,options) {
                return 1;
            }
        };
        expect(model.create(query, { name: 'John' })).to.equal(1);
        done();
    });
});
