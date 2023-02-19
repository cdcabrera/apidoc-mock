const { join } = require('path');
const crypto = require('crypto');

/**
 * Generate a consistent hash from content.
 *
 * @param {Array|object|*} content
 * @returns {string}
 */
const generateHash = content =>
  crypto
    .createHash('sha1')
    .update(JSON.stringify({ value: content }))
    .digest('hex');

/**
 * Simple memoize, cache based arguments with adjustable limit.
 *
 * @param {Function} func
 * @param {object} options
 * @param {number} options.cacheLimit
 * @returns {Function}
 */
const memo = (func, { cacheLimit = 3 } = {}) => {
  const ized = function () {
    const cache = [];

    return (...args) => {
      const key = generateHash(args);
      const keyIndex = cache.indexOf(key);

      if (keyIndex < 0) {
        const result = func.apply(null, args);
        cache.unshift(key, result);
        cache.length = cacheLimit * 2;
        return cache[1];
      }

      return cache[keyIndex + 1];
    };
  };

  return ized();
};

/**
 * Set context path
 *
 * @type {string}
 * @private
 */
const contextPath = process.cwd();

/**
 * Set a base config for apidocs, apply apidoc-mock custom comment parser.
 *
 * @type {{silent: boolean, dryRun: boolean, src: undefined, parsers: {apimock: string}, dest: undefined}}
 */
const apiDocBaseConfig = {
  src: undefined,
  dest: undefined,
  dryRun: process.env.NODE_ENV === 'test',
  silent: process.env.NODE_ENV === 'test',
  parsers: {
    apimock: join(__dirname, './docs/configDocs.js')
  }
};

/**
 * Global options/settings. One time _set, then freeze.
 *
 * @type {{contextPath: string, _set: *}}
 */
const OPTIONS = {
  contextPath,
  apiDocBaseConfig,
  set _set(obj) {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'function') {
        this[key] = value.call(this);
        return;
      }

      this[key] = value;
    });
    delete this._set;
    Object.freeze(this);
  }
};

module.exports = { contextPath, generateHash, memo, OPTIONS };
