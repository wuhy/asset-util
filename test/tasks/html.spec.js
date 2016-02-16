var expect = require('expect.js');
var helper = require('./helper');
var htmlUtil = require('../../lib/html');

describe('parse html', function () {
    it('should return expected attr regexp', function () {
        var regexp = htmlUtil.getAttrRegexp('src');
        expect(regexp).to.eql(/(\s+src\s*)=\s*('|")(.+?)\2/i);

        regexp = htmlUtil.getAttrRegexp('srcset', true);
        expect(regexp).to.eql(/(\s+srcset\s*)=\s*('|")([\s\S]+?)\2/i);
    });

    it('should return expected tag regexp', function () {
        var regexp = htmlUtil.getTagRegexp('img');
        expect(regexp).to.eql(/(<!--[\s\S]*?)(?:-->|$)|<img([^>]*?)\/?>/gi);

        regexp = htmlUtil.getTagRegexp('script', true);
        expect(regexp).to.eql(/(<!--[\s\S]*?)(?:-->|$)|<script([^>]*?)\/?>([\s\S]*?)(?:<\/script>)/gi);
    });

    it('should return image url', function () {
        var content = helper.readFileSync('html/img.html').toString();
        var imgArr = [];
        var pictureArr = [];
        var push = Array.prototype.push;
        var replacer = function (target, result) {
            var value = result.value;
            if (value && !Array.isArray(value)) {
                target.push(value);
            }
            else if (value) {
                push.apply(target, value);
            }
        };
        var result = htmlUtil.parseImgUrl(content, replacer.bind(this, imgArr));
        expect(result).to.eql(content);

        result = htmlUtil.parsePictureSourceUrl(content, replacer.bind(this, pictureArr));
        expect(result).to.eql(content);

        expect(imgArr).to.eql([
            'mdn-logo-narrow.png',
            'mdn-logo.png',
            'small.jpg',
            'small-1.jpg',
            'images/kitten-curled.png',
            'images/kitten-curled@1.5x.png',
            'images/kitten-curled@2x.png',
            'lighthouse-160.jpg',
            'lighthouse-160.jpg',
            'lighthouse-320.jpg',
            'lighthouse-640.jpg',
            'lighthouse-1280.jpg',
            'images/butterfly.jpg',
            'lighthouse-160.jpg',
            'lighthouse-160.jpg',
            'lighthouse-320.jpg',
            'lighthouse-640.jpg',
            'lighthouse-1280.jpg',
            'foo-lores.jpg',
            'foo-hires.jpg',
            'foo-superduperhires.jpg'
        ]);
        expect(pictureArr).to.eql([
            'mdn-logo-wide.png',
            'mdn-logo.svg',
            'large.jpg',
            'medium.jpg',
            'small.jpg',
            'large-1.jpg',
            'large-2.jpg',
            'med-1.jpg',
            'med-2.jpg',
            'small-1.jpg',
            'small-2.jpg',
            'images/kitten-stretching.png',
            'images/kitten-stretching@1.5x.png',
            'images/kitten-stretching@2x.png',
            'lighthouse-landscape-640.jpg',
            'lighthouse-landscape-1280.jpg',
            'lighthouse-landscape-2560.jpg',
            'images/butterfly.webp'
        ]);
    });

    it('should return object resource', function () {
        var content = helper.readFileSync('html/object.html').toString();
        var urlArr = [];
        var result = htmlUtil.parseTagAttr(content, 'object', ['data'], function (result) {
            urlArr.push(result.value);
        });
        expect(result).to.eql(content);
        expect(urlArr).to.eql([
            '../svg/green-circle.svg'
        ]);

        urlArr = [];
        result = htmlUtil.parseTagAttr(content, 'embed', ['src'], function (result) {
            urlArr.push(result.value);
        });
        expect(result).to.eql(content);
        expect(urlArr).to.eql([
            '../svg/green-circle.svg'
        ]);
    });

    it('should return html script info', function () {
        var content = helper.readFileSync('html/script.html').toString();
        var foundItems = [];
        var result = htmlUtil.parseHtmlScript(content, function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {
                match: '<script src="http://xx.com/esl.js"></script>',
                isScriptLink: true,
                src: 'http://xx.com/esl.js',
                attrs: ' src="http://xx.com/esl.js"'
            },
            {
                match: ' src="http://xx.com/esl.js"',
                value: 'http://xx.com/esl.js'
            },
            {
                match: '<script>\n        console.log(\'hello world\');\n    </script>',
                isInlineScript: true,
                inlineContent: 'console.log(\'hello world\');',
                attrs: ''
            },
            {
                match: '<script type="application/javascript">\n        console.log(\'hello world2\');\n    </script>',
                isInlineScript: true,
                inlineContent: 'console.log(\'hello world2\');',
                attrs: ' type="application/javascript"'
            },
            {
                match: '<script type="text/javascript">\n        console.log(\'hello world3\');\n    </script>',
                isInlineScript: true,
                inlineContent: 'console.log(\'hello world3\');',
                attrs: ' type="text/javascript"'
            },
            {
                match: '<script type="application/text">\n        test...\n    </script>',
                inlineContent: 'test...',
                attrs: ' type="application/text"'
            }
        ]);
        expect(result).to.eql(content);

        content = helper.readFileSync('html/script2.html').toString();
        var foundItems = [];
        result = htmlUtil.parseHtmlScript(content, function (found) {
            foundItems.push(found);
        }, ['data-xx']);
        expect(foundItems).to.eql([
            {
                match: '<script src="http://xx.com/esl.js" data-xx="http://xx2.com/esl.js"></script>',
                isScriptLink: true,
                src: 'http://xx.com/esl.js',
                attrs: ' src="http://xx.com/esl.js" data-xx="http://xx2.com/esl.js"'
            },
            {
                match: ' data-xx="http://xx2.com/esl.js"',
                value: 'http://xx2.com/esl.js'
            },
            {
                match: '<script data-id="abc">\n        console.log(\'hello world\');\n    </script>',
                isInlineScript: true,
                inlineContent: 'console.log(\'hello world\');',
                attrs: ' data-id="abc"'
            }
        ]);
        expect(result).to.eql(content);
    });

    it('should return link info', function () {
        var content = helper.readFileSync('html/link.html').toString();
        var foundItems = [];
        var result = htmlUtil.parseHtmlLink(content, function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {
                match: '<link href="main.css" rel="stylesheet">',
                isLink: true,
                isStyleLink: true,
                href: 'main.css',
                attrs: ' href="main.css" rel="stylesheet"'
            },
            {match: ' href="main.css"', value: 'main.css'},
            {
                match: '<link href="import.html" rel="import">',
                isLink: true,
                isStyleLink: false,
                href: 'import.html',
                attrs: ' href="import.html" rel="import"'
            },
            {match: ' href="import.html"', value: 'import.html'}
        ]);
        expect(result).to.eql(content);

        content = helper.readFileSync('html/link2.html').toString();
        foundItems = [];
        result = htmlUtil.parseHtmlLink(content, function (found) {
            foundItems.push(found);
        }, ['data-xx']);
        expect(foundItems).to.eql([
            {
                match: '<link href="main.css" rel="stylesheet" data-xx="http://www.xx.com/main.css">',
                isLink: true,
                isStyleLink: true,
                href: 'main.css',
                attrs: ' href="main.css" rel="stylesheet" data-xx="http://www.xx.com/main.css"'
            },
            {
                match: ' data-xx="http://www.xx.com/main.css"',
                value: 'http://www.xx.com/main.css'
            }
        ]);
        expect(result).to.eql(content);
    });

    it('should return style info', function () {
        var content = helper.readFileSync('html/style.html').toString();
        var foundItems = [];
        var result = htmlUtil.parseHtmlStyle(content, function (found) {
            foundItems.push(found);
        }, ['data-src']);
        expect(foundItems).to.eql([
            {
                match: '<style data-src="http://xxx.com/a.css">\n        body {\n            width: 100%;\n        }\n    </style>',
                isInlineStyle: true,
                inlineContent: '\n        body {\n            width: 100%;\n        }\n    ',
                attrs: ' data-src="http://xxx.com/a.css"'
            },
            {
                match: ' data-src="http://xxx.com/a.css"',
                value: 'http://xxx.com/a.css'
            }
        ]);
        expect(result).to.eql(content);
    });

    it('should return specify tag attr info', function () {
        var content = helper.readFileSync('html/tag.html').toString();
        var foundItems = [];
        var result = htmlUtil.parseTagAttr(content, 'img', null, function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {match: ' src="small-1.jpg"', value: 'small-1.jpg'}
        ]);
        expect(result).to.eql(content);

        foundItems = [];
        result = htmlUtil.parseTagAttr(content, 'source', null, function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {
                match: ' srcset="med-1.jpg 1x, med-2.jpg 2x"',
                value: ['med-1.jpg', 'med-2.jpg']
            }
        ]);
        expect(result).to.eql(content);

        foundItems = [];
        result = htmlUtil.parseTagAttr(content, 'script', null, function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {
                match: '<script src="http://xx.com/esl.js"></script>',
                isScriptLink: true,
                src: 'http://xx.com/esl.js',
                attrs: ' src="http://xx.com/esl.js"'
            },
            {
                match: ' src="http://xx.com/esl.js"',
                value: 'http://xx.com/esl.js'
            }
        ]);
        expect(result).to.eql(content);

        foundItems = [];
        result = htmlUtil.parseTagAttr(content, 'link', null, function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {
                match: '<link href="main.css" rel="stylesheet">',
                isLink: true,
                isStyleLink: true,
                href: 'main.css',
                attrs: ' href="main.css" rel="stylesheet"'
            },
            {match: ' href="main.css"', value: 'main.css'}
        ]);
        expect(result).to.eql(content);

        foundItems = [];
        result = htmlUtil.parseTagAttr(content, 'style', null, function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {
                match: '<style>\n        body {\n            width: 100%;\n        }\n    </style>',
                isInlineStyle: true,
                inlineContent: '\n        body {\n            width: 100%;\n        }\n    ',
                attrs: ''
            }
        ]);
        expect(result).to.eql(content);

        foundItems = [];
        result = htmlUtil.parseTagAttr(content, {
            name: 'template',
            close: true
        }, ['data-src'], function (found) {
            foundItems.push(found);
        });
        expect(foundItems).to.eql([
            {match: ' data-src="a.html"', value: 'a.html'}
        ]);
        expect(result).to.eql(content);
    });

    it('should create script tag', function () {
        var result = htmlUtil.createScriptTag('main.js');
        expect(result).to.eql('<script src="main.js"></script>');

        result = htmlUtil.createScriptTag('var a = 1;', true);
        expect(result).to.eql('<script>\nvar a = 1;\n</script>');
    });

    it('should check attr value existed', function () {
        var existed = htmlUtil.hasAttrValue(' a="test"', 'a', 'test');
        expect(existed).to.be(true);

        existed = htmlUtil.hasAttrValue(' a="test test2"', 'a', 'test');
        expect(existed).to.be(true);

        existed = htmlUtil.hasAttrValue(' a="test test2"', 'a', 'test22');
        expect(existed).to.be(false);

        existed = htmlUtil.hasAttrValue(' a="test2"', 'a2', 'test2');
        expect(existed).to.be(false);
    });
});
