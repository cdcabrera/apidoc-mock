const fs = require('fs');
const path = require('path');
const express = require('express');
const { OPTIONS } = require('./global');
const { logger } = require('./logger/configLogger');
const { buildDocs } = require('./docs/buildDocs');
const { buildRequestHeaders, buildResponse } = require('./api/buildApi');
const cache = { app: null, server: null };

/**
 * Build documentation
 *
 * @param {object} options
 * @param {string} options.contextPath
 * @param {string|string[]} options.dataPath
 * @param {string} options.docsPath
 * @returns {*|{}|null}
 */
const setupDocs = ({ contextPath, dataPath, docsPath } = OPTIONS) => {
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
      apimock: path.join(__dirname, './docs/configDocs.js')
    },
    dryRun: process.env.NODE_ENV === 'test',
    silent: process.env.NODE_ENV === 'test'
  };

  const apiJson = buildDocs({ apiDocsConfig });

  return (Array.isArray(apiJson) && apiJson) || null;
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
  let server = null;

  appResponses.forEach(response => {
    cache.app[response.type](response.url, response.callback);
  });

  if (routesLoaded) {
    server = cache.app.listen(port, () => logger.info(`listening\t:${port}`));
  } else {
    logger.info('waiting');
  }

  return server;
};

/**
 * ApiDocMock
 *
 * @param {object} options
 * @param {number} options.port
 * @param {string|string[]} options.dataPath
 * @param {string} options.docsPath
 * @returns {*}
 */
const apiDocMock = ({ port, dataPath, docsPath } = OPTIONS) => {
  const apiJson = setupDocs();
  let server = null;

  if (apiJson) {
    cache.app = express();
    cache.app.use(`/docs`, express.static(docsPath));
    cache.app.use(buildRequestHeaders);

    if (cache.server && cache.server.close) {
      cache.server.close();
    }

    cache.server = server = setupResponse(apiJson);
  }

  if (server === null) {
    logger.error(`Error, confirm settings:\nport=${port}\nwatch=${dataPath}\ndocs=${docsPath}`);
    throw new Error('Server failed to load');
  }

  return server;
};

module.exports = { apiDocMock, setupDocs, setupResponse, OPTIONS };
