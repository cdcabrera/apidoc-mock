const express = require('express');
const { createHttpTerminator } = require('http-terminator');
const { OPTIONS } = require('./global');
const { logger } = require('./logger/configLogger');
const { buildDocs } = require('./docs/buildDocs');
const { buildRequestHeaders, buildResponse } = require('./api/buildApi');
const cache = { app: null, httpTerminator: null };

/**
 * Build documentation
 *
 * @param {object} options
 * @param {OPTIONS.apiDocBaseConfig} options.apiDocBaseConfig
 * @param {string|string[]} options.watchPath
 * @param {string} options.docsPath
 * @param {string} options.silent
 * @returns {*|{}|null}
 */
const setupDocs = ({ apiDocBaseConfig, watchPath: src, docsPath: dest, silent } = OPTIONS) => {
  if ((!Array.isArray(src) && !src?.length) || !dest) {
    return [];
  }

  const apiJson = buildDocs({
    apiDocsConfig: {
      ...apiDocBaseConfig,
      src,
      dest,
      silent: apiDocBaseConfig.silent || silent
    }
  });

  return (Array.isArray(apiJson) && apiJson) || [];
};

/**
 * Build response
 *
 * @param {Array} apiJson
 * @param {object} options
 * @param {number} options.port
 * @returns {*}
 */
const setupResponse = (apiJson = [], { port } = OPTIONS) => {
  const { routesLoaded, appResponses } = buildResponse(apiJson);
  let httpTerminator = null;

  appResponses.forEach(response => {
    cache.app[response.type](response.url, response.callback);
  });

  if (routesLoaded) {
    const server = cache.app.listen(port, () => logger.info(`listening\t:${port}`));
    httpTerminator = createHttpTerminator({
      server
    });
  } else {
    logger.info('waiting');
  }

  return httpTerminator;
};

/**
 * ApiDocMock
 *
 * @param {object} options
 * @param {number} options.port
 * @param {string|string[]} options.watchPath
 * @param {string} options.docsPath
 * @returns {*}
 */
const apiDocMock = async ({ port, watchPath, docsPath } = OPTIONS) => {
  const apiJson = setupDocs();
  let httpTerminator = null;

  if (apiJson.length) {
    if (cache?.httpTerminator?.terminate) {
      await cache.httpTerminator.terminate();
    }

    cache.app = express();
    cache.app.use(`/docs`, express.static(docsPath));
    cache.app.use(buildRequestHeaders);
    cache.httpTerminator = httpTerminator = setupResponse(apiJson);
  }

  if (httpTerminator === null) {
    logger.error(`Error, confirm settings:\nport=${port}\nwatch=${watchPath}\ndocs=${docsPath}`);
    throw new Error('Server failed to load');
  }

  return httpTerminator;
};

module.exports = { apiDocMock, setupDocs, setupResponse, OPTIONS };
