var expect = require('expect.js');
var helper = require('./helper');
var pathUtil = require('../../lib/path');

describe('path util', function () {
    it('should normalize the given path', function () {
        expect(pathUtil.normalizePath('./a/b')).to.be('a/b');
        expect(pathUtil.normalizePath('\\a\\b\\')).to.be('/a/b/');
        expect(pathUtil.normalizePath('/d/c.js')).to.be('/d/c.js');
    });

    it('should return the corrent file extname', function () {
        expect(pathUtil.getFileExtName('/a/b')).to.be('');
        expect(pathUtil.getFileExtName('a/b.js')).to.be('js');
        expect(pathUtil.getFileExtName('a/b.ab.js')).to.be('js');
        expect(pathUtil.getFileExtName('a/b.JS')).to.be('JS');
    });

    it('should check the path is local correctly', function () {
        expect(pathUtil.isLocalPath('/a/b')).to.be(true);
        expect(pathUtil.isLocalPath('\\a\\b')).to.be(true);
        expect(pathUtil.isLocalPath('//a/b')).to.be(false);
        expect(pathUtil.isLocalPath('d:/a/b')).to.be(true);
        expect(pathUtil.isLocalPath('http://a/b')).to.be(false);
        expect(pathUtil.isLocalPath('https://a/b')).to.be(false);
        expect(pathUtil.isLocalPath('.')).to.be(true);
        expect(pathUtil.isLocalPath('ftp://a/b')).to.be(false);
    });

    it('should rebase the given path', function () {
        expect(pathUtil.rebasePath('./a/b.js', 'index.html', 'c/index.html')).to.be('../a/b.js');
        expect(pathUtil.rebasePath('../a.js', 'c/index.html', 'index.html')).to.be('a.js');
        expect(pathUtil.rebasePath('b.js', 'c/index.html', 'index.html')).to.be('c/b.js');
        expect(pathUtil.rebasePath('/b.js', 'c/index.html', 'index.html')).to.be('/b.js')
    });

    it('should resovle relative path', function () {
        expect(pathUtil.resolvePath('./a/b.js', 'src/index.html')).to.eql('/src/a/b.js');
        expect(pathUtil.resolvePath('../a/b.js', 'src/index.html')).to.eql('/a/b.js');
        expect(pathUtil.resolvePath('/a/b.js', 'src/index.html')).to.eql('/a/b.js');
        expect(pathUtil.resolvePath('//www.baidu.com/a/b.js', 'src/index.html')).to.eql('//www.baidu.com/a/b.js');
        expect(pathUtil.resolvePath('http://www.xo.com/a.js', 'src/index.html')).to.eql('http://www.xo.com/a.js');
        expect(pathUtil.resolvePath('a.js', 'src/test/index.html')).to.eql('/src/test/a.js');
        expect(pathUtil.resolvePath('src/a.js', 'index.html')).to.eql('/src/a.js');
    });
});
