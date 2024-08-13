const crypto = require('crypto');

/**
 * A list of forbidden headers, https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
 *
 * @type {string[]}
 */
const forbiddenHeaders = [
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie',
  'date',
  'dnt',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'permissions-policy',
  'proxy-',
  'sec-',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'via'
];

/**
 * A list of all ignored headers when generating mocks
 *
 * @type {string[]}
 */
const ignoredHeaders = [...forbiddenHeaders, 'access-control-'];

/**
 * Set context path
 *
 * @type {string}
 * @private
 */
const contextPath = (process.env.NODE_ENV === 'test' && './') || process.cwd();

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
 * Basic string truncate.
 *
 * @param {string} str
 * @param {object} settings
 * @param {number} settings.limit
 * @param {boolean} settings.isHard Use a hard truncate string cutoff. Not setting this defaults the behavior to whole word truncate.
 * @param {string} settings.postFix
 * @returns {string}
 */
const truncate = (str, { limit, isHard = false, postFix = '...' } = {}) => {
  if (str.length <= limit || typeof str !== 'string' || !/^[0-9]+$/g.test(limit)) {
    return str;
  }

  if (isHard) {
    return `${str.slice(0, limit).trim()}${postFix}`.trim();
  }

  const nextSpace = str.lastIndexOf(' ', limit);
  const updatedLimit = (nextSpace > 0 && nextSpace) || limit;
  return `${str.substring(0, updatedLimit).replace(/^\s+|\s+$/g, '')}${postFix}`.trim();
};

/**
 * Global options/settings. One time _set, then freeze.
 *
 * @type {{contextPath: string, _set: *}}
 */
const OPTIONS = {
  contextPath,
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

module.exports = { contextPath, generateHash, memo, OPTIONS, forbiddenHeaders, ignoredHeaders, isPromise, truncate };
