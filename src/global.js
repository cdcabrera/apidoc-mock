const { join } = require('path');

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

module.exports = { contextPath, OPTIONS };
