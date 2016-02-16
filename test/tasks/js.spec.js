var expect = require('expect.js');
var helper = require('./helper');
var jsUtil = require('../../lib/js');

describe('parse js', function () {
    it('should parse require info', function () {
        var content = helper.readFileSync('js/1.js').toString();
        var asynIds = [];
        var syncIds = [];
        var addModuleId = function (ids, target) {
            ids.forEach(function (item) {
                target.push(item);
            });
        };
        var result = jsUtil.parseRequire(content, function (result) {
            addModuleId(result.moduleIds, result.asyn ? asynIds : syncIds);
        });
        expect(result).to.eql(content);
        expect(asynIds).to.eql([
            'common/lib',
            'common/log',
            'common/test',
            'er/main',
            'er/promise'
        ]);
        expect(syncIds).to.eql(['./manage/main', './manage/main']);
    });

    it('should parse document write info', function () {
        var content = helper.readFileSync('js/2.js').toString();
        var writeItems = [];
        var result = jsUtil.parseDocumentWrite(content, function (result) {
            writeItems.push(result.script);
        });
        expect(result).to.eql(content);
        expect(writeItems).to.eql([
            '<script src="./a.js"></script>\'',
            '<script src="./b.js"></script>\'',
            '<script src = \'./a.js\' ></script>"'
        ]);
    });

});
