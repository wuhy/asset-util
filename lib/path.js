/**
 * @file 资源路径相关工具方法定义
 * @author sparklewhy@gmail.com
 */

var pathUtil = require('path');

/**
 * 获取给定文件路径的扩展名称，不包含 `.`
 *
 * @param  {string} filePath 文件路径
 * @return {string}
 */
exports.getFileExtName = function (filePath) {
    return pathUtil.extname(filePath).slice(1);
};

/**
 * 判断给定的路径是不是本地路径
 *
 * @param {string} filePath 要判断的文件路径
 * @return {boolean}
 */
exports.isLocalPath = function (filePath) {
    return !(/^\/\//.test(filePath) || /^[a-z][a-z0-9\+\-\.]+:/i.test(filePath));
};

/**
 * 规范化路径
 *
 * @param {string} path 要规范的路径
 * @return {string}
 */
exports.normalizePath = function (path) {
    return pathUtil.normalize(path).replace(/\\/g, '/');
};

/**
 * 重新计算给定的相对路径为绝对路径
 *
 * @param {string} relativePath 相对路径
 * @param {string} baseFilePath 相对的文件的路径
 * @return {string}
 */
exports.resolvePath = function (relativePath, baseFilePath) {
    var slashRegex = /^\//;
    if (!exports.isLocalPath(relativePath) || slashRegex.test(relativePath)) {
        return relativePath;
    }

    relativePath = exports.normalizePath(relativePath);
    baseFilePath = exports.normalizePath(baseFilePath);
    if (!slashRegex.test(baseFilePath)) {
        baseFilePath = '/' + baseFilePath;
    }
    return exports.normalizePath(
        pathUtil.join(pathUtil.dirname(baseFilePath), relativePath)
    );
};
