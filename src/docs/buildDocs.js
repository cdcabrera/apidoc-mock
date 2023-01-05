const apidoc = require('apidoc');
const { logger } = require('../logger/configLogger');

/**
 * Compile/build ApiDoc documentation.
 *
 * @param {object} params
 * @param {object} params.apiDocsConfig
 * @returns {object}
 */
const buildDocs = ({ apiDocsConfig = null } = {}) => {
  if (apiDocsConfig) {
    try {
      const { data } = apidoc.createDoc(apiDocsConfig);
      const updatedResult = JSON.parse(data);
      logger.info('buildDocs.read.apiJsonFile');
      return updatedResult;
    } catch (e) {
      logger.error(`buildDocs.apiDoc.createDoc[${e.message}]`);
    }
  }

  return {};
};

module.exports = { buildDocs };
