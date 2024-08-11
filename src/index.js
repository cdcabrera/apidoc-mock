const express = require('express');
const { createHttpTerminator } = require('http-terminator');
const { OPTIONS } = require('./global');
const { logger } = require('./logger');
const { setupDocs } = require('./apidocBuild');
const { buildRequestHeaders, buildResponse } = require('./buildApiResponse');
const CACHE = { app: null, httpTerminator: null };

/**
 * Build api responses
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
    CACHE.app[response.type](response.url, response.callback);
  });

  if (routesLoaded) {
    const server = CACHE.app.listen(port, () => logger.info(`listening\t:${port}`));
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
    if (CACHE?.httpTerminator?.terminate) {
      await CACHE.httpTerminator.terminate();
    }

    CACHE.app = express();
    CACHE.app.use(`/docs`, express.static(docsPath));
    CACHE.app.use(buildRequestHeaders);
    CACHE.httpTerminator = httpTerminator = setupResponse(apiJson);
  }

  if (httpTerminator === null) {
    logger.error(`Error, confirm settings:\nport=${port}\nwatch=${watchPath}\ndocs=${docsPath}`);
    throw new Error('Server failed to load');
  }

  return {
    apiJson,
    CACHE,
    httpTerminator
  };
};

module.exports = { apiDocMock, setupDocs, setupResponse, OPTIONS };
