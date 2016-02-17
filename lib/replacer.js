/**
 * @file 替换静态资源路径或内容
 * @author sparkelwhy@gmail.com
 */

var _ = require('lodash');
var htmlUtil = require('./html');
var cssUtil = require('./css');
var pathUtil = require('./path');
var common = require('./common');

module.exports = exports = {};

/**
 * 添加 domain 信息
 *
 * @inner
 * @param {string} url 要添加 domain 的 url
 * @param {string|{from: string, to: string}} domain 要替换的 domain 信息
 * @param {Object} file 要变更的 url 所在的文件
 * @param {Object} options 重写选项
 * @return {string}
 */
function addDomainInfo(url, domain, file, options) {
    var isLocalPath = file.isLocalPath(url);
    if (isLocalPath && _.isString(domain)) {
        return domain + file.resolve(url);
    }

    if (_.isPlainObject(domain) && !isLocalPath) {
        return url.replace(domain.from, domain.to);
    }

    if (_.isFunction(domain)) {
        return domain(url, file, options);
    }
}

/**
 * 重写  url 路径信息
 *
 * @inner
 * @param {string} url 要重写的 url
 * @param {{data: string, path: string}} file 要替换的文件内容
 * @param {string|Function|Object} replacer url 替换处理方法
 * @param {Object} options 重写选项
 * @return {string}
 */
function rewriteURL(url, file, replacer, options) {
    if (replacer == null) {
        return url;
    }

    var newUrl = url;
    initFile(file);
    if (_.isFunction(replacer)) {
        newUrl = replacer(newUrl, file, options);
    }
    else if (_.isString(replacer)) {
        newUrl = replacer;
    }
    else {
        var ignore = replacer.ignore;
        if (_.isFunction(ignore) && ignore(newUrl, file)) {
            return newUrl;
        }

        var domainOption = replacer.domain;
        if (domainOption) {
            var result = addDomainInfo(
                newUrl, domainOption, file, options
            );
            if (_.isString(result)) {
                newUrl = result;
            }
        }

        var transform = replacer.transform;
        if (_.isFunction(transform)) {
            newUrl = transform(newUrl, file, options);
        }
    }

    return newUrl;
}

/**
 * 替换 url
 *
 * @inner
 * @param {Object} replaceInfo 替换信息
 * @param {string} replaceInfo.match 匹配的内容
 * @param {string} replaceInfo.url 要替换的 url
 * @param {Object} replacerInfo.file 要替换的 url 所在的文件
 * @param {string|Function|Object} replacer url 替换处理方法
 * @param {Object} options 替换选项
 * @return {string}
 */
function replaceURL(replaceInfo, replacer, options) {
    var url = replaceInfo.url;
    var match = replaceInfo.match;
    if (!url) {
        return match;
    }

    if (!Array.isArray(url)) {
        url = [url];
    }

    url.forEach(function (item) {
        var replacement = rewriteURL(item, replaceInfo.file, replacer, options);
        if (item !== replacement) {
            var regexp = new RegExp('([\(\'"\\s,]|^)' + common.escapeRegexp(item), 'g');
            match = match.replace(
                regexp, '$1' + replacement
            );
        }
    });

    return match;
}

function initFile(file) {
    if (!file.resolve) {
        file.resolve = function (path) {
            return pathUtil.resolvePath(path, file.path);
        };
    }
    if (!file.isLocalPath) {
        file.isLocalPath = function (url) {
            return pathUtil.isLocalPath(url);
        };
    }
}

/**
 * 获取规则替换方法
 *
 * @inner
 * @param {Object} rule 替换规则
 * @param {{data: string, path: string}} file 要替换的文件内容
 * @param {Object} options 替换选项
 * @return {string|Function}
 */
function getRuleReplacer(rule, file, options) {
    options = options || {};
    var defaultReplacer = options.replacer;
    var ruleReplacer = rule.replacer;

    var customReplacer = ruleReplacer;
    (customReplacer == null) && (customReplacer = defaultReplacer);
    initFile(file);

    ruleReplacer = function () {
        var args = Array.prototype.slice.call(arguments);

        var value;
        var match;
        if (rule.reg) {
            value = args[rule.group || 0];
            match = args[0];
        }
        else if (rule.tag) {
            var found = args[0];
            value = found.value;
            match = found.match;
        }

        var path = rule.path;
        (path == null) && (path = options.path);
        if (path) {
            return replaceURL({
                file: file,
                url: value,
                match: match
            }, customReplacer, options);
        }

        if (_.isFunction(customReplacer)) {
            return customReplacer({
                match: match,
                value: value,
                raw: args
            }, file, options);
        }
        else if (_.isString(customReplacer)) {
            if (rule.reg) {
                return match.replace(value, customReplacer);
            }
            return customReplacer;
        }

        return match;
    };
    return ruleReplacer;
}

/**
 * 按规则进行内容替换
 *
 * @param {{data: string, path: string}} file 要替换的文件内容
 * @param {Array.<Object>} rules 要替换的规则
 * @param {Object} options 替换选项
 * @return {string}
 */
function replaceByRules(file, rules, options) {
    options || (options = {});
    var result = file.data;
    if (!Array.isArray(rules)) {
        return result;
    }

    var parseInline = options.parseInline
        || function (info) {
            return info.match;
        };

    rules.forEach(function (item) {
        var ruleReplacer = getRuleReplacer(item, file, options);

        // 处理正则替换
        if (_.isRegExp(item.reg)) {
            result = result.replace(item.reg, ruleReplacer);
            return;
        }

        // 处理 html tag
        var tag = item.tag;
        if (tag) {
            var attrs = item.attrs;
            result = htmlUtil.parseTagAttr(result, tag, attrs, function (found) {
                if (found.isInlineScript || found.isInlineStyle) {
                    return parseInline({
                        type: found.isInlineScript ? 'js' : 'css',
                        data: found.inlineContent,
                        inline: true,
                        match: found.match,
                        file: file
                    });
                }

                return _.isFunction(ruleReplacer) ? ruleReplacer(found) : ruleReplacer;
            });
        }
    });

    return result;
}

exports.replaceByRules = replaceByRules;

exports.rewriteURL = rewriteURL;

/**
 * 替换 css url 路径信息
 *
 * @param {{data: string, path: string}} file 要替换的文件内容
 * @param {Object} options 替换选项，同 `replaceHTMLURL`
 * @return {string}
 */
exports.replaceCSSURL = function (file, options) {
    initFile(file);
    var data = cssUtil.parseURLResource(file.data.toString(), function (found) {
        var replacer = options.replacer;
        if (options.path) {
            return replaceURL({
                file: file,
                url: found.url,
                match: found.match
            }, replacer, options);
        }
        else if (_.isString(replacer)) {
            return replacer;
        }
        else if (_.isFunction(replacer)) {
            return replacer({
                match: found.match,
                value: found.url,
                raw: found
            }, file, options);
        }
        return found.match;
    });
    return replaceByRules({data: data, path: file.path}, options.rules, options);
};

/**
 * 替换 HTML URL 信息
 *
 * @param {{data: string, path: string}} file 要替换的文件内容
 * @param {Object} options 替换选项
 * @param {Object|string|Function} options.replacer 默认的替换方法
 *        {
 *          domain: 'www.xxx.com' // 添加域名
 *          domain: {from: 'oldDomain', to: 'newDomain'}, // 替换域名
 *          transform: function (path) { // 将路径做下转换处理
 *              return path;
 *          },
 *          ignore: function (path) { // 是否忽略当前路径的替换
 *              return true;
 *          }
 *        }
 * @param {Function} options.parseInline 解析内联内容处理方法
 * @param {Array.<Object>=} options.rules 自定义的替换规则
 *        [{
 *          tag: 'img',
 *          attrs: [
 *              'src',
 *              {
 *                  name: 'srcset',
 *                  multiline: 'true', // 如果属性值支持多行，设为 true，默认不支持
 *                  parse: function () {
 *                      // parse attr value 如果值为多个，返回数组
 *                  }
 *              }
 *          ],
 *          path: boolean, // 是否作为路径处理替换
 *          replacer: xx // 说明见 options.replacer
 *        },
 *        {
 *          tag: {
 *              name: 'script',
 *              close: true // 是否有闭合标签，默认没有
 *          }
 *          // 未指定属性，script 默认解析 src 属性，link 解析 href 属性，
 *          // img/source 解析 src,srcset 属性
 *        },
 *        {
 *          reg: /src=([^\s]+?)/g,
 *          group: 1, // 作为路径处理匹配的分组作为路径值
 *          replacer: xx // 说明见 options.replacer
 *        }]
 * @param {boolean} optiosn.path 是否处理路径信息的替换
 * @return {string}
 */
exports.replaceHTMLURL = function (file, options) {
    initFile(file);

    var rules = options.rules || [];
    var result = file.data.toString();

    if (!Array.isArray(rules)) {
        return result;
    }

    result = replaceByRules(file, rules, options);
    return result;
};
