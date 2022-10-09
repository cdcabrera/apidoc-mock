const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('fs');
const crypto = require('crypto');
const { extname, join, resolve } = require('path');

global.__basedir = __dirname;

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
