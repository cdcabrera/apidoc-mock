const { readFileSync } = require('fs');
const { parse: commentParser } = require('comment-parser');
const { logger } = require('./logger');
const { ignoredHeaders, memo, OPTIONS, truncate } = require('./global');

/**
 * Filter object properties for ignored headers, remove them.
 *
 * @property {filterForIgnoredHeaders} memo Expose a memoized version of the parent function. Helpful in testing.
 * @param {{ [key: string]: string }|undefined} headerObj
 * @param {object} settings
 * @param {Array<string>} settings.headerFilters
 * @returns {{ [key: string]: string }|undefined}
 */
const filterForIgnoredHeaders = (headerObj, { headerFilters = ignoredHeaders } = {}) => {
  let updatedHeaders;

  if (headerObj !== undefined) {
    updatedHeaders ??= {};

    Object.keys(headerObj).forEach(key => {
      if (!headerFilters.find(filter => new RegExp(`^${filter}`, 'i').test(key))) {
        updatedHeaders[key] = headerObj[key];
      }
    });
  }

  return updatedHeaders;
};

/**
 * Expose a memoized version of the parent function
 *
 * @type {filterForIgnoredHeaders}
 */
filterForIgnoredHeaders.memo = memo(filterForIgnoredHeaders, { cacheLimit: 25 });

/**
 * Return a parsed header example
 *
 * @property {parseCommentHeaderExample} memo Expose a memoized version of the parent function. Helpful in testing.
 * @param {object} params
 * @param {object|string|undefined} params.content
 * @param {string|undefined} params.type
 * @param {object} settings
 * @param {filterForIgnoredHeaders} settings.filterForIgnoredHeaders
 * @param {logger} settings.logger
 * @param {truncate} settings.truncate
 * @returns {{ [key: string]: string }|{}}
 */
const parseCommentHeaderExample = (
  { content, type } = {},
  {
    filterForIgnoredHeaders: aliasFilterForIgnoredHeaders = filterForIgnoredHeaders.memo,
    logger: aliasLogger = logger,
    truncate: aliasTruncate = truncate
  } = {}
) => {
  let updatedHeaderContent;

  try {
    updatedHeaderContent = JSON.parse(content);
  } catch (e) {
    if (typeof content === 'string') {
      aliasLogger.warn(
        `file-parse\t:JSON :ignoring malformed "@apiHeaderExample" ${aliasTruncate(content.replace(/\n/g, ' '), { limit: 20 })}, ${e.message}`
      );
      updatedHeaderContent = undefined;
    } else {
      updatedHeaderContent = content;
    }
  }

  return {
    content: aliasFilterForIgnoredHeaders(updatedHeaderContent),
    type: (/^(request|response)$/i.test(type) && type) || undefined
  };
};

/**
 * Expose a memoized version of the parent function
 *
 * @type {parseCommentHeaderExample}
 */
parseCommentHeaderExample.memo = memo(parseCommentHeaderExample, { cacheLimit: 25 });

/**
 * Return passed mock mime type and parsed content
 *
 * @property {parseCommentContentStatusType} memo Expose a memoized version of the parent function. Helpful in testing.
 * @param {object} params
 * @param {string} params.content
 * @param {number} params.status
 * @param {boolean|undefined} params.isSuccessExample
 * @param {string|undefined} params.type
 * @param {object} settings
 * @param {logger} settings.logger
 * @param {truncate} settings.truncate
 * @returns {{content: string, contentType: string}}
 */
const parseCommentContentStatusType = (
  { content = '', status = 200, type: contentType, isSuccessExample } = {},
  { logger: aliasLogger = logger, truncate: aliasTruncate = truncate } = {}
) => {
  let updatedContent = content;
  let updatedStatus = status;
  let updatedType;

  if (/^HTTP/.test(content)) {
    updatedContent = content.split(/\n/).slice(1).join('\n');
    const parsedStatus = Number.parseInt(content?.split(/\s/)?.[1], 10);

    if (parsedStatus && !Number.isNaN(parsedStatus)) {
      updatedStatus = parsedStatus;
    }
  }

  if ((isSuccessExample && updatedStatus >= 400) || (!isSuccessExample && updatedStatus < 400)) {
    aliasLogger.warn(
      `file-parse\t:${updatedStatus} :${(isSuccessExample && 'success') || 'error'} :mismatched status and example, ${aliasTruncate(updatedContent.replace(/\n/g, ''), { limit: 20 })}`
    );
  }

  /**
   * Ignore content types that already contain a `/`
   */
  if (contentType?.split('/')?.length > 1) {
    return {
      content: updatedContent,
      status: updatedStatus,
      type: contentType
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
    status: updatedStatus,
    type: updatedType
  };
};

/**
 * Expose a memoized version of the parent function
 *
 * @type {parseCommentContentStatusType}
 */
parseCommentContentStatusType.memo = memo(parseCommentContentStatusType, { cacheLimit: 25 });

/**
 * Normalize custom mock settings
 *
 * @property {normalizeMockSettings} memo Expose a memoized version of the parent function. Helpful in testing.
 * @param {object} mock
 * @returns {{forceStatus: (number|undefined), delay: (number|undefined), reload: (number|undefined),
 *     response: (number|undefined)}}
 */
const normalizeMockSettings = (mock = {}) => {
  const updatedSettings = {};

  Object.entries(mock).forEach(([key, value]) => {
    switch (key.toLowerCase()) {
      case 'delay':
      case 'delayresponse':
        updatedSettings.delay = value;
        break;
      case 'force':
      case 'forcestatus':
      case 'forcedstatus':
        updatedSettings.forceStatus = value;
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
};

/**
 * Expose a memoized version of the parent function
 *
 * @type {normalizeMockSettings}
 */
normalizeMockSettings.memo = memo(normalizeMockSettings, { cacheLimit: 25 });

/**
 * Parse broken out comments from parser
 *
 * @param {object} params Parsed comment breakout into parts
 * @param {string} params.tag
 * @param {string} params.name
 * @param {string} params.type
 * @param {string} params.description
 * @param {Array<{ tokens: { description: string } }>} params.source The original comment source
 * @returns {{ type?: string, url?: string, mock?: { [key: string]: unknown }, header?: { field: string, content: string },
 *     headerExample?: { type: string, content: string }, successExample?: { type: string, content: string },
 *     errorExample?: { type: string, content: string } }}
 */
const parseCommentTag = ({ tag, name, type, description, source } = {}) => {
  const apiTagObj = {};

  switch (tag?.toLowerCase()) {
    case 'api':
      apiTagObj.type = type?.toLowerCase() || 'get';
      apiTagObj.url = name;
      break;
    case 'apimock':
      if (type) {
        apiTagObj.mock = {
          [type?.toLowerCase()]: (/^[0-9]+$/g.test(name) && Number.parseInt(name, 10)) || name
        };
      }
      break;
    case 'apiheader':
      if (name) {
        apiTagObj.headerExample = {
          type: type?.toLowerCase(),
          content: {
            [name]: description || ''
          }
        };
      }
      break;
    case 'apiheaderexample':
      apiTagObj.headerExample = {
        type: type?.toLowerCase(),
        content: source
          ?.map(({ tokens }) => tokens?.description)
          ?.filter(value => value !== '')
          ?.join('\n')
      };
      break;
    case 'apisuccessexample':
    case 'apierrorexample': {
      const isSuccessExample = /^apisuccessexample$/i.test(tag);

      apiTagObj[(isSuccessExample && 'successExample') || 'errorExample'] = {
        isSuccessExample,
        type: type?.toLowerCase() || 'txt',
        status: (/^[0-9]+$/g.test(name) && Number.parseInt(name, 10)) || undefined,
        content: source
          ?.map(({ tokens }) => tokens?.description)
          ?.filter(value => value !== '')
          ?.join('\n')
      };
      break;
    }
  }

  return apiTagObj;
};

/**
 * Generate API data spec for processing by Express
 *
 * @param {Array<{ tags: Array, file: string }>} fileComments
 * @param {object} settings
 * @param {logger} settings.logger
 * @param {normalizeMockSettings} settings.normalizeMockSettings
 * @param {parseCommentContentStatusType} settings.parseCommentContentStatusType
 * @param {parseCommentHeaderExample} settings.parseCommentHeaderExample
 * @param {parseCommentTag} settings.parseCommentTag
 * @returns {{ type: string, url: string, mock: object, header: { field: string, type: string },
 *     successExample: { type: string, content: string }, errorExample: { type: string, content: string } }}
 */
const generateApiSpec = (
  fileComments = [],
  {
    logger: aliasLogger = logger,
    normalizeMockSettings: aliasNormalizeMockSettings = normalizeMockSettings.memo,
    parseCommentContentStatusType: aliasParseCommentContentStatusType = parseCommentContentStatusType.memo,
    parseCommentHeaderExample: aliasParseCommentHeaderExample = parseCommentHeaderExample.memo,
    parseCommentTag: aliasParseCommentTag = parseCommentTag
  } = {}
) => {
  const apiData = [];

  fileComments.forEach(({ tags, file }) => {
    tags.forEach(block => {
      let updatedBlock;

      block.forEach(tag => {
        const { successExample, errorExample, headerExample, mock, ...rest } = aliasParseCommentTag(tag);
        updatedBlock = {
          ...updatedBlock,
          ...rest
        };

        if (headerExample) {
          const updatedHeaderExample = aliasParseCommentHeaderExample(headerExample);
          if (updatedHeaderExample.content) {
            switch (updatedHeaderExample.type) {
              case 'response':
                updatedBlock.responseHeaders ??= {};
                Object.assign(updatedBlock.responseHeaders, updatedHeaderExample.content);
                break;
              case 'request':
              default:
                updatedBlock.requestHeaders ??= {};
                Object.assign(updatedBlock.requestHeaders, updatedHeaderExample.content);
                break;
            }
          }
        }

        if (mock) {
          updatedBlock.mockSettings ??= {};
          Object.assign(updatedBlock.mockSettings, aliasNormalizeMockSettings(mock));
        }

        if (successExample) {
          updatedBlock.successExamples ??= [];
          updatedBlock.successExamples.push(aliasParseCommentContentStatusType(successExample));
        }

        if (errorExample) {
          updatedBlock.errorExamples ??= [];
          updatedBlock.errorExamples.push(aliasParseCommentContentStatusType(errorExample));
        }
      });

      if (updatedBlock?.url) {
        apiData.push(updatedBlock);
      } else {
        aliasLogger.warn(`file-parse\t:missing mock path after "@api" comment in ${file}`);
      }
    });
  });

  return apiData;
};

/**
 * Read a list of files, return comment content.
 *
 * @param {Array<string>} files
 * @param {object} settings
 * @param {logger} settings.logger
 * @returns {Array<{ tags: Array, file: string }>}
 */
const readFilesGetComments = (files = [], { logger: aliasLogger = logger } = {}) =>
  files
    .map(file => {
      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch (error) {
        aliasLogger.error(`file-read\t:${file}\n${error.message}\n`);
      }
      return { content, file };
    })
    .filter(({ content }) => content !== undefined)
    .map(({ content, file }) => {
      const filteredComments = [];
      let parsedComments;

      try {
        parsedComments = commentParser(content);
      } catch (error) {
        aliasLogger.error(`file-parse\t:${file}, ${error.message}`);
      }

      if (Array.isArray(parsedComments)) {
        parsedComments.forEach(({ tags, problems }) => {
          if (problems?.length) {
            aliasLogger.warn(`file-parse\t:${file}\n${JSON.stringify(parsedComments.problems, null, 2)}\n`);
            return;
          }

          filteredComments.push(tags);
        });
      }

      return { tags: filteredComments, file };
    });

/**
 * Build api documentation.
 *
 * @param {object} options
 * @param {string[]} options.files
 * @param {object} settings
 * @param {generateApiSpec} settings.generateApiSpec
 * @param {readFilesGetComments} settings.readFilesGetComments
 * @returns {*|{}|null}
 */
const getDocs = (
  { files } = OPTIONS,
  {
    generateApiSpec: aliasGenerateApiSpec = generateApiSpec,
    readFilesGetComments: aliasReadFilesGetComments = readFilesGetComments
  } = {}
) => {
  if (!Array.isArray(files) || !files?.length) {
    return [];
  }

  return aliasGenerateApiSpec(aliasReadFilesGetComments(files));
};

module.exports = {
  filterForIgnoredHeaders,
  generateApiSpec,
  normalizeMockSettings,
  parseCommentContentStatusType,
  parseCommentHeaderExample,
  parseCommentTag,
  getDocs,
  readFilesGetComments
};
