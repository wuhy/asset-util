var expect = require('expect.js');
var helper = require('./helper');
var common = require('../../lib/common');

describe('index', function () {
    it('should return wrap replacer', function () {
        var replacer = common.getReplacer(function () {
             return 'abc';
        });
        expect(replacer({match: 'efg'})).to.eql('abc');

        replacer = common.getReplacer(function () {
        });
        expect(replacer({match: 'efg'})).to.eql('efg');

        replacer = common.getReplacer(function () {
            return;
        });
        expect(replacer({match: 'efg'})).to.eql('efg');

        replacer = common.getReplacer(function () {
            return false;
        });
        expect(replacer({match: 'efg'})).to.eql('efg');
    });

    it('should replace all string', function () {
        var result = common.replaceAll('abc ss efg abcsss', 'abc', '322');
        expect(result).to.eql('322 ss efg 322sss');

        result = common.replaceAll('abc ss efg abcsss', 'efg', '322 efg');
        expect(result).to.eql('abc ss 322 efg abcsss');

        result = common.replaceAll('abc ss efg abcsss', 's23232', '322');
        expect(result).to.eql('abc ss efg abcsss');
    });

    it('should escapse regexp character', function () {
        var result = new RegExp(common.escapeRegexp('[.+]*/\\?-()^$|{}'));
        expect(result).to.eql(/\[\.\+\]\*\/\\\?\-\(\)\^\$\|\{\}/);
        result = common.escapeRegexp('');
        expect(result).to.eql('');
    });
});
