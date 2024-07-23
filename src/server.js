/**
 * Create server and routes
 *
 * @module Server
 */
const express = require('express');
const { createHttpTerminator } = require('http-terminator');
const { OPTIONS } = require('./global');
const { logger } = require('./logger');
const { buildResponses } = require('./buildApiResponse');

const _CACHE = { httpTerminator: null };

/**
 * A nicer shutdown, ctrl-c listener
 */
process.on('SIGINT', async () => {
  if (_CACHE?.httpTerminator?.terminate) {
    await _CACHE.httpTerminator.terminate();
  }
  process.exit(0);
});

/**
 * Set request headers. Parse OPTIONS or continue
 *
 * @param {object} request
 * @param {object} response
 * @param {Function} next
 */
const setHeaders = (request, response, next) => {
  const requestHeadersOrigin = request?.headers?.origin || undefined;

  response.set('Access-Control-Allow-Origin', (requestHeadersOrigin === undefined && '*') || requestHeadersOrigin);
  response.set('Access-Control-Allow-Credentials', requestHeadersOrigin === undefined);
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS, PATCH');

  const requestHeadersAccessControl = request?.headers?.['access-control-request-headers'] || undefined;

  if (requestHeadersAccessControl !== undefined) {
    response.set('Access-Control-Allow-Headers', requestHeadersAccessControl);
  }

  if (request.method === 'OPTIONS') {
    response.end();
  } else {
    next();
  }
};

/**
 * Set server responses
 *
 * @param {*} server
 * @param {object} options
 * @param {number} options.port
 * @param {object} settings
 * @param {buildResponses} settings.buildResponses
 * @param {logger} settings.logger
 * @returns {*|undefined}
 */
const setResponses = (
  server,
  { port } = OPTIONS,
  { buildResponses: aliasBuildResponses = buildResponses, logger: aliasLogger = logger } = {}
) => {
  const responses = aliasBuildResponses();
  let httpTerminator;

  if (Array.isArray(responses) && responses?.length) {
    responses.forEach(({ type, url, callback }) => server[type](url, callback));

    httpTerminator = createHttpTerminator({
      server: server.listen(port, () => aliasLogger.info(`listening\t:${port}`))
    });
  } else {
    aliasLogger.info('waiting');
  }

  return httpTerminator;
};

/**
 * Set base server
 *
 * @param {object} options
 * @param {number} options.port
 * @param {Array<string>} options.watch
 * @param {object} settings
 * @param {logger} settings.logger
 * @param {setHeaders} settings.setHeaders
 * @param {setResponses} settings.setResponses
 */
const setServer = async (
  { port, watch } = OPTIONS,
  {
    logger: aliasLogger = logger,
    setHeaders: aliasSetHeaders = setHeaders,
    setResponses: aliasSetResponses = setResponses
  } = {}
) => {
  let httpTerminator;

  if (_CACHE?.httpTerminator?.terminate) {
    await _CACHE.httpTerminator.terminate();
  }

  const server = express();
  server.use(aliasSetHeaders);
  _CACHE.httpTerminator = httpTerminator = aliasSetResponses(server);

  if (!httpTerminator) {
    aliasLogger.error(`Error, confirm settings:\nport=${port}\nwatch=${watch}`);
    throw new Error('Server failed to load');
  }
};

module.exports = { setHeaders, setResponses, setServer };
