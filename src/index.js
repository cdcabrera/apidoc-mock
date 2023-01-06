const fs = require('fs');
const path = require('path');
const express = require('express');
const { logger } = require('./logger/configLogger');
const { buildDocs } = require('./docs/buildDocs');
const { buildRequestHeaders, buildResponse } = require('./api/buildApi');
const cache = { app: null, server: null };

/**
 * Build documentation
 *
 * @param {(string|string[])} dataPath
 * @param {string} docsPath
 * @returns {{}|*}
 */
const setupDocs = (dataPath = '', docsPath = '') => {
  const cwd = process.cwd();
  const dest = (docsPath && path.join(cwd, docsPath)) || null;

  const src = ((Array.isArray(dataPath) && dataPath) || (dataPath && [dataPath]) || [])
    .map(val => path.join(cwd, val))
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
 * @param {number} port
 * @returns {*}
 */
const setupResponse = (apiJson = [], port) => {
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
 * @param {object} params
 * @param {number} params.port
 * @param {(string|string[])} params.dataPath
 * @param {string} params.docsPath
 * @returns {*}
 */
const apiDocMock = ({ port = 8000, dataPath, docsPath = '.docs' } = {}) => {
  const apiJson = setupDocs(dataPath, docsPath);
  let server = null;

  if (apiJson) {
    cache.app = express();
    cache.app.use(`/docs`, express.static(docsPath));
    cache.app.use(buildRequestHeaders);

    if (cache.server && cache.server.close) {
      cache.server.close();
    }

    cache.server = server = setupResponse(apiJson, port);
  }

  if (server === null) {
    logger.error(`Error, confirm settings:\nport=${port}\nwatch=${dataPath}\ndocs=${docsPath}`);

    throw new Error('Server failed to load');
  }

  return server;
};

module.exports = { apiDocMock, setupDocs, setupResponse };
