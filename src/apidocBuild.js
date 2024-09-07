const apidoc = require('apidoc-light');
const { logger } = require('./logger');
const { OPTIONS } = require('./global');

/**
 * Build ApiDoc documentation.
 *
 * @param {object} options
 * @param {OPTIONS.apiDocBaseConfig} options.apiDocBaseConfig
 * @param {string[]} options.watchPath
 * @param {string} options.silent
 * @returns {*|{}|null}
 */
const setupDocs = ({ apiDocBaseConfig, watchPath: src, silent } = OPTIONS) => {
  if (!Array.isArray(src) && !src?.length) {
    return [];
  }

  const apiDocsConfig = {
    ...apiDocBaseConfig,
    src,
    silent: apiDocBaseConfig.silent || silent,
    dryRun: true
  };

  try {
    const { data } = apidoc.createDoc({ ...apiDocsConfig });
    logger.info('apidocBuild.read.apiJsonFile');
    return data;
  } catch (e) {
    logger.error(`apidocBuild.apiDoc.createDoc[${e.message}]`);
  }

  return [];
};

module.exports = { setupDocs };
