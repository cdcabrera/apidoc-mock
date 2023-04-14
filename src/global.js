const { join } = require('path');
const crypto = require('crypto');

/**
 * Set context path
 *
 * @type {string}
 * @private
 */
const contextPath = process.cwd();

/**
 * Simple consistent hash from content.
 *
 * @param {Array|object|*} content
 * @returns {string}
 */
const generateHash = content =>
  crypto
    .createHash('sha1')
    .update(JSON.stringify({ value: (typeof content === 'function' && content.toString()) || content }))
    .digest('hex');

/**
 * Check if "is a Promise", "Promise like".
 *
 * @param {Promise|*} obj
 * @returns {boolean}
 */
const isPromise = obj => /^\[object (Promise|Async|AsyncFunction)]/.test(Object.prototype.toString.call(obj));

/**
 * Join url path, can also be used as confirmation.
 *
 * @param {string} base
 * @param {Array} args
 * @returns {undefined|*}
 */
const joinUrl = (base, ...args) => {
  let updatedUrl;

  try {
    if (args.length) {
      updatedUrl = new URL(join(...args), base);
    } else {
      updatedUrl = new URL(base);
    }
  } catch (e) {
    return undefined;
  }

  return updatedUrl;
};

/**
 * Simple argument based memoize with adjustable limit, and extendable cache expire.
 * Expiration expands until a pause in use happens. Also allows for promises
 * and promise-like functions. For promises and promise-like functions it's the
 * consumers responsibility to await or process the resolve/reject.
 *
 * @param {Function} func A function or promise/promise-like function to memoize
 * @param {object} options
 * @param {number} options.cacheLimit Number of entries to cache before overwriting previous entries
 * @param {number} options.expire Expandable milliseconds until cache expires. The more you use it the longer it takes to expire.
 * @returns {Function}
 */
const memo = (func, { cacheLimit = 1, expire } = {}) => {
  const isFuncPromise = isPromise(func);
  const updatedExpire = Number.parseInt(expire, 10) || undefined;

  // eslint-disable-next-line func-names
  const ized = function () {
    const cache = [];
    let timeout;

    return (...args) => {
      const isMemo = cacheLimit > 0 && args.length;
      let key;
      let keyIndex = -1;

      if (typeof updatedExpire === 'number') {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
          cache.length = 0;
        }, updatedExpire);
      }

      if (isMemo) {
        key = generateHash(args);
        keyIndex = cache.indexOf(key);
      } else {
        cache.length = 0;
      }

      if (keyIndex < 0) {
        cache.unshift(
          key,
          (isFuncPromise &&
            Promise.all([func.call(null, ...args)]).then(result => {
              cache[cache.indexOf(key) + 1] = result?.[0];
              return result?.[0];
            })) ||
            func.call(null, ...args)
        );

        if (isMemo) {
          cache.length = cacheLimit * 2;
        }

        return cache[1];
      }

      if (isFuncPromise) {
        return Promise.resolve(cache[keyIndex + 1]);
      }

      return cache[keyIndex + 1];
    };
  };

  return ized();
};

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

module.exports = { contextPath, generateHash, joinUrl, memo, OPTIONS };
