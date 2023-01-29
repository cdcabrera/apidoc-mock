const fs = require('fs');
const path = require('path');
const express = require('express');
const { createHttpTerminator } = require('http-terminator');
const { logger } = require('./logger/configLogger');
const { buildDocs } = require('./docs/buildDocs');
const { buildRequestHeaders, buildResponse } = require('./api/buildApi');
const cache = { app: null, httpTerminator: null };

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
 * @param {object} params
 * @param {number} params.port
 * @param {(string|string[])} params.dataPath
 * @param {string} params.docsPath
 * @returns {*}
 */
const apiDocMock = async ({ port = 8000, dataPath, docsPath = '.docs' } = {}) => {
  const apiJson = setupDocs(dataPath, docsPath);
  let httpTerminator = null;

  if (apiJson) {
    if (cache?.httpTerminator?.terminate) {
      await cache.httpTerminator.terminate();
    }

    cache.app = express();
    cache.app.use(`/docs`, express.static(docsPath));
    cache.app.use(buildRequestHeaders);
    cache.httpTerminator = httpTerminator = setupResponse(apiJson, port);
  }

  if (httpTerminator === null) {
    logger.error(`Error, confirm settings:\nport=${port}\nwatch=${dataPath}\ndocs=${docsPath}`);
    throw new Error('Server failed to load');
  }

  return httpTerminator;
};

module.exports = { apiDocMock, setupDocs, setupResponse };
