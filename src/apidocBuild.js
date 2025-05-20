const apidoc = require('@cdcabrera/apidoc');
const { logger } = require('./logger');
const { OPTIONS } = require('./global');

/**
 * Build ApiDoc documentation.
 *
 * @param {object} options
 * @param {OPTIONS.apiDocBaseConfig} options.apiDocBaseConfig
 * @param {string[]} options.watchPath
 * @param {string} options.docsPath
 * @param {string} options.silent
 * @returns {*|{}|null}
 */
const setupDocs = ({ apiDocBaseConfig, watchPath: src, docsPath: dest, silent } = OPTIONS) => {
  if ((!Array.isArray(src) && !src?.length) || !dest) {
    return [];
  }

  const apiDocsConfig = {
    ...apiDocBaseConfig,
    src,
    dest,
    silent: apiDocBaseConfig.silent || silent
  };

  try {
    const { data } = apidoc.createDoc(apiDocsConfig);
    const updatedResult = JSON.parse(data);
    logger.info('apidocBuild.read.apiJsonFile');
    return updatedResult;
  } catch (e) {
    logger.error(`apidocBuild.apiDoc.createDoc[${e.message}]`);
  }

  return [];
};

module.exports = { setupDocs };
