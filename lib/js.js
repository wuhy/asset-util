/**
 * @file 解析 js 文件内容相关工具方法定义
 * @author sparklewhy@gmail.com
 */

var getReplacer = require('./common').getReplacer;

module.exports = exports = {};

/**
 * 模块 require 正则定义
 *
 * @const
 * @type {RegExp}
 */
var REQUIRE_REGEXP = exports.REQUIRE_REGEXP
    = /((?:\/\*[\s\S]*?\*\/)|(?:\/\/.*))|\brequire\s*\(\s*(?:\[([^\]]+)\]|((['"]).+?\4))/g;
/**
 * document.write 的正则定义
 *
 * @const
 * @type {RegExp}
 */
var DOCUMENT_WRITE_REGEXP = exports.DOCUMENT_WRITE_REGEXP
    = /((?:\/\*[\s\S]*?\*\/)|(?:\/\/.*))|document\.write\s*\(\s*(['"])([\s\S]+?)\1\s*\)\s*;?/g;

/**
 * 解析 require 信息
 *
 * @param {string} content 要解析的脚本内容
 * @param {function(Object):string} replacer 碰到解析到的内容要执行的替换逻辑
 * @return {string}
 */
exports.parseRequire = function (content, replacer) {
    var moduleIdRegexp = /^(['"])([^'"]+)\1$/;
    replacer = getReplacer(replacer);
    return content.replace(REQUIRE_REGEXP, function (match, comment, asynId, syncId) {
        if (comment) {
            return match;
        }
        var moduleIds = [];
        var addModuleId = function (idStr) {
            var moduleId = moduleIdRegexp.test(idStr) && RegExp.$2;
            if (moduleId) {
                moduleIds.push(moduleId);
            }
        };

        var isAsyn = false;
        if (asynId) {
            isAsyn = true;
            var moduleIdArr = asynId.split(',');

            for (var i = 0, len = moduleIdArr.length; i < len; i++) {
                var id = moduleIdArr[i];
                addModuleId(id.trim());
            }
        }
        else if (syncId) {
            addModuleId(syncId);
        }

        return replacer({
            moduleIds: moduleIds,
            asyn: isAsyn,
            match: match
        });
    });
};

/**
 * 解析 documen.write 的信息
 *
 * @param {string} content 要解析的脚本内容
 * @param {function(Object):string} replacer 碰到解析到的内容要执行的替换逻辑
 * @return {string}
 */
exports.parseDocumentWrite = function (content, replacer) {
    replacer = getReplacer(replacer);
    return content.replace(DOCUMENT_WRITE_REGEXP, function (match, comment, quot, script) {
        if (comment) {
            return match;
        }

        return replacer({
            match: match,
            script: script
        });
    });
};

/**
 * 获取 require.config 配置的脚本内容
 *
 * @param {Object} config 配置信息
 * @param {boolean|number=} indent 是否缩进或者缩进的空格数，可选，默认缩进：2
 * @return {string}
 */
exports.getRequireConfigScript = function (config, indent) {
    var hasIndent = indent !== false;
    var result = JSON.stringify(config, null, hasIndent ? (indent || 2) : null);
    return 'require.config(' + result + ');';
};
