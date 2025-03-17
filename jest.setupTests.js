const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('fs');
const crypto = require('crypto');
const { extname, join, resolve } = require('path');

global.__basedir = __dirname;

jest.mock('express', () => {
  const mockExpress = function () {
    return {
      delete: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      use: jest.fn(),
      listen: jest.fn()
    };
  };

  mockExpress.static = jest.fn();
  return mockExpress;
});

jest.mock('http-terminator', () => ({
  createHttpTerminator: () => ({
    terminate: () => 'success'
  })
}));

/**
 * Generate a fixture from string literals.
 *
 * @param {string} contents
 * @param {object} options
 * @param {string} options.dir
 * @param {string} options.ext
 * @param {string} options.encoding
 * @param {string} options.filename
 * @param {boolean} options.resetDir
 * @returns {{path: string, file: string, contents: *, dir: string}}
 */
const generateFixture = (
  contents,
  { dir = resolve(__dirname, '.fixtures'), ext = 'txt', encoding = 'utf8', filename, resetDir = true } = {}
) => {
  const updatedFileName = filename || crypto.createHash('md5').update(contents).digest('hex');
  const file = extname(updatedFileName) ? updatedFileName : `${updatedFileName}.${ext}`;
  const path = join(dir, file);

  if (resetDir && existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(path, contents, { encoding });
  const updatedContents = readFileSync(path, { encoding });

  return { dir, file, path, contents: updatedContents };
};

global.generateFixture = generateFixture;

/**
 * Shallow mock specific properties, restore with callback, mockClear.
 * A simple object property mock for scenarios where the property is not a function/Jest fails.
 *
 * @param {object} object
 * @param {object} propertiesValues
 * @returns {{mockClear: Function}}
 */
const mockObjectProperty = (object = {}, propertiesValues) => {
  const updatedObject = object;
  const originalPropertiesValues = {};

  Object.entries(propertiesValues).forEach(([key, value]) => {
    originalPropertiesValues[key] = updatedObject[key];
    updatedObject[key] = value;
  });

  return {
    mockClear: () => {
      Object.assign(updatedObject, originalPropertiesValues);
    }
  };
};

global.mockObjectProperty = mockObjectProperty;
