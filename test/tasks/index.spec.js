var expect = require('expect.js');
var helper = require('./helper');
var index = require('../../index');

describe('index', function () {
    it('should createRequireConfigScript', function () {
        var result = index.createRequireConfigScript({
            baseUrl: 'src',
            packages: []
        });
        expect(result).to.eql(helper.readFileSync('config.html').toString());
    });

    it('should parse page require info', function () {
        var content = helper.readFileSync('html/require.html').toString();
        var result = index.parsePageRequireModuleIds(
            content
        );
        expect(result).to.eql({
            asynIds: [
                'abc/ss',
                'main',
                'lib/common',
                'common',
                'index/main',
                'manage/index',
                'test/main'
            ],
            syncIds: [
                'hello', 'world/test'
            ]
        });

        result = index.parsePageRequireModuleIds(
            content, true
        );
        expect(result).to.eql({
            asynIds: [
                'report/main',
                'abc/ss',
                'main',
                'lib/common',
                'common',
                'index/main',
                'manage/index',
                'test/main'
            ],
            syncIds: [
                'hello', 'world/test'
            ]
        });
    });

    it('should output md5 sum', function () {
        var result = index.md5sum('abcefg');
        expect(result).to.eql('fbd7809b1f99a5b790068736a1c62cf0');
        expect(index.md5sum('abcefg', 8)).to.eql('fbd7809b');

        result = index.md5sum(helper.readFileSync('html/require.html'));
        expect(result).to.eql('ea92c3e7e23b86b9f0e8caaaed90191e');
    });
});
