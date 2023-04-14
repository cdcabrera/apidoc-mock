const jsonSchemaFaker = require('json-schema-faker');
const Chance = require('chance');
const { parseYmlJson, parsePaths } = require('./parseYmlJson');
const { logger } = require('../logger/configLogger');
const { OPTIONS } = require('../global');
const { join } = require('path');

/**
 * Set internal normalize options for json schema faker
 */
const setResponseExtension = () => {
  const chance = new Chance();

  jsonSchemaFaker.option({
    fillProperties: false,
    reuseProperties: true
  });

  jsonSchemaFaker.define('format', (value, schema) => {
    const minValue = Number.parseInt(schema?.minimum, 10) || 0;
    let randomDate;
    if (/^date/i.test(value)) {
      randomDate = new Date(Date.now() - Math.floor(Math.random() * 30000000000));
    }

    switch (value) {
      case 'date':
        return randomDate.toLocaleDateString('fr-CA', { timeZone: 'UTC' });
      case 'date-time':
        return randomDate.toISOString();
      case 'float':
      case 'double':
        return chance.floating({ min: minValue, max: 100000, fixed: 4 });
      case 'int32':
      case 'int64':
        return chance.integer({ min: minValue, max: 100000 });
    }

    return schema;
  });
};

/**
 * User defined normalize for json schema faker
 *
 * @param {object} params
 * @param {string} params.file
 * @param {object} options
 * @param {string} options.contextPath
 * @returns {Promise<void>}
 */
const setResponseExtensionFile = async ({ file } = {}, { contextPath } = OPTIONS) => {
  let updatedExtendFilePath;
  let extendFile;

  try {
    updatedExtendFilePath = join(contextPath, file);
    extendFile = updatedExtendFilePath.split('/').pop();
    await (async () => {
      const extend = require(updatedExtendFilePath);
      await extend.extend.call(null, { jsonSchemaFaker, chance: new Chance() });
    })();
  } catch (e) {
    logger.error(`x-spec\t:fail "${(extendFile?.length && extendFile) || file}", ${e.message}`);
  }

  logger.info(`x-spec\t:completed :"${extendFile}"`);
};

/**
 * Parse multiple schema formats, and prep responses for being generated with a "schema faker"
 *
 * @param {object} params
 * @param {object} params.requestBody
 * @param {object} params.responses
 * @returns {{json: *[]}}
 */
const parseSpecResponses = ({ requestBody = {}, responses = {} } = {}) => {
  const updatedResponses = { json: [] };

  if (requestBody?.content) {
    const requestBodyJsonResponses = Object.entries(requestBody?.content).filter(([contentType]) =>
      /json/i.test(contentType)
    );
    requestBodyJsonResponses.forEach(([, { schema: jsonSchema } = {}]) => {
      updatedResponses.json.push({ status: 'default', schema: jsonSchema?.properties || jsonSchema });
    });
  }

  Object.entries(responses).forEach(([status, { content = {}, schema = null } = {}]) => {
    const contentJsonResponses = Object.entries(content).filter(([contentType]) => /json/i.test(contentType));

    if (contentJsonResponses.length) {
      contentJsonResponses.forEach(([, responseObj]) => {
        const { schema: jsonSchema = {} } = responseObj || {};
        updatedResponses.json.push({ status, schema: jsonSchema?.properties || jsonSchema });
      });

      const hasEntry = updatedResponses.json.find(({ status: existingStatus }) => existingStatus === status);

      if (!hasEntry || (hasEntry && schema !== null)) {
        updatedResponses.json.push({ status, schema });
      }
    }
  });

  return updatedResponses;
};

/**
 * Set schema faker example response
 *
 * @param {object} params
 * @param {object} params.schema
 * @param {number|string} params.status
 * @param {string} params.extend
 * @returns {Promise<{content: undefined, contentType: string, status: *}>}
 */
const exampleResponse = async ({ schema: valueObj, status: httpStatus, extend: extendFile } = {}) => {
  const example = {
    content: undefined,
    contentType: 'application/json',
    status: httpStatus
  };

  if (valueObj) {
    const updatedHttpStatus = httpStatus || 200;
    const { json: jsonResponses = [] } = parseSpecResponses(valueObj);
    const { schema } = jsonResponses.find(({ status }) => Number.parseInt(status, 10) === updatedHttpStatus) || {};

    if (schema) {
      try {
        if (extendFile) {
          await setResponseExtensionFile({ file: extendFile });
        } else {
          setResponseExtension();
        }

        example.status = updatedHttpStatus;
        example.content = await jsonSchemaFaker.generate(schema);
      } catch (e) {
        logger.error(`example-spec\t:fail, ${e?.message}`);
      }
    }
  }

  return example;
};

/**
 * Aggregate spec responses
 *
 * @param {object} params
 * @param {object} params.mockSettings
 * @param {string} params.type
 * @param {string} params.url
 * @returns {Promise<{authExample: {}, isMissing: boolean, example: {content: undefined, contentType: string, status: *}}>}
 */
const exampleSchemaResponse = async ({ mockSettings, type, url } = {}) => {
  const { paths } = await parseYmlJson({ file: mockSettings.spec });
  const { examplePaths } = await parsePaths({
    paths,
    mockPath: [{ path: url, type }]
  });

  // console.log('>>>>>>>>>>>>>>>>> examplePaths', examplePaths?.[url]?.[type]);
  let updatedStatus;

  if (/\d/.test(mockSettings.forceStatus)) {
    updatedStatus = mockSettings.forceStatus;
  } else {
    const availableLength = examplePaths?.[url]?.[type]?.available?.length;
    const errorLength = examplePaths?.[url]?.[type]?.availableErrors?.length;
    const successLength = examplePaths?.[url]?.[type]?.availableErrors?.length;

    switch (mockSettings.response) {
      case 'response':
        if (availableLength) {
          updatedStatus = examplePaths?.[url]?.[type]?.available[Math.floor(Math.random() * availableLength)];
        }
        break;
      case 'error':
        if (errorLength) {
          updatedStatus = examplePaths?.[url]?.[type]?.availableErrors[Math.floor(Math.random() * errorLength)];
        }
        break;
      case 'success':
      default:
        if (successLength) {
          updatedStatus = examplePaths?.[url]?.[type]?.availableSuccess[Math.floor(Math.random() * successLength)];
        }
        break;
    }
  }

  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>> USE AVAIL status', updatedStatus);

  const example = await exampleResponse({
    schema: examplePaths?.[url]?.[type],
    status: updatedStatus,
    extend: mockSettings.specExtend
  });
  const isMissing = example.content === undefined;

  return {
    isMissing,
    authExample: {},
    example
  };
};

module.exports = {
  exampleResponse,
  exampleSchemaResponse,
  parseSpecResponses,
  setResponseExtension,
  setResponseExtensionFile
};
