const { logger } = require('../logger/configLogger');

/**
 * Return forced response, or a general example.
 *
 * @param {object} mockSettings
 * @param {array} exampleObjects
 * @param {array} successObjects
 * @param {array} errorObjects
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
    example = exampleObjects.filter(val => {
      if (val.status === mockSettings.forceStatus) {
        return true;
      }
    });

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
 * @param {array} errorObjects
 * @returns {{type: string, status: number, content: string}}
 */
const parseAuthExample = (errorObjects = []) => {
  const authExample = errorObjects.filter(val => val.status === 401);

  return (authExample && authExample[Math.floor(Math.random() * authExample.length)]) || {};
};

/**
 * Parse custom mock settings.
 *
 * @param {Object} mock
 * @returns {object}
 */
const parseCustomMockSettings = ({ mock = null }) => {
  const settings = {};

  if (mock && mock.settings && mock.settings.length) {
    mock.settings.forEach(val => {
      const keys = Object.keys(val);
      const key = keys[0] || '';

      switch (key.toLowerCase()) {
        case 'delay':
        case 'delayresponse':
          settings.delay = Number.parseInt(val[key], 10);

          if (Number.isNaN(settings.delay)) {
            settings.delay = 1000;
          }

          break;
        case 'force':
        case 'forcestatus':
        case 'forcedstatus':
          settings.forceStatus = Number.parseInt(val[key], 10);

          if (Number.isNaN(settings.forceStatus)) {
            settings.forceStatus = 200;
          }

          break;
        case 'response':
          settings.response = 'response';
          break;
        case 'random':
        case 'randomresponse':
          settings.response = 'response';
          settings.reload = true;
          break;
        case 'randomsuccess':
          settings.response = 'success';
          settings.reload = true;
          break;
        case 'randomerror':
          settings.response = 'error';
          settings.reload = true;
          break;
      }
    });
  }

  return settings;
};

/**
 * Set http status
 *
 * @param {array} examples
 * @param {string} response
 * @param {string} type
 * @param {string} path
 * @returns {object}
 */
const parseStatus = (examples = [], response = null, type = null, path = null) =>
  examples.map(val => {
    const status = Number.parseInt(val.content.split(/\s/)[1], 10) || 200;
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
      ...val
    };
  });

/**
 * Return passed mock mime type and parsed content
 *
 * @param {string} content
 * @param {string} type
 * @returns {{parsedContent: string, parsedType: string}}
 */
const parseContentAndType = (content = '', type = 'text') => {
  const parsable = /^HTTP/.test(content);
  let parsedContent = content;
  let parsedType;

  if (parsable) {
    parsedContent = content.split(/\n/).slice(1).join('\n');
  }

  switch (type) {
    case 'json':
      parsedType = 'application/json';
      break;
    case 'xml':
    case 'html':
    case 'csv':
      parsedType = `text/${type}`;
      break;
    case 'svg':
      parsedType = 'image/svg+xml';
      break;
    default:
      parsedType = 'text/plain';
      break;
  }

  return { content: parsedContent, type: parsedType };
};

module.exports = {
  exampleResponse,
  parseAuthExample,
  parseCustomMockSettings,
  parseStatus,
  parseContentAndType
};
