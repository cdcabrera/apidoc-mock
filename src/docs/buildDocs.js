const fs = require('fs');
const apidoc = require('apidoc');
const { logger } = require('../logger/configLogger');

/**
 * Compile/build ApiDoc documentation.
 *
 * @param {object} apiDocsConfig
 * @param {string} apiJsonFile
 * @returns {object}
 */
const buildDocs = ({ apiDocsConfig = null, apiJsonFile = null }) => {
  let result;

  if (apiDocsConfig) {
    try {
      result = apidoc.createDoc(apiDocsConfig);
    } catch (e) {
      logger.error(`buildDocs.apiDoc.createDoc[${e.message}]`);
    }
  }

  if (!result) {
    logger.error('buildDocs.apiDoc.createDoc.noResult');
    return {};
  }

  if (apiJsonFile) {
    logger.info('buildDocs.read.apiJsonFile');
    return JSON.parse(fs.readFileSync(apiJsonFile, 'utf8'));
  }

  return {};
};

module.exports = { buildDocs };
