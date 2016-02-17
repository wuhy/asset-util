var expect = require('expect.js');
var helper = require('./helper');
var replacer = require('../../lib/replacer');

describe('replacer', function () {
    it('should replace css url', function () {
        var content = helper.readFileSync('replace/1.css').toString();
        var file = {
            data: content,
            path: 'src/index/main.css'
        };
        var result = replacer.replaceCSSURL(file, {
            replacer: {
                domain: '{%myHost%}',
                transform: function (url) {
                    var SRC_REGEXP = /(^|\/)src(\/|$)/;
                    return url.replace(SRC_REGEXP, '$1asset$2');
                }
            },
            path: true
        });
        // helper.writeFileSync('replace/1.replace.css', result);
        expect(result).to.eql(helper.readFileSync('replace/1.replace.css').toString());
    });

    it('should replace css url with path false', function () {
        var content = helper.readFileSync('replace/2.css').toString();
        var file = {
            data: content,
            path: 'src/index/main.css'
        };
        var result = replacer.replaceCSSURL(file, {
            replacer: 'url(http://tet/sd.png)',
            path: false
        });

        file.data = result;
        result = replacer.replaceCSSURL(file, {
            replacer: function (result) {
                return result.match.replace(result.value, 'http://test/a/b');
            },
            path: false,
            rules: [
                {reg: /__inline\(([^\)]+)\)/g, group: 1}
            ]
        });
        // helper.writeFileSync('replace/2.replace.css', result);
        expect(result).to.eql(helper.readFileSync('replace/2.replace.css').toString());
    });

    it('should replace html url', function () {
        var content = helper.readFileSync('replace/1.html').toString();
        var file = {
            data: content,
            path: 'src/1.html'
        };
        var result = replacer.replaceHTMLURL(file, {
            replacer: {
                domain: 'http://myDomain'
            },
            path: true,
            rules: [
                {tag: 'img'},
                {tag: 'source'}
            ]
        });
        expect(result).to.eql(helper.readFileSync('replace/1.replace.html').toString());

        file = {
            data: helper.readFileSync('replace/2.html').toString(),
            path: 'src/2.html'
        };
        result = replacer.replaceHTMLURL(file, {
            replacer: {
                domain: 'http://myDomain'
            },
            path: true,
            rules: [
                {
                    tag: 'img',
                    attrs: [
                        'src',
                        {
                            name: 'srcset',
                            multiline: true,
                            parse: function (value) {
                                var result = [];
                                value.split(',').forEach(function (item) {
                                    item = item.trim();
                                    if (item) {
                                        var index = item.lastIndexOf(' ');
                                        result.push(item.substring(0, index));
                                    }
                                });
                                return result;
                            }
                        }
                    ],
                    replacer: function (value, file) {
                        if (value.indexOf('{% myhost %}') !== -1) {
                            return value;
                        }
                        else {
                            return 'http://myDomain' + file.resolve(value);
                        }
                    }
                },
                {tag: 'link', attrs: ['href']},
                {reg: /<!--[\s\S]*?-->/g, replacer: ''}
            ]
        });
        expect(result).to.eql(helper.readFileSync('replace/2.replace.html').toString());
    });

    it('should replace html none', function () {
        var content = helper.readFileSync('replace/noreplace.html').toString();
        var file = {
            data: content,
            path: 'src/noreplace.html'
        };
        var result = replacer.replaceHTMLURL(file, {
            replacer: {
                domain: 'http://myDomain'
            },
            path: true,
            rules: [
                {tag: 'img'},
                {tag: 'source'}
            ]
        });
        expect(result).to.eql(content);
    });

    it('should replace domain info', function () {
        var content = helper.readFileSync('replace/domain.html').toString();
        var file = {
            data: content,
            path: 'src/index/domain.html'
        };
        var result = replacer.replaceHTMLURL(file, {
            replacer: {
                domain: {
                    from: 'www.baidu.com',
                    to: 'test.baidu.com'
                }
            },
            path: true,
            rules: [
                {tag: 'img'},
                {tag: 'script', replacer: {
                    domain: function (url, file) {
                        if (!file.isLocalPath(url)) {
                            var domain1 = 'www.baidu.com';
                            if (url.indexOf(domain1) !== -1) {
                                return url.replace(domain1, 'test.baidu.com');
                            }

                            var domain2 = 'www2.baidu.com';
                            if (url.indexOf(domain2) !== -1) {
                                return url.replace(domain2, 'test2.baidu.com');
                            }
                        }
                    }
                }},
                {tag: 'link'}
            ]
        });

        expect(result).to.eql(helper.readFileSync('replace/domain.replace.html').toString());
    });

    it('should replace inline html content', function () {
        var content = helper.readFileSync('replace/inline.html').toString();
        var file = {
            data: content,
            path: 'src/inline/inline.html'
        };
        var result = replacer.replaceHTMLURL(file, {
            rules: [
                {tag: 'style'},
                {tag: 'script'}
            ],
            parseInline: function (info) {
                var tempFile = {data: info.data, path: file.path, inline: true};
                var result;

                if (info.type === 'css') {
                    result = replacer.replaceCSSURL(tempFile, {
                        path: true,
                        replacer: {
                            ignore: function (path) {
                                return path.indexOf('{% host %}') !== -1;
                            },
                            domain: 'http://myDomain'
                        }
                    });
                }
                else if (info.type === 'js') {
                    result = info.data.replace(/console\.log\([^\)]*\)\s*;?/, '');
                }

                var match = info.match;
                if (result == null) {
                    return match;
                }
                return match.replace(info.data, result);
            }
        });
        // helper.writeFileSync('replace/inline.replace.html', result);
        expect(result).to.eql(helper.readFileSync('replace/inline.replace.html').toString());
    });

    it('should replace js info', function () {
        var file = {
            data: helper.readFileSync('replace/1.js').toString(),
            path: 'src/test/1.js'
        };
        var result = replacer.replaceByRules(file, [
                {
                    reg: /http:\/\/release\.com/g, replacer: 'http://test.com'
                },
                {
                    reg: /['"]\s*<img\s+src\s*=(['"])([^'"]+)\1/g,
                    group: 2,
                    path: true,
                    replacer: function (value) {
                        return 'http://www.baidu.com/' + value;
                    }
                }
            ]
        );
        expect(result).to.eql(helper.readFileSync('replace/1.replace.js').toString());
    });

    it('should rewrite url info', function () {
        var file = {data: '', path: 'src/main/test.js'};
        var result = replacer.rewriteURL('/a/b', file, '/d/e');
        expect(result).to.eql('/d/e');

        var options = {};
        result = replacer.rewriteURL('../a/b.css', file, function (url, file, opts) {
            expect(opts === options).to.be(true);
            expect(url).to.eql('../a/b.css');
            expect(file.resolve(url)).to.eql('/src/a/b.css');
            return '/d/e.css';
        }, options);
        expect(result).to.eql('/d/e.css');

        result = replacer.rewriteURL('../a/b.css', file, {
            ignore: function (url) {
                return true;
            },
            domain: 'http://www.baidu.com'
        });
        expect(result).to.eql('../a/b.css');

        result = replacer.rewriteURL('../a/b.css', file, {
            ignore: function (url) {
                return false;
            },
            domain: 'http://www.baidu.com'
        });
        expect(result).to.eql('http://www.baidu.com/src/a/b.css');

        result = replacer.rewriteURL('//ww.baidu.com/a/b.css', file, {
            domain: 'http://www.baidu.com'
        });
        expect(result).to.eql('//ww.baidu.com/a/b.css');

        result = replacer.rewriteURL('/a/b.css', file, {
            domain: 'http://www.baidu.com'
        });
        expect(result).to.eql('http://www.baidu.com/a/b.css');

        result = replacer.rewriteURL('http://google.com/a/b.css', file, {
            domain: 'http://www.baidu.com'
        });
        expect(result).to.eql('http://google.com/a/b.css');

        result = replacer.rewriteURL('http://www.google.com/a/b.css', file, {
            domain: {
                from: 'http://www.google.com',
                to: 'http://www.baidu.com'
            }
        });
        expect(result).to.eql('http://www.baidu.com/a/b.css');

        result = replacer.rewriteURL('a/b.css', file, {
            domain: {
                from: 'http://www.google.com',
                to: 'http://www.baidu.com'
            }
        });
        expect(result).to.eql('a/b.css');

        result = replacer.rewriteURL('http://facebook.com/a/b.css', file, {
            domain: {
                from: 'http://www.google.com',
                to: 'http://www.baidu.com'
            }
        });
        expect(result).to.eql('http://facebook.com/a/b.css');

        options = {};
        result = replacer.rewriteURL('./a/b.css', file, {
            domain: function (url, file, opt) {
                expect(url).to.eql('./a/b.css');
                expect(file.isLocalPath('./a/b.css')).to.be(true);
                expect(file.resolve('./a/b.css')).to.eql('/src/main/a/b.css');
                expect(opt === options).to.be(true);
            }
        }, options);
        expect(result).to.eql('./a/b.css');

        result = replacer.rewriteURL('./a/b.css', file, {
            domain: function () {
                return '{%host%}/a/b.css';
            }
        });
        expect(result).to.eql('{%host%}/a/b.css');

        options = {};
        result = replacer.rewriteURL('./a/b.css', file, {
            domain: function () {
                return '{%host%}/a/b.css';
            },
            transform: function (url, file, opts) {
                expect(url).to.eql('{%host%}/a/b.css');
                expect(file.resolve('./a/b.css')).to.eql('/src/main/a/b.css');
                expect(opts === options).to.be(true);
                return 'transfrom/a/b.css';
            }
        }, options);
        expect(result).to.eql('transfrom/a/b.css');
    });

    it('should replace content by rules', function () {
        var file = {
            data: 'hello world. (from: http://www.baidu.com)',
            path: 'src/test.js'
        };
        var result = replacer.replaceByRules(file, []);
        expect(result).to.eql(file.data);

        var match = '(from: http://www.baidu.com)';
        var options = {
            replacer: function (result, file, opts) {
                expect(result.match).to.eql(match);
                expect(result.value).to.eql(match);
                expect(options === opts).to.be(true);
                expect(file.resolve('./a/b.css')).to.eql('/src/a/b.css');
                return '(from:***)';
            }
        };
        result = replacer.replaceByRules(file, [
            {
                reg: /\(from:\s*([^\)]+)\)/
            }
        ], options);
        expect(result).to.eql('hello world. (from:***)');

        result = replacer.replaceByRules(file, [
            {
                reg: /\(from:\s*([^\)]+)\)/,
                group: 1
            }
        ], {
            replacer: function (result) {
                expect(result.match).to.eql(match);
                expect(result.value).to.eql('http://www.baidu.com');
                return '(from:***)';
            }
        });
        expect(result).to.eql('hello world. (from:***)');

        result = replacer.replaceByRules(file, [
            {
                reg: /\(from:\s*([^\)]+)\)/,
                group: 1
            }
        ], {
            replacer: '***'
        });
        expect(result).to.eql('hello world. (from: ***)');

        result = replacer.replaceByRules(file, [
            {
                reg: /\(from:\s*([^\)]+)\)/
            }
        ], {
            replacer: '***'
        });
        expect(result).to.eql('hello world. ***');

        options = {
            replacer: function (path, file, opt) {
                expect(path).to.eql('http://www.baidu.com');
                expect(file.resolve('./a/b.css')).to.eql('/src/a/b.css');
                expect(opt === options).to.be(true);
                return '***';
            }
        };
        result = replacer.replaceByRules(file, [
            {
                reg: /\(from:\s*([^\)]+)\)/,
                group: 1,
                path: true
            }
        ], options);
        expect(result).to.eql('hello world. (from: ***)');

        result = replacer.replaceByRules(file, [
            {
                reg: /\(from:\s*([^\)]+)\)/,
                group: 1,
                path: true
            }
        ], {
            replacer: {
                domain: {
                    from: 'www.baidu.com',
                    to: 'www.google.com'
                }
            }
        });
        expect(result).to.eql('hello world. (from: http://www.google.com)');

        file.data = '<img src="http://www.baidu.com/a.jpg">';
        result = replacer.replaceByRules(file, [
            {
                tag: 'img',
                attrs: ['src'],
                path: true
            }
        ], {
            replacer: {
                domain: {
                    from: 'www.baidu.com',
                    to: 'www.google.com'
                }
            }
        });
        expect(result).to.eql('<img src="http://www.google.com/a.jpg">');

        result = replacer.replaceByRules(file, [
            {
                replacer: function (result) {
                    return result.match.replace('www.baidu.com', 'www.google.com')
                }
            }
        ]);
        expect(result).to.eql('<img src="http://www.google.com/a.jpg">');
    });

});

