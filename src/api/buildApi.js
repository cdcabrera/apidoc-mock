const { logger } = require('../logger/configLogger');
const { getExampleResponse, parseCustomMockSettings, parseContentAndType } = require('./parseApi');

/**
 * Open request headers up. Parse OPTIONS or continue
 *
 * @param {object} request
 * @param {object} response
 * @param {Function} next
 */
const buildRequestHeaders = (request, response, next) => {
  const hasOrigin = request.headers.origin != null;

  response.set('Access-Control-Allow-Origin', hasOrigin ? request.headers.origin : '*');
  response.set('Access-Control-Allow-Credentials', !hasOrigin);
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS, PATCH');

  const requestHeaders = request.headers['access-control-request-headers'];

  if (requestHeaders !== null && requestHeaders !== undefined) {
    response.set('Access-Control-Allow-Headers', requestHeaders);
  }

  if (request.method === 'OPTIONS') {
    response.end();
  } else {
    next();
  }
};

/**
 * Build API response
 *
 * @param {Array} apiJson
 * @returns {{app:Array, routesLoaded: boolean}}
 */
const buildResponse = (apiJson = []) => {
  const appResponses = [];
  let routesLoaded = 0;

  apiJson.forEach(({ error = {}, header, success = {}, type, url, mock } = {}) => {
    try {
      const mockSettings = parseCustomMockSettings(mock);
      const { example, authExample } = getExampleResponse({
        mockSettings,
        successExamples: success.examples,
        errorExamples: error.examples,
        type,
        url
      });

      appResponses.push({
        type,
        url,
        callback: (request, response) => {
          let updatedExample = example;
          let updatedAuthExample = authExample;

          if (mockSettings.reload) {
            const { example: reloadExample, authExample: reloadAuthExample } = getExampleResponse({
              mockSettings,
              successExamples: success.examples,
              errorExamples: error.examples,
              type,
              url
            });

            updatedExample = reloadExample;
            updatedAuthExample = reloadAuthExample;
          }

          const httpStatus = updatedExample.status > 0 && updatedExample.status < 600 ? updatedExample.status : 500;
          const responseObj = parseContentAndType({ ...updatedExample });

          response.set('Cache-Control', 'no-cache');

          if (httpStatus < 500 && Array.isArray(header?.fields?.Header)) {
            let isAuthorized = true;

            header?.fields?.Header?.forEach(headerValue => {
              if (!headerValue.optional && headerValue.field && /authorization/i.test(headerValue.field)) {
                const authorization = request.get('authorization');

                if (!authorization) {
                  const authResponseObj = parseContentAndType({ ...updatedAuthExample });
                  const forcedStatus = 401;

                  response.append('WWW-Authenticate', 'Spoof response');
                  response.status(forcedStatus);
                  response.set('Content-Type', authResponseObj.contentType);

                  if (mockSettings.delay > 0) {
                    logger.info(`waiting\t:${forcedStatus} :${authResponseObj.contentType} :${url}`);
                  }

                  setTimeout(() => {
                    logger.info(`response\t:${forcedStatus} :${authResponseObj.contentType} :${url}`);
                    response.end(authResponseObj.content || 'Authorization Required');
                  }, mockSettings.delay || 0);

                  isAuthorized = false;
                }
              }
            });

            if (isAuthorized === false) {
              return;
            }
          }

          response.status(httpStatus);
          response.set('Content-Type', responseObj.contentType);

          if (mockSettings.delay > 0) {
            logger.info(`waiting\t:${httpStatus} :${responseObj.contentType} :${url}`);
          }

          setTimeout(() => {
            logger.info(`response\t:${httpStatus} :${responseObj.contentType} :${url}`);
            response.send(responseObj.content);
          }, mockSettings.delay || 0);
        }
      });

      routesLoaded += 1;
    } catch (e) {
      logger.warn(`response\t:${e.message}`);
    }
  });

  return {
    appResponses,
    routesLoaded: routesLoaded > 0
  };
};

module.exports = { buildRequestHeaders, buildResponse };
