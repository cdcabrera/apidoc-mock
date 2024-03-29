const { logger } = require('./logger');
const { exampleApiDocResponse } = require('./apidocParse');
const { memo } = require('./global');

/**
 * Parse custom mock settings.
 *
 * @param {object} params
 * @param {Array} params.settings
 * @returns {{forceStatus: (number|undefined), delay: (number|undefined), reload: (number|undefined),
 *     response: (number|undefined)}}
 */
const getCustomMockSettings = memo(({ settings = [] } = {}) => {
  const updatedSettings = {
    delay: undefined,
    forceStatus: undefined,
    response: undefined,
    reload: undefined
  };

  settings?.forEach(val => {
    const [key = '', value] = Object.entries(val)?.[0] || [];

    switch (key.toLowerCase()) {
      case 'delay':
      case 'delayresponse':
        updatedSettings.delay = Number.parseInt(value, 10);

        if (Number.isNaN(updatedSettings.delay)) {
          updatedSettings.delay = 1000;
        }

        break;
      case 'force':
      case 'forcestatus':
      case 'forcedstatus':
        updatedSettings.forceStatus = Number.parseInt(value, 10);

        if (Number.isNaN(updatedSettings.forceStatus)) {
          updatedSettings.forceStatus = 200;
        }

        break;
      case 'response':
        updatedSettings.response = 'response';
        break;
      case 'random':
      case 'randomresponse':
        updatedSettings.response = 'response';
        updatedSettings.reload = true;
        break;
      case 'randomsuccess':
        updatedSettings.response = 'success';
        updatedSettings.reload = true;
        break;
      case 'randomerror':
        updatedSettings.response = 'error';
        updatedSettings.reload = true;
        break;
    }
  });

  return updatedSettings;
});

/**
 * Return passed mock mime type and parsed content
 *
 * @param {object} params
 * @param {string} params.content
 * @param {string} params.type
 * @returns {{content: string, contentType: string}}
 */
const getContentAndType = memo(({ content = '', type: contentType } = {}) => {
  let updatedContent = content;
  let updatedType;

  if (/^HTTP/.test(content)) {
    updatedContent = content.split(/\n/).slice(1).join('\n');
  }

  /**
   * Ignore content types that already contain a `/`
   */
  if (contentType?.split('/').length > 1) {
    return {
      content: updatedContent,
      contentType
    };
  }

  switch (contentType) {
    case 'zip':
    case 'gzip':
    case 'json':
      updatedType = `application/${contentType}`;
      break;
    case 'xml':
    case 'html':
    case 'csv':
    case 'css':
      updatedType = `text/${contentType}`;
      break;
    case 'svg':
      updatedType = 'image/svg+xml';
      break;
    case 'txt':
    default:
      updatedType = 'text/plain';
      break;
  }

  return {
    content: updatedContent,
    contentType: updatedType
  };
});

/**
 * Aggregate possible responses, return an example based on available configuration.
 *
 * @param {object} params
 * @param {object} params.mockSettings
 * @param {Array} params.successExamples
 * @param {Array} params.errorExamples
 * @param {string} params.type
 * @param {string} params.url
 * @returns {{authExample: {content: *, type: *}, example: {content: *, type: *}}}
 */
const getExampleResponse = async ({ mockSettings, successExamples = [], errorExamples = [], type, url } = {}) =>
  exampleApiDocResponse({ mockSettings, successExamples, errorExamples, type, url });

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
      const mockSettings = getCustomMockSettings({ settings: mock?.settings, url });
      const memoGetExampleResponse = memo(getExampleResponse, {
        cacheLimit: mockSettings?.reload ? 0 : 25
      });

      appResponses.push({
        type,
        url,
        callback: async (request, response) => {
          /**
           * Leverage memo caching using isParams, isQuery.
           */
          const { example: updatedExample, authExample: updatedAuthExample } = await memoGetExampleResponse({
            mockSettings,
            successExamples: success.examples,
            errorExamples: error.examples,
            type,
            url,
            isParams: request?.params,
            isQuery: request?.query
          });

          const httpStatus = updatedExample?.status > 0 && updatedExample?.status < 600 ? updatedExample.status : 500;
          const responseObj = getContentAndType({ ...updatedExample });

          response.set('Cache-Control', 'no-cache');

          if (httpStatus < 500 && Array.isArray(header?.fields?.Header)) {
            let isAuthorized = true;

            header?.fields?.Header?.forEach(headerValue => {
              if (!headerValue.optional && headerValue.field && /authorization/i.test(headerValue.field)) {
                const authorization = request.get('authorization');

                if (!authorization) {
                  const authResponseObj = getContentAndType({ ...updatedAuthExample });
                  const forcedStatus = 401;

                  response.append('WWW-Authenticate', 'Spoof response');
                  response.status(forcedStatus);
                  response.set('Content-Type', authResponseObj.contentType);

                  if (mockSettings?.delay > 0) {
                    logger.info(`waiting\t:${forcedStatus} :${authResponseObj.contentType} :${url}`);
                  }

                  setTimeout(() => {
                    logger.info(`response\t:${forcedStatus} :${authResponseObj.contentType} :${url}`);
                    response.end(authResponseObj.content || 'Authorization Required');
                  }, mockSettings?.delay || 0);

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

          if (mockSettings?.delay > 0) {
            logger.info(`waiting\t:${httpStatus} :${responseObj.contentType} :${url}`);
          }

          setTimeout(() => {
            logger.info(`response\t:${httpStatus} :${responseObj.contentType} :${url}`);
            response.send(responseObj.content);
          }, mockSettings?.delay || 0);
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

module.exports = { buildResponse, buildRequestHeaders, getContentAndType, getCustomMockSettings, getExampleResponse };
