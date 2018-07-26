const path = require('path');
const fs = require('fs');
const apidoc = require('apidoc');
const express = require('express');

const apiDocsConfig = {
  src: path.join(__dirname, '../data'),
  dest: path.join(__dirname, '../docs'),
  parsers: {
    apimock: path.join(__dirname, 'api_mock.js')
  }
};
const apiJsonFile = path.join(__dirname, '../docs/api_data.json');
const port = process.env.PORT || 8000;
const apiDocRoute = 'docs';

/**
 * Class LoadApi
 */
class LoadApi {
  /**
   * Create a mock API server from ApiDoc.
   *
   * @param apiDocsConfig {Object}
   * @param apiJsonFile {String}
   * @param port {Number}
   * @param apiDocRoute {String}
   */
  constructor({ apiDocsConfig, apiJsonFile, port, apiDocRoute }) {
    const apiJson = LoadApi.buildApiDocs(apiDocsConfig, apiJsonFile);

    if (apiJson) {
      this.app = express();
      this.setupResponse(apiDocRoute);
      this.setupApi(apiJson, port);
    }
  }

  /**
   * Set http status
   *
   * @param examples {Array}
   * @param response {String}
   * @param type {String}
   * @param url {String}
   * @returns {Object}
   */
  static parseStatus(examples = [], response = null, type = null, url = null) {
    return examples.map(val => {
      const status = parseInt(val.content.split(/\s/)[1], 10) || 200;
      const route = type && url ? `, mismatch for "${type}" route ${url}` : '';

      // ToDo: ApiDoc currently has no "information" or "redirect" distinction, consider plugin
      if (response === 'success' && status >= 400) {
        console.warn(`Success example given with status of ${status}${route}`);
      }

      if (response === 'error' && status < 400) {
        console.warn(`Error example given with status of ${status}${route}`);
      }

      return {
        status,
        ...val
      };
    });
  }

  /**
   * Parse custom mock settings.
   *
   * @param mockSettings {Array}
   * @returns {Object}
   */
  static parseMockSettings(mockSettings = {}) {
    const settings = {};

    if (mockSettings.mock && mockSettings.mock.settings && mockSettings.mock.settings.length) {
      mockSettings.mock.settings.forEach(val => {
        const keys = Object.keys(val || {});
        const key = keys[0] || null;

        switch (key) {
          case 'forceStatus':
            settings.forceStatus = parseInt(val[key], 10);
            break;
          case 'response':
            settings.response = 'response';
            break;
          case 'randomResponse':
            settings.response = 'response';
            settings.reload = true;
            break;
          case 'randomSuccess':
            settings.response = 'success';
            settings.reload = true;
            break;
          case 'randomError':
            settings.response = 'error';
            settings.reload = true;
            break;
        }
      });
    }

    return settings;
  }

  /**
   * Return passed mock mime type and parsed content
   *
   * @param content {String}
   * @param type {String}
   * @returns {{parsedContent: string, parsedType: string}}
   */
  static parseContentAndType(content = '', type = 'text') {
    const parsable = /^HTTP/.test(content);
    let parsedContent = content;
    let parsedType;

    if (parsable) {
      parsedContent = content
        .split(/\n/)
        .slice(1)
        .join('\n');
    }

    switch (type) {
      case 'json':
        parsedType = 'application/json';

        if (parsable) {
          parsedContent = `{ ${content
            .split('{')
            .slice(1)
            .join('{')}`;
        }
        break;
      case 'xml':
      case 'html':
        parsedType = `text/${type}`;
        break;
      case 'svg':
        parsedType = 'image/svg+xml';
        break;
      case 'csv':
        parsedType = 'text/csv';
        break;
      default:
        parsedType = 'text/plain';
        break;
    }

    return { content: parsedContent, type: parsedType };
  }

  /**
   * Compile/build ApiDoc documentation.
   *
   * @param apiDocsConfig {Object}
   * @param apiJsonFile {String}
   * @returns {Object}
   */
  static buildApiDocs(apiDocsConfig = {}, apiJsonFile = null) {
    let result;

    try {
      result = apidoc.createDoc(apiDocsConfig);
    } catch (e) {
      console.error(`ApiDoc error...\t${e.message}`);
    }

    if (result === false) {
      console.error('ApiDoc error...\texiting.');
      return;
    }

    console.info('ApiDoc finished...\tloading JSON');
    return JSON.parse(fs.readFileSync(apiJsonFile, 'utf8'));
  }

  /**
   * Return forced response, or a general example.
   *
   * @param mockSettings {Object}
   * @param exampleObjects {Array}
   * @param successObjects {Array}
   * @param errorObjects {Array}
   * @returns {{type: string, status: number, content: string}}
   */
  static exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects) {
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
  }

  /**
   * Return a 401 specific example.
   *
   * @param errorObjects {Array}
   * @returns {{type: string, status: number, content: string}}
   */
  static parseAuthExample(errorObjects = []) {
    const authExample = errorObjects.filter(val => {
      if (val.status === 401) {
        return true;
      }
    });

    return (authExample && authExample[Math.floor(Math.random() * authExample.length)]) || {};
  }

  /**
   * Open request headers up. Parse OPTIONS or continue
   *
   * @param apiDocRoute {String}
   */
  setupResponse(apiDocRoute) {
    this.app.use(`/${apiDocRoute}`, express.static(apiDocRoute));

    this.app.use((request, response, next) => {
      const hasOrigin = request.headers.origin != null;

      response.set('Access-Control-Allow-Origin', hasOrigin ? request.headers.origin : '*');
      response.set('Access-Control-Allow-Credentials', !hasOrigin);
      response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS, PATCH');

      const requestHeaders = request.headers['access-control-request-headers'];

      if (requestHeaders != null) {
        response.set('Access-Control-Allow-Headers', requestHeaders);
      }

      if (request.method === 'OPTIONS') {
        response.end();
      } else {
        next();
      }
    });
  }

  /**
   * Setup API response.
   *
   * @param apiJson {Array}
   * @param port {Number}
   */
  setupApi(apiJson = [], port = 8000) {
    let routesLoaded = 0;

    apiJson.forEach(value => {
      try {
        const successExamples = (value.success && value.success.examples) || [];
        const errorExamples = (value.error && value.error.examples) || [];
        const mockSettings = LoadApi.parseMockSettings(value);
        const successObjects = LoadApi.parseStatus(
          successExamples,
          'success',
          value.type,
          value.url
        );
        const errorObjects = LoadApi.parseStatus(errorExamples, 'error', value.type, value.url);
        const authExample = LoadApi.parseAuthExample(errorObjects);
        const exampleObjects = successObjects.concat(errorObjects);

        let example;

        if (!mockSettings.reload) {
          example = LoadApi.exampleResponse(
            mockSettings,
            exampleObjects,
            successObjects,
            errorObjects
          );
        }

        this.app[value.type](value.url, (request, response) => {
          if (mockSettings.reload) {
            example = LoadApi.exampleResponse(
              mockSettings,
              exampleObjects,
              successObjects,
              errorObjects
            );
          }

          const httpStatus = example.status > 0 && example.status < 600 ? example.status : 500;
          const { content, type } = LoadApi.parseContentAndType(example.content, example.type);

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
                    const authObj = LoadApi.parseContentAndType(
                      authExample.content,
                      authExample.type
                    );

                    console.info(`Response :401 :${value.type}\t:${value.url}`);

                    response.append('WWW-Authenticate', 'Spoof response');
                    response.status(401);
                    response.set('Content-Type', authObj.type);
                    response.end(authObj.content || 'Authorization Required');
                    return;
                  }
                }
              }
            }
          }

          console.info(`Response :${httpStatus} :${value.type}\t:${value.url}`);

          response.set('Content-Type', type);
          response.status(httpStatus);
          response.send(content);
        });

        routesLoaded += 1;
      } catch (e) {
        console.warn(e.message);
      }
    });

    if (routesLoaded) {
      this.app.listen(port, () =>
        console.info(`JSON finished...\tloaded routes\nMock finished...\tforwarded port ${port}`)
      );
    } else {
      console.info(`Mock waiting...`);
    }
  }
}

new LoadApi({
  apiDocsConfig,
  apiJsonFile,
  port,
  apiDocRoute
});
