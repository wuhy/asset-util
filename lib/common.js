/**
 * @file 公共方法定义
 * @author sparklewhy@gmail.com
 */

/**
 * 获取替换方法
 *
 * @param {Function} replacer 替换处理器方法
 * @return {Function}
 */
exports.getReplacer = function (replacer) {
    return function (found) {
        var result = replacer.apply(this, arguments);
        return (result == null || result === false) ? found.match : result;
    };
};

/**
 * 替换所有满足的匹配项为给定的字符串
 *
 * @param {string} str 要替换的字符串
 * @param {string} match 要替换的匹配字符串
 * @param {string} replacement 替代的字符串
 * @return {string}
 */
exports.replaceAll = function (str, match, replacement) {
    var parts = [];
    var index;
    while ((index = str.indexOf(match)) !== -1) {
        str = str.replace(match, replacement);
        var lastIndex = index + replacement.length;
        parts.push(str.substr(0, lastIndex));
        str = str.substr(lastIndex);
    }
    parts.push(str);
    return parts.join('');
};

/**
 * 转义字符串的正则字符
 *
 * @param {string} str 要转义的字符串
 * @return {string}
 */
exports.escapeRegexp = function (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
};
