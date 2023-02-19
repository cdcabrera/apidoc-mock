const { logger } = require('../logger/configLogger');
const { memo } = require('../global');

/**
 * Return forced response, or a general example.
 *
 * @param {object} mockSettings
 * @param {Array} exampleObjects
 * @param {Array} successObjects
 * @param {Array} errorObjects
 * @returns {{type: string, status: number, content: string}}
 */
const exampleResponse = (mockSettings, exampleObjects, successObjects, errorObjects) => {
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
 * Parse custom mock settings.
 *
 * @param {object} params
 * @param {Array} params.settings
 * @returns {{forceStatus: (number|undefined), delay: (number|undefined), reload: (number|undefined),
 *     response: (number|undefined)}}
 */
const parseCustomMockSettings = memo(({ settings = [] } = {}) => {
  const updatedSettings = { delay: undefined, forceStatus: undefined, response: undefined, reload: undefined };

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
 * Set http status
 *
 * @param {object} params
 * @param {Array} params.examples
 * @param {string} params.response
 * @param {string} params.type
 * @param {string} params.path
 * @returns {object}
 */
const parseStatus = memo(({ examples = [], response = null, type = null, path = null } = {}) =>
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
 * Return passed mock mime type and parsed content
 *
 * @param {object} params
 * @param {string} params.content
 * @param {string} params.type
 * @returns {{content: string, contentType: string}}
 */
const parseContentAndType = memo(({ content = '', type = 'text' } = {}) => {
  let updatedContent = content;
  let updatedType;

  if (/^HTTP/.test(content)) {
    updatedContent = content.split(/\n/).slice(1).join('\n');
  }

  switch (type) {
    case 'json':
      updatedType = 'application/json';
      break;
    case 'xml':
    case 'html':
    case 'csv':
      updatedType = `text/${type}`;
      break;
    case 'svg':
      updatedType = 'image/svg+xml';
      break;
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
const getExampleResponse = ({ mockSettings, successExamples = [], errorExamples = [], type, url } = {}) => {
  const successObjects = parseStatus({ examples: successExamples, response: 'success', type, url });
  const errorObjects = parseStatus({ examples: errorExamples, response: 'error', type, url });
  const exampleObjects = successObjects.concat(errorObjects);

  const authExample = parseAuthExample(errorObjects);
  const example = exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects);

  return {
    authExample,
    example
  };
};

module.exports = {
  exampleResponse,
  getExampleResponse,
  parseAuthExample,
  parseCustomMockSettings,
  parseStatus,
  parseContentAndType
};
