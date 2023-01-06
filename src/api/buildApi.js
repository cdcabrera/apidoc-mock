const { logger } = require('../logger/configLogger');
const {
  exampleResponse,
  parseAuthExample,
  parseCustomMockSettings,
  parseContentAndType,
  parseStatus
} = require('./parseApi');

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

  apiJson.forEach((value = {}) => {
    const { error = {}, header, success = {}, type, url } = value;
    try {
      const successExamples = success?.examples || [];
      const errorExamples = error?.examples || [];
      const mockSettings = parseCustomMockSettings(value);
      const successObjects = parseStatus(successExamples, 'success', type, url);
      const errorObjects = parseStatus(errorExamples, 'error', type, url);
      const authExample = parseAuthExample(errorObjects);
      const exampleObjects = successObjects.concat(errorObjects);

      let example;

      if (!mockSettings.reload) {
        example = exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects);
      }

      appResponses.push({
        type,
        url,
        callback: (request, response) => {
          if (mockSettings.reload) {
            example = exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects);
          }

          const httpStatus = example.status > 0 && example.status < 600 ? example.status : 500;
          const { content, type } = parseContentAndType(example.content, example.type);

          response.set('Cache-Control', 'no-cache');

          if (httpStatus < 500 && Array.isArray(header?.fields?.Header)) {
            header?.fields?.Header?.forEach(headerValue => {
              if (!headerValue.optional && headerValue.field && /authorization/i.test(headerValue.field)) {
                const authorization = request.get('authorization');

                if (!authorization) {
                  const authObj = parseContentAndType(authExample.content, authExample.type);

                  response.append('WWW-Authenticate', 'Spoof response');
                  response.status(401);
                  response.set('Content-Type', authObj.type);

                  if (mockSettings.delay > 0) {
                    logger.info(`waiting\t:401 :${type} :${url}`);
                  }

                  setTimeout(() => {
                    logger.info(`response\t:401 :${type} :${url}`);

                    response.end(authObj.content || 'Authorization Required');
                  }, mockSettings.delay || 0);
                }
              }
            });
          }

          response.set('Content-Type', type);
          response.status(httpStatus);

          if (mockSettings.delay > 0) {
            logger.info(`waiting\t:${httpStatus} :${type} :${url}`);
          }

          setTimeout(() => {
            logger.info(`response\t:${httpStatus} :${type} :${url}`);

            response.send(content);
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
