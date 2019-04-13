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
 * @param {function} next
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
 * @param {array} apiJson
 * @returns {{app:array, routesLoaded: boolean}}
 */
const buildResponse = (apiJson = []) => {
  const appResponses = [];
  let routesLoaded = 0;

  apiJson.forEach(value => {
    try {
      const successExamples = (value.success && value.success.examples) || [];
      const errorExamples = (value.error && value.error.examples) || [];
      const mockSettings = parseCustomMockSettings(value);
      const successObjects = parseStatus(successExamples, 'success', value.type, value.url);
      const errorObjects = parseStatus(errorExamples, 'error', value.type, value.url);
      const authExample = parseAuthExample(errorObjects);
      const exampleObjects = successObjects.concat(errorObjects);

      let example;

      if (!mockSettings.reload) {
        example = exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects);
      }

      appResponses.push({
        type: value.type,
        url: value.url,
        callback: (request, response) => {
          if (mockSettings.reload) {
            example = exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects);
          }

          const httpStatus = example.status > 0 && example.status < 600 ? example.status : 500;
          const { content, type } = parseContentAndType(example.content, example.type);

          response.set('Cache-Control', 'no-cache');

          if (httpStatus < 500) {
            if (value.header && value.header.fields.Header && value.header.fields.Header.length) {
              for (let i = 0; i < value.header.fields.Header.length; i++) {
                const headerValue = value.header.fields.Header[i];

                if (
                  !headerValue.optional &&
                  headerValue.field &&
                  /authorization/i.test(headerValue.field)
                ) {
                  const authorization = request.get('authorization');

                  if (!authorization) {
                    const authObj = parseContentAndType(authExample.content, authExample.type);

                    response.append('WWW-Authenticate', 'Spoof response');
                    response.status(401);
                    response.set('Content-Type', authObj.type);

                    if (mockSettings.delay > 0) {
                      logger.info(`waiting\t:401 :${value.type} :${value.url}`);
                    }

                    setTimeout(() => {
                      logger.info(`response\t:401 :${value.type} :${value.url}`);

                      response.end(authObj.content || 'Authorization Required');
                    }, mockSettings.delay || 0);

                    return;
                  }
                }
              }
            }
          }

          response.set('Content-Type', type);
          response.status(httpStatus);

          if (mockSettings.delay > 0) {
            logger.info(`waiting\t:${httpStatus} :${value.type} :${value.url}`);
          }

          setTimeout(() => {
            logger.info(`response\t:${httpStatus} :${value.type} :${value.url}`);

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
