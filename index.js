/**
 * @file 入口模块
 * @author sparklewhy@gmail.com
 */

var _ = require('lodash');
var htmlUtil = require('./lib/html');
var jsUtil = require('./lib/js');
var cssUtil = require('./lib/css');
var pathUtil = require('./lib/path');
var replacer = require('./lib/replacer');

module.exports = exports = {};
_.extend(exports, htmlUtil, jsUtil, cssUtil, pathUtil, replacer);

/**
 * 创建 require.config 配置脚本
 *
 * @param {Object} config 配置信息
 * @return {string}
 */
exports.createRequireConfigScript = function (config) {
    return htmlUtil.createScriptTag(jsUtil.getRequireConfigScript(config), true);
};

/**
 * 解析页面 require 模块 id
 *
 * @param {string} html html 文件内容
 * @param {boolean=} parseDataMainAttr 是否解析 `data-main` 熟悉，可选，默认 false
 * @return {{asynIds: Array, syncIds: Array}}
 */
exports.parsePageRequireModuleIds = function (html, parseDataMainAttr) {
    var asynIds = [];
    var syncIds = [];
    var addModuleId = function (ids, target) {
        ids.forEach(function (item) {
            if (item && target.indexOf(item) === -1) {
                target.push(item);
            }
        });
    };

    htmlUtil.parseHtmlScript(html, function (found) {
        if (found.isInlineScript) {
            jsUtil.parseRequire(found.inlineContent, function (found) {
                addModuleId(
                    found.moduleIds,
                    found.asyn ? asynIds : syncIds
                );
                return found.match;
            });
        }
        else if (parseDataMainAttr
            && found.isScriptLink
            && htmlUtil.DATA_MAIN_ATTR_REGEXP.test(found.attrs)
        ) {
            addModuleId([RegExp.$3], asynIds);
        }

        return found.match;
    });

    return {
        asynIds: asynIds,
        syncIds: syncIds
    };
};

/**
 * 计算给定的数据的 md5 摘要
 *
 * @param {Buffer} data 数据
 * @param {number=} length 摘要截取的长度
 * @return {string}
 */
exports.md5sum = function (data, length) {
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    md5.update(data);

    var sum = md5.digest('hex');
    if (length) {
        sum = sum.substr(0, length);
    }

    return sum;
};

