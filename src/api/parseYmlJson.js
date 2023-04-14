const { join } = require('path');
const _cloneDeep = require('lodash.clonedeep');
const SwaggerParser = require('@apidevtools/swagger-parser');
const LRUCache = require('lru-cache');
const { logger } = require('../logger/configLogger');
const { generateHash, joinUrl, memo, OPTIONS } = require('../global');

/**
 * Cache responses with expire. Rolling cache, refreshing delays expire.
 *
 * @param {number} timeout
 * @returns {LRUCache}
 */
const getResponseCache = memo(
  timeout =>
    new LRUCache({
      ttl: timeout,
      max: 25,
      updateAgeOnGet: true
    })
);

/**
 * Update, replace, path parameters
 *
 * @param {string} path
 * @returns {string}
 */
const replacePathParameters = path => {
  const uri = path.replace(/^\/?|\/?$/, '');
  const segments = uri.split('/');

  return `/${segments
    .map(segment => {
      const [firstChar, ...restChar] = segment;

      if (firstChar === '{' && restChar?.pop() === '}') {
        return `:${segment.slice(1, -1)}`;
      }

      return segment;
    })
    .join('/')}`;
};

/**
 * Filter available paths for mock.
 *
 * @param {object} params
 * @param {object} params.paths
 * @param {string} params.mockPath
 * @param {object} settings
 * @param {Function} settings.replacePathParameters
 * @returns {{}|*}
 */
const parsePaths = (
  { paths, mockPath = [] } = {},
  { replacePathParameters: replaceAliasPathParameters = replacePathParameters } = {}
) => {
  const availablePaths = _cloneDeep(paths);
  const updatedAvailablePaths = {};

  // align Swagger, OpenApi to Express param format
  Object.entries(availablePaths).forEach(([key, value]) => {
    const updatedKey = replaceAliasPathParameters(key);
    updatedAvailablePaths[updatedKey] = value;
  });

  if (Array.isArray(mockPath) && mockPath.length) {
    const exclusivePaths = {};

    mockPath.forEach(({ path, type }) => {
      const updatedType = type.toLowerCase();
      if (updatedAvailablePaths?.[path]?.[updatedType]) {
        exclusivePaths[path] ??= {};
        exclusivePaths[path][updatedType] ??= updatedAvailablePaths[path][updatedType];

        exclusivePaths[path][updatedType].available = [];
        exclusivePaths[path][updatedType].availableErrors = [];
        exclusivePaths[path][updatedType].availableSuccess = [];
        exclusivePaths[path][updatedType].availableAuth = [];

        Object.entries(updatedAvailablePaths[path][updatedType]?.responses).forEach(
          ([httpStatus, { content } = {}]) => {
            const updatedHttpStatus = Number.parseInt(httpStatus, 10);

            if (content && !Number.isNaN(updatedHttpStatus) && updatedHttpStatus >= 200 && updatedHttpStatus < 300) {
              exclusivePaths[path][updatedType].available.push(updatedHttpStatus);
              exclusivePaths[path][updatedType].availableSuccess.push(updatedHttpStatus);
            }

            if (content && !Number.isNaN(updatedHttpStatus) && updatedHttpStatus >= 400 && updatedHttpStatus < 600) {
              exclusivePaths[path][updatedType].available.push(updatedHttpStatus);
              exclusivePaths[path][updatedType].availableErrors.push(updatedHttpStatus);
            }

            if (
              content &&
              !Number.isNaN(updatedHttpStatus) &&
              (updatedHttpStatus === 401 || updatedHttpStatus === 403)
            ) {
              exclusivePaths[path][updatedType].availableAuth.push(updatedHttpStatus);
            }
          }
        );
      }
    });

    logger.info(`parse-paths\t:completed ${(Object.keys(exclusivePaths).length < 1 && ':no available paths') || ''}`);

    return {
      examplePaths: exclusivePaths
    };
  }

  logger.info('parse-paths\t:completed path filtering.');

  return {
    examplePaths: updatedAvailablePaths
  };
};

/**
 * Parse local, remote, swagger/openapi docs then return a listing of file output references, and content.
 *
 * @param {object} params
 * @param {string} params.file
 * @param {object} options CLI options
 * @param {string} options.contextPath
 * @param {string} options.expireSpec
 * @param {object} settings
 * @param {Function} settings.generateHash
 * @param {string} settings.parseMethod
 * @param {Function} settings.getResponseCache Returns a LRUCache object
 * @returns {Promise<{files: Array<{id: string, output: (string|undefined), source: string, content: object}>, paths: {}}>}
 */
const parseYmlJson = async (
  { file } = {},
  { contextPath, expireSpec } = OPTIONS,
  {
    generateHash: generateAliasHash = generateHash,
    parseMethod = 'dereference',
    getResponseCache: getAliasResponseCache = getResponseCache
  } = {}
) => {
  const isRemoteFile = joinUrl(file);
  let updatedSourceFilePath = file;
  let responseCache;
  let cachedResponse;

  if (isRemoteFile) {
    responseCache = getAliasResponseCache(expireSpec);
    cachedResponse = responseCache.get(file);
  } else {
    updatedSourceFilePath = join(contextPath, updatedSourceFilePath);
  }

  const sourceFile = updatedSourceFilePath.split('/').pop();

  if (cachedResponse) {
    logger.info(`parse-spec\t:cached "${sourceFile}"`);
    return cachedResponse;
  }

  const responses = [];
  let jsonOutput;

  try {
    const parser = new SwaggerParser();
    jsonOutput = await parser[parseMethod](updatedSourceFilePath);
    responses.push({
      id: generateAliasHash(jsonOutput),
      content: jsonOutput,
      source: updatedSourceFilePath
    });
  } catch (e) {
    logger.warn(
      `parse-spec\t:output "${(sourceFile?.length && sourceFile) || updatedSourceFilePath || 'JSON'}", ${e.message}`
    );

    const response = {
      files: [],
      paths: {}
    };
    if (isRemoteFile) {
      responseCache.set(file, response);
    }
    return response;
  }

  if (!jsonOutput) {
    logger.warn(`parse-spec\t:failed parse "${sourceFile}"`);
  }

  const uniqueResponses = responses.reduce((accumulator, currentValue = {}) => {
    const updatedAccumulator = { ...accumulator };
    updatedAccumulator[currentValue.id] ??= currentValue;
    return updatedAccumulator;
  }, {});

  const updatedPaths = {};
  Object.values(uniqueResponses).forEach(({ content, paths }) => {
    Object.entries(paths || content?.paths || {}).forEach(([key, value]) => {
      updatedPaths[key] = { ...updatedPaths[key], ...value };
    });
  });

  logger.info(`parse-spec\t:success :"${sourceFile}" ${(isRemoteFile && `:expire ${expireSpec} ms`) || ''}`);
  const response = {
    files: Object.values(uniqueResponses),
    paths: updatedPaths
  };

  if (isRemoteFile) {
    responseCache.set(file, response);
  }

  return response;
};

module.exports = {
  getResponseCache,
  parsePaths,
  parseYmlJson
};
