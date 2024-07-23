const { logger } = require('./logger');
const { memo } = require('./global');
const { getDocs } = require('./comments');

/**
 * Return a 401 specific example.
 *
 * @param {Array} errorExamples
 * @returns {{type: string, status: number, content: string}|undefined}
 */
const getAuthExampleResponse = (errorExamples = []) => {
  const authExample = errorExamples.filter(({ status }) => status === 401);
  const updatedExample = authExample && authExample[Math.floor(Math.random() * authExample.length)];

  return {
    type: 'text/plain',
    status: 401,
    content: 'Authorization Required',
    ...updatedExample
  };
};

/**
 * Return forced response, or a general example.
 *
 * @param {object} params
 * @param {object} params.mockSettings
 * @param {Array} params.successExamples
 * @param {Array} params.errorExamples
 * @param {object} settings
 * @param {logger} settings.logger
 * @returns {{type: string, status: number, content: string}}
 */
const getExampleResponse = (
  { mockSettings = {}, successExamples = [], errorExamples = [] } = {},
  { logger: aliasLogger = logger } = {}
) => {
  const examples = [...successExamples, ...errorExamples];
  let updatedExample;
  let tempExamples;

  switch (mockSettings.response) {
    case 'response':
      tempExamples = examples;
      break;
    case 'error':
      tempExamples = errorExamples;
      break;
    case 'success':
    default:
      tempExamples = successExamples;
      break;
  }

  if (/\d/.test(mockSettings.forceStatus)) {
    const filteredByStatusExamples = examples.filter(val => val.status === mockSettings.forceStatus);

    if (filteredByStatusExamples.length) {
      updatedExample = filteredByStatusExamples[Math.floor(Math.random() * filteredByStatusExamples.length)];
    } else {
      updatedExample = {
        status: mockSettings.forceStatus,
        content: `${mockSettings.forceStatus} response`
      };
    }
  } else if (tempExamples) {
    updatedExample = tempExamples[Math.floor(Math.random() * tempExamples.length)];
  }

  if (!updatedExample && mockSettings.response === 'error') {
    updatedExample = {
      type: 'text/plain',
      status: 404,
      content: 'Error'
    };
  }

  if (updatedExample?.status >= 600 || updatedExample?.status < 100) {
    aliasLogger.warn(`response\t:500 :status fallback "${updatedExample?.status}" not a valid status`);
    updatedExample.status = 500;
  }

  return {
    type: 'text/plain',
    status: 200,
    content: 'Success',
    ...updatedExample
  };
};

/**
 * Aggregate ApiDoc example responses
 *
 * @param {object} params
 * @param {object} params.mockSettings
 * @param {Array} params.successExamples
 * @param {Array} params.errorExamples
 * @param {object} settings
 * @param {getExampleResponse} settings.getExampleResponse
 * @param {getAuthExampleResponse} settings.getAuthExampleResponse
 * @returns {{authExample: ({type: string, status: number, content: string}|undefined),
 *     example: {type: string, status: number, content: string}}}
 */
const getMockResponseExample = (
  { mockSettings, successExamples, errorExamples } = {},
  {
    getExampleResponse: aliasGetExampleResponse = getExampleResponse,
    getAuthExampleResponse: aliasGetAuthExampleResponse = getAuthExampleResponse
  } = {}
) => ({
  authExample: aliasGetAuthExampleResponse(errorExamples),
  example: aliasGetExampleResponse({ mockSettings, successExamples, errorExamples })
});

/**
 * Get the response callback. Process a server request, response.
 *
 * @param {object} params
 * @param {Array} params.errorExamples
 * @param {object} params.requestHeaders
 * @param {object} params.responseHeaders
 * @param {Array} params.successExamples
 * @param {object} params.mockSettings
 * @param {string} params.url
 * @param {object} settings
 * @param {getMockResponseExample} settings.getMockResponseExample
 * @param {logger} settings.logger
 * @returns {Promise<void>}
 */
const getResponseCallback = (
  { errorExamples, requestHeaders, responseHeaders, successExamples, mockSettings, url } = {},
  { getMockResponseExample: aliasGetMockResponseExample = getMockResponseExample, logger: aliasLogger = logger } = {}
) => {
  const memoGetExampleResponse = memo(aliasGetMockResponseExample, {
    cacheLimit: mockSettings?.reload ? 0 : 25
  });

  return async (request, response) => {
    // Leverage memo caching, use isParams, isQuery to cache bust
    const { example: updatedExample, authExample: updatedAuthExample } = await memoGetExampleResponse({
      mockSettings,
      successExamples: successExamples,
      errorExamples: errorExamples,
      isParams: request?.params,
      isQuery: request?.query
    });

    const httpStatus = updatedExample.status;
    const responseObj = updatedExample;

    let authRequestHeader;
    let authResponseHeader;
    let otherResponseHeaders;

    if (httpStatus < 500 && requestHeaders) {
      const requestHeaderEntries = Object.entries(requestHeaders);
      authRequestHeader = requestHeaderEntries.find(([key]) => /^authorization/i.test(key));
    }

    if (responseHeaders) {
      const responseHeaderEntries = Object.entries(responseHeaders);
      authResponseHeader = responseHeaderEntries.find(([key]) => /www-authenticate/i.test(key));
      otherResponseHeaders = responseHeaderEntries.filter(([key]) => !/www-authenticate/i.test(key));
    }

    response.status(httpStatus);
    response.set('Cache-Control', request.get('cache-control') || 'no-cache');
    response.set('Content-Type', responseObj.type);

    if (authRequestHeader !== undefined) {
      const authorization = request.get('authorization');

      if (!authorization) {
        const authResponseObj = updatedAuthExample;
        const forcedStatus = 401;

        response.append('WWW-Authenticate', authResponseHeader?.value || 'Spoof authentication');
        response.status(forcedStatus);
        response.set('Content-Type', authResponseObj.type);

        if (mockSettings?.delay > 0) {
          aliasLogger.info(`waiting\t:${forcedStatus} :${authResponseObj.type} :${url}`);
        }

        setTimeout(() => {
          aliasLogger.info(`response\t:${forcedStatus} :${authResponseObj.type} :${url}`);
          response.end(authResponseObj.content);
        }, mockSettings?.delay || 0);

        return;
      }
    }

    if (otherResponseHeaders) {
      otherResponseHeaders.forEach(([header, value]) => {
        response.set(header, value);
      });
    }

    if (mockSettings?.delay > 0) {
      aliasLogger.info(`waiting\t:${httpStatus} :${responseObj.type} :${url}`);
    }

    setTimeout(() => {
      aliasLogger.info(`response\t:${httpStatus} :${responseObj.type} :${url}`);
      response.send(responseObj.content);
    }, mockSettings?.delay || 0);
  };
};

/**
 * Build API response
 *
 * @param {object} settings
 * @param {getResponseCallback} settings.getResponseCallback
 * @param {getDocs} settings.getDocs
 * @param {logger} settings.logger
 * @returns {Array}
 */
const buildResponses = ({
  getResponseCallback: aliasGetResponseCallback = getResponseCallback,
  logger: aliasLogger = logger,
  getDocs: aliasParseDocs = getDocs
} = {}) => {
  const parsedComments = aliasParseDocs();
  const appResponses = [];

  parsedComments.forEach(({ type, url, ...comment } = {}) => {
    try {
      appResponses.push({
        type,
        url,
        callback: aliasGetResponseCallback({
          ...comment,
          url
        })
      });
    } catch (e) {
      aliasLogger.warn(`response\t:${e.message}`);
    }
  });

  return appResponses;
};

module.exports = {
  buildResponses,
  getAuthExampleResponse,
  getExampleResponse,
  getMockResponseExample,
  getResponseCallback
};
