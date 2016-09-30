
const Lab = require('lab');
const Code = require('code');
const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;
const arrayPrepend = require('../arrayprepend');

lab.experiment('arrayPrepend', () => {

    it('prepends an array and merge it with another', (done) => {

        expect(arrayPrepend([1], [2,3,4])).to.equal([1,2,3,4]);
        done();
    });
})
