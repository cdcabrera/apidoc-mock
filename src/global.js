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
 * Simple argument-based memoize with adjustable cache limit, and extendable cache expire.
 *
 * - `Zero-arg caching`: Zero-argument calls are memoized. To disable caching and perform a manual reset on every call, set cacheLimit <= 0.
 * - `Expiration`: Expiration expands until a pause in use happens. All results, regardless of type, will be expired.
 * - `Promises`: Allows for promises and promise-like functions
 * - `Errors`: It's on the consumer to catch function errors and await or process a Promise resolve/reject/catch.
 *
 * @param {Function} func A function or promise/promise-like function to memoize
 * @param {object} [options]
 * @param {boolean} [options.cacheErrors=true] - Memoize errors, or don't.
 * @param {number} [options.cacheLimit=1] - Number of entries to cache before overwriting previous entries
 * @param {Function} [options.debug=Function.prototype] - Unsure what you cached, just want to test, add a callback that's called
 *     with `{ type: string, value: unknown, cache: Array<unknown> }`
 * @param {number} [options.expire] Expandable milliseconds until cache expires. The more you use the memoized function, or
 *     promise/promise-like function, the longer it takes to expire.
 * @returns {Function}
 */
const memo = (func, { cacheErrors = true, cacheLimit = 1, debug = Function.prototype, expire } = {}) => {
  const isCacheErrors = Boolean(cacheErrors);
  const isFuncPromise = isPromise(func);
  const updatedExpire = Number.parseInt(expire, 10) || undefined;

  const ized = function () {
    const cache = [];
    let timeout;

    return (...args) => {
      const isMemo = cacheLimit > 0;

      if (typeof updatedExpire === 'number') {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
          cache.length = 0;
        }, updatedExpire);
      }

      // Zero cacheLimit, reset and bypass memoization
      if (isMemo === false) {
        cache.length = 0;
        const bypassValue = func.call(null, ...args);

        debug({
          type: 'memo bypass',
          value: () => bypassValue,
          cache: []
        });

        return bypassValue;
      }

      const key = generateHash(args);

      // Parse, memoize and return the original value
      if (cache.indexOf(key) < 0) {
        if (isFuncPromise) {
          const promiseResolve = Promise
            .resolve(func.call(null, ...args))
            .catch(error => {
              const promiseKeyIndex = cache.indexOf(key);

              if (isCacheErrors === false && promiseKeyIndex >= 0) {
                cache.splice(promiseKeyIndex, 2);
              }

              return Promise.reject(error);
            });

          cache.unshift(key, promiseResolve);
        } else {
          try {
            cache.unshift(key, func.call(null, ...args));
          } catch (error) {
            const errorFunc = () => {
              throw error;
            };

            errorFunc.isError = true;
            cache.unshift(key, errorFunc);
          }
        }

        // Run after cache update to trim
        if (isMemo) {
          cache.length = cacheLimit * 2;
        }
      }

      // Return memoized value
      const updatedKeyIndex = cache.indexOf(key);
      const cachedValue = cache[updatedKeyIndex + 1];

      if (cachedValue?.isError === true) {
        if (isCacheErrors === false) {
          cache.splice(updatedKeyIndex, 2);
        }

        debug({
          type: 'memo error',
          value: cachedValue,
          cache: [...cache]
        });

        return cachedValue();
      }

      debug({
        type: `memo${(isFuncPromise && ' promise') || ''}`,
        value: () => cachedValue,
        cache: [...cache]
      });

      return cachedValue;
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
    apimock: join(__dirname, './apidocConfig.js')
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
