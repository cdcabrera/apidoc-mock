const fs = require('fs');
const path = require('path');
const apidoc = require('apidoc');
const { logger } = require('../logger/configLogger');
const { OPTIONS } = require('../global');

/**
 * Compile/build ApiDoc documentation.
 *
 * @param {object} options
 * @param {string} options.contextPath
 * @param {string|string[]} options.dataPath
 * @param {string} options.docsPath
 * @returns {Array|null}
 */
const buildDocs = ({ contextPath, dataPath, docsPath } = OPTIONS) => {
  const dest = (contextPath && docsPath && path.join(contextPath, docsPath)) || null;

  const src = ((Array.isArray(dataPath) && dataPath) || (dataPath && [dataPath]) || [])
    .map(val => contextPath && path.join(contextPath, val))
    .filter(val => (fs.existsSync(val) && val) || false);

  if (!src.length || !dest) {
    return null;
  }

  const apiDocsConfig = {
    src,
    dest,
    parsers: {
      apimock: path.join(__dirname, './configDocs.js')
    },
    dryRun: process.env.NODE_ENV === 'test',
    silent: process.env.NODE_ENV === 'test'
  };

  try {
    const { data } = apidoc.createDoc(apiDocsConfig);
    const updatedResult = JSON.parse(data);
    logger.info('buildDocs.read.apiJsonFile');
    return updatedResult;
  } catch (e) {
    logger.error(`buildDocs.apiDoc.createDoc[${e.message}]`);
  }

  return [];
};

module.exports = { buildDocs };
