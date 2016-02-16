var expect = require('expect.js');
var helper = require('./helper');
var cssUtil = require('../../lib/css');

describe('parse css', function () {
    it('should parse image url', function () {
        var content = helper.readFileSync('css/img.css').toString();
        var urlArr = [];
        var push = Array.prototype.push;
        var result = cssUtil.parseURLResource(content, function (result) {
            var url = result.url;
            if (Array.isArray(url)) {
                push.apply(urlArr, url);
            }
            else {
                urlArr.push(url);
            }
        });
        expect(result).to.eql(content);
        expect(urlArr).to.eql([
            'http://img02.taobaocdn.com/tps/i2/T10s3JXn4XXXXnbIAn-105-160.png',
            'http://img03.taobaocdn.com/tps/i2/T10s3JXn4XXXXnbIAn-105-160.png',
            'http://img04.taobaocdn.com/tps/i4/T1947tXmJhXXcCfooh-210-320.png',
            'test.png',
            'test-2x.png',
            '/folder/yourimage.png',
            'resources.svg#c1',
            'high.png',
            '/workshop/graphics/earglobe.gif',
            '/folder/yourimage.png',
            'images/transparent.gif',
            'test.png',
            'test-2x.png',
            'test-print.png',
            'test.png',
            'test-2x.png',
            'test-print.png'
        ]);
    });

    it('should parse import css', function () {
        var content = helper.readFileSync('css/import.css').toString();
        var urlArr = [];
        var result = cssUtil.parseImportResource(content, function (result) {
            urlArr.push(result.url);
        });
        expect(result).to.eql(content);
        expect(urlArr).to.eql([
            'import/import.css',
            'import/import2.css',
            'import/import3.css',
            'import/import4.css',
            'import/import5.css',
            'import/import6.css',
            'import/import7.css'
        ]);
    });
});
