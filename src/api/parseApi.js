const { logger } = require('../logger/configLogger');
const { memo } = require('../global');

/**
 * Return a 401 specific example.
 *
 * @param {Array} errorObjects
 * @returns {{type: string, status: number, content: string}}
 */
const parseAuthExample = memo((errorObjects = []) => {
  const authExample = errorObjects.filter(val => val.status === 401);

  return (authExample && authExample[Math.floor(Math.random() * authExample.length)]) || {};
});

/**
 * Set http status
 *
 * @param {object} params
 * @param {Array} params.examples
 * @param {string} params.response
 * @param {string} params.type
 * @param {string} params.path
 * @returns {object}
 */
const parseStatus = memo(({ examples, response = null, type = null, path = null } = {}) =>
  (examples || []).map(example => {
    const status = Number.parseInt(example?.content?.split(/\s/)?.[1], 10) || 200;
    const route = type && path ? `mismatch for "${type}" route ${path}` : '';

    // ToDo: ApiDoc currently has no "information" or "redirect" distinction, consider plugin
    if (response === 'success' && status >= 400) {
      logger.warn(`example\t:${status} :success :${route}`);
    }

    if (response === 'error' && status < 400) {
      logger.warn(`example\t:${status} :error :${route}`);
    }

    return {
      status,
      ...example
    };
  })
);

/**
 * Return forced response, or a general example.
 *
 * @param {object} params
 * @param {object} params.mockSettings
 * @param {Array} params.exampleObjects
 * @param {Array} params.successObjects
 * @param {Array} params.errorObjects
 * @returns {{type: string, status: number, content: string}}
 */
const exampleResponse = ({ mockSettings = {}, exampleObjects, successObjects, errorObjects } = {}) => {
  let example;
  let tempObjects;

  switch (mockSettings.response) {
    case 'response':
      tempObjects = exampleObjects;
      break;
    case 'error':
      tempObjects = errorObjects;
      break;
    case 'success':
    default:
      tempObjects = successObjects;
      break;
  }

  if (/\d/.test(mockSettings.forceStatus)) {
    example = exampleObjects.filter(val => val.status === mockSettings.forceStatus);

    if (example.length) {
      example = example[Math.floor(Math.random() * example.length)];
    } else {
      example = {
        type: 'text',
        status: mockSettings.forceStatus,
        content: `Missing example for ${mockSettings.forceStatus} status`
      };
    }
  } else if (tempObjects) {
    example = tempObjects[Math.floor(Math.random() * tempObjects.length)];
  }

  if (!example) {
    switch (mockSettings.response) {
      case 'error':
        example = {
          type: 'text',
          status: 404,
          content: 'Error'
        };
        break;
      case 'response':
      case 'success':
      default:
        example = {
          type: 'text',
          status: 200,
          content: 'Success'
        };
        break;
    }
  }

  return example;
};

/**
 * Aggregate ApiDoc example responses
 *
 * @param {object} params
 * @param {object} params.mockSettings
 * @param {Array} params.successExamples
 * @param {Array} params.errorExamples
 * @param {string} params.type
 * @param {string} params.url
 * @returns {{authExample: {type: string, status: number, content: string},
 *     example: {type: string, status: number, content: string}}}
 */
const exampleApiDocResponse = ({ mockSettings, successExamples, errorExamples, type, url } = {}) => {
  const successObjects = parseStatus({ examples: successExamples, response: 'success', type, url });
  const errorObjects = parseStatus({ examples: errorExamples, response: 'error', type, url });
  const exampleObjects = successObjects.concat(errorObjects);

  const authExample = parseAuthExample(errorObjects);
  const example = exampleResponse({ mockSettings, exampleObjects, successObjects, errorObjects });

  return {
    authExample,
    example
  };
};

module.exports = {
  exampleApiDocResponse,
  exampleResponse,
  parseAuthExample,
  parseStatus
};
