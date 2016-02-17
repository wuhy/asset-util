/**
 * @file 解析 html 文件 工具方法
 * @author sparklewhy@gmail.com
 */

var _ = require('lodash');
var getReplacer = require('./common').getReplacer;

module.exports = exports = {};

/**
 * 获取 html 属性值提取的正则，只处理包含引号括起来的属性值
 *
 * @param {string} attrName 属性名
 * @param {boolean=} mulilineValue 是否允许多行属性值
 * @return {RegExp}
 */
exports.getAttrRegexp = function (attrName, mulilineValue) {
    var attrValue = mulilineValue ? '[\\s\\S]' : '.';
    return new RegExp('(\\s+' + attrName + '\\s*)=\\s*(\'|")(' + attrValue + '+?)\\2', 'i');
};

/**
 * 获取 Start Tag 提取正则
 *
 * @param {string} tag 标签名称
 * @param {boolean=} hasClose 是否包含关闭标签，可选，默认 false
 * @param {boolean=} closeOptional 是否闭合标签可选，默认 false
 * @return {RegExp}
 */
exports.getTagRegexp = function (tag, hasClose, closeOptional) {
    var end = hasClose ? '([\\s\\S]*?)(?:<\\/' + tag + '>)' : '';
    if (hasClose && closeOptional) {
        end = '(?:' + end + ')?';
    }
    return new RegExp('(<!--[\\s\\S]*?)(?:-->|$)|<' + tag + '([^>]*?)\\/?>' + end, 'ig');
};

/**
 * 提取内联脚本的正则
 *
 * @const
 * @type {RegExp}
 */
var SCRIPT_ELEM_REGEXP = exports.SCRIPT_REGEXP = exports.getTagRegexp('script', true);

/**
 * 链接元素正则
 *
 * @const
 * @type {RegExp}
 */
var LINK_ELEM_REGEXP = exports.LINK_REGEXP = exports.getTagRegexp('link', true, true);

/**
 * 样式元素正则
 *
 * @const
 * @type {RegExp}
 */
var STYLE_ELEM_REGEXP = exports.STYLE_REGEXP = exports.getTagRegexp('style', true);

var TYPE_ATTR_REGEXP = exports.TYPE_ATTR_REGEXP = exports.getAttrRegexp('type');
var SRC_ATTR_REGEXP = exports.SRC_ATTR_REGEXP = exports.getAttrRegexp('src');
var HREF_ATTR_REGEXP = exports.HREF_ATTR_REGEXP = exports.getAttrRegexp('href');
var REL_ATTR_REGEXP = exports.REL_ATTR_REGEXP = exports.getAttrRegexp('rel');

var SCRIPT_TYPES = ['text/javascript', 'application/javascript'];

/**
 * data-main 属性提取正则定义
 *
 * @const
 * @type {RegExp}
 */
exports.DATA_MAIN_ATTR_REGEXP = exports.getAttrRegexp('data-main');

/**
 *
 * 图片元素正则
 *
 * @const
 * @type {RegExp}
 */
var IMG_REGEXP = exports.IMG_REGEXP = exports.getTagRegexp('img');

/**
 *
 * Picture Source 元素正则
 *
 * @const
 * @type {RegExp}
 */
var SOURCE_REGEXP = exports.SOURCE_REGEXP = exports.getTagRegexp('source');

/**
 * 获取属性值解析器
 *
 * @inner
 * @param {Array.<string|Object>} attrs 要解析的属性数组
 * @param {Object=} customAttrParser 定制属性值解析器，可选
 * @return {Array.<RegExp>}
 */
function getAttrParser(attrs, customAttrParser) {
    attrs || (attrs = []);
    if (!Array.isArray(attrs)) {
        attrs = [attrs];
    }

    var result = [];
    var map = {};
    customAttrParser || (customAttrParser = {});
    for (var i = 0, len = attrs.length; i < len; i++) {
        var item = attrs[i];
        if (_.isString(item)) {
            item = {name: item};
        }
        var name = item.name.toLowerCase();
        if (map[name]) {
            continue;
        }

        map[name] = true;
        item = _.assign({}, customAttrParser[name] || {}, item);
        result.push({
            reg: exports.getAttrRegexp(name, item.multiline),
            parse: item.parse
        });
    }

    return result;
}

function replaceAttrValue(attrParser, attr, replacer) {
    var result = attrParser.reg.exec(attr);
    var value = result && result[3];
    if (value) {
        if (_.isFunction(attrParser.parse)) {
            value = attrParser.parse(value);
        }
        attr = attr.replace(result[0], replacer({
            match: result[0],
            value: value
        }));
    }
    return attr;
}

/**
 * 解析属性值
 *
 * @inner
 * @param {Array.<Object>} attrParsers 属性解析器
 * @param {string} attrs 要解析的属性信息
 * @param {string} match 当前匹配到的字符串
 * @param {Function} replacer 自定义属性值替换方法
 * @return {string}
 */
function parseAttrValue(attrParsers, attrs, match, replacer) {
    attrs && attrParsers.forEach(function (parser) {
        attrs = replaceAttrValue(parser, attrs, replacer);
    });

    return attrs;
}

/**
 * 解析 html 引用的图片
 *
 * @inner
 * @param {string} content html 文件内容
 * @param {RegExp} pattern 匹配图片元素的正则
 * @param {function(Object):string} replacer 碰到解析到的图片元素要执行的替换逻辑
 * @param {string|Array.<string>} toParseAttrs 要解析的属性
 * @return {string}
 */
function parseImgUrl(content, pattern, replacer, toParseAttrs) {
    replacer = getReplacer(replacer);

    toParseAttrs || (toParseAttrs = ['src', 'srcset']);
    var attrParsers = getAttrParser(toParseAttrs, {
        srcset: {
            parse: function (value) {
                var srcArr = [];
                var srcImgs = value.split(',');
                for (var i = 0, len = srcImgs.length; i < len; i++) {
                    var src = srcImgs[i].trim().split(' ')[0];
                    if (src && srcArr.indexOf(src) === -1) {
                        srcArr.push(src);
                    }
                }
                return srcArr;
            },
            multiline: true
        }
    });

    return content.replace(pattern, function (match, comment, attr) {
        if (comment) {
            return match;
        }

        var result = match;
        var oldAttr = attr;
        attr = parseAttrValue(attrParsers, attr, result, replacer);
        if (attr !== oldAttr) {
            result = match.replace(oldAttr, attr);
        }
        return result;
    });
}

/**
 * 解析 html 的脚本
 *
 * @param {string} content 要解析的 html 内容
 * @param {function(Object):string} replacer 碰到解析到的脚本元素要执行的替换逻辑
 * @param {string|Array.<string>=} toParseAttrs 附加要解析的属性，可选
 * @return {string}
 */
exports.parseHtmlScript = function (content, replacer, toParseAttrs) {
    toParseAttrs || (toParseAttrs = ['src']);

    replacer = getReplacer(replacer);
    var attrParsers = getAttrParser(toParseAttrs);
    return content.replace(SCRIPT_ELEM_REGEXP,
        function (match, comment, attr, body) {
            if (comment) {
                return match;
            }

            var oldAttr = attr;
            var result = match;
            body = body.trim();
            if (!body && SRC_ATTR_REGEXP.test(attr)) {
                result = replacer({
                    match: match,
                    isScriptLink: true,
                    src: RegExp.$3,
                    attrs: attr
                });
            }
            else if (!TYPE_ATTR_REGEXP.test(attr)
                || (SCRIPT_TYPES.indexOf(RegExp.$3.toLowerCase()) !== -1)
            ) {
                result = replacer({
                    match: match,
                    isInlineScript: true,
                    inlineContent: body,
                    attrs: attr
                });
            }
            else {
                result = replacer({
                    match: match,
                    inlineContent: body,
                    attrs: attr
                });
            }

            attr = parseAttrValue(attrParsers, attr, result, replacer);
            if (attr !== oldAttr) {
                result = result.replace(oldAttr, attr);
            }
            return result;
        }
    );
};

/**
 * 解析 html 的 link 信息
 *
 * @param {string} content 要解析的 html 内容
 * @param {function(Object):string} replacer 碰到解析到的元素要执行的替换逻辑
 * @param {string|Array.<string>=} toParseAttrs 附加要解析的属性，可选
 * @return {string}
 */
exports.parseHtmlLink = function (content, replacer, toParseAttrs) {
    toParseAttrs || (toParseAttrs = ['href']);

    replacer = getReplacer(replacer);
    var attrParsers = getAttrParser(toParseAttrs);

    return content.replace(LINK_ELEM_REGEXP, function (match, comment, attr) {
        if (comment) {
            return match;
        }

        var oldAttr = attr;
        var isStyleLink = REL_ATTR_REGEXP.test(attr)
            && (RegExp.$3 === 'stylesheet');
        var href = HREF_ATTR_REGEXP.test(attr) && RegExp.$3;
        var result = replacer({
            match: match,
            isLink: true,
            isStyleLink: isStyleLink,
            href: href,
            attrs: attr
        });

        attr = parseAttrValue(attrParsers, attr, result, replacer);
        if (attr !== oldAttr) {
            result = result.replace(oldAttr, attr);
        }
        return result;
    });
};

/**
 * 解析 html 的 style 元素信息
 *
 * @param {string} content 要解析的 html 内容
 * @param {function(Object):string} replacer 碰到解析到的元素要执行的替换逻辑
 * @param {string|Array.<string>=} toParseAttrs 附加要解析的属性，可选
 * @return {string}
 */
exports.parseHtmlStyle = function (content, replacer, toParseAttrs) {
    replacer = getReplacer(replacer);
    var attrParsers = getAttrParser(toParseAttrs);

    return content.replace(STYLE_ELEM_REGEXP, function (match, comment, attr, body) {
        if (comment) {
            return match;
        }

        var oldAttr = attr;
        var result = replacer({
            match: match,
            isInlineStyle: true,
            inlineContent: body,
            attrs: attr
        });

        attr = parseAttrValue(attrParsers, attr, result, replacer);
        if (attr !== oldAttr) {
            result = result.replace(oldAttr, attr);
        }
        return result;
    });
};

/**
 * 解析 html 引用的图片
 *
 * @param {string} content html 文件内容
 * @param {function(Object):string} replacer 碰到解析到的图片元素要执行的替换逻辑
 * @param {string|Array.<string>} toParseAttrs 要解析的属性
 * @return {string}
 */
exports.parseImgUrl = function (content, replacer, toParseAttrs) {
    return parseImgUrl(content, IMG_REGEXP, replacer, toParseAttrs);
};

/**
 * 解析 html Picture Source 引用的图片
 *
 * @param {string} content html 文件内容
 * @param {function(Object):string} replacer 碰到解析到的图片元素要执行的替换逻辑
 * @param {string|Array.<string>} toParseAttrs 要解析的属性
 * @return {string}
 */
exports.parsePictureSourceUrl = function (content, replacer, toParseAttrs) {
    return parseImgUrl(content, SOURCE_REGEXP, replacer, toParseAttrs);
};

/**
 * 解析指定 tag 的属性值
 *
 * @param {string} content html 文件内容
 * @param {string|{name: string, close: true}} tag 要解析的 tag，通过 `close` 明确指定标签必须闭合
 * @param {string|Array.<string>} toParseAttrs 要解析的属性
 * @param {function(Object):string} replacer 碰到解析到的属性要执行的替换逻辑
 * @return {string}
 */
exports.parseTagAttr = function (content, tag, toParseAttrs, replacer) {
    var hasCloseTag;
    if (_.isPlainObject(tag)) {
        hasCloseTag = tag.close;
        tag = tag.name;
    }

    if (/^img$/i.test(tag)) {
        return exports.parseImgUrl(content, replacer, toParseAttrs);
    }

    if (/^source/i.test(tag)) {
        return exports.parsePictureSourceUrl(content, replacer, toParseAttrs);
    }

    if (/^script/i.test(tag)) {
        return exports.parseHtmlScript(content, replacer, toParseAttrs);
    }

    if (/^link$/i.test(tag)) {
        return exports.parseHtmlLink(content, replacer, toParseAttrs);
    }

    if (/^style$/i.test(tag)) {
        return exports.parseHtmlStyle(content, replacer, toParseAttrs);
    }

    replacer = getReplacer(replacer);
    var tagRegexp = exports.getTagRegexp(tag, hasCloseTag);
    var attrParsers = getAttrParser(toParseAttrs);

    return content.replace(tagRegexp, function (match, comment, attr) {
        if (comment) {
            return;
        }

        var oldAttr = attr;
        attr = parseAttrValue(attrParsers, attr, match, replacer);
        if (attr !== oldAttr) {
            match = match.replace(oldAttr, attr);
        }
        return match;
    });
};

/**
 * 创建 script 元素
 *
 * @param {string} content 内联脚本的内容或者引用的脚本的链接
 * @param {boolean} isInline 是否内联
 * @return {string}
 */
exports.createScriptTag = function (content, isInline) {
    return isInline
        ? '<script>\n' + content + '\n</script>'
        : '<script src="' + content + '"></script>';
};

/**
 * 判断给定的 html tag 的属性值串是否包含给定的属性值
 *
 * @param {string} attrStr 要判断的 tag 属性字符串
 * @param {string} attrName 属性名
 * @param {string} attrValue 属性值
 * @return {boolean}
 */
exports.hasAttrValue = function (attrStr, attrName, attrValue) {
    var regexp = exports.getAttrRegexp(attrName);
    if (regexp.test(attrStr)) {
        var value = RegExp.$3;
        value = value.split(' ');
        return value.indexOf(attrValue) !== -1;
    }
    return false;
};
