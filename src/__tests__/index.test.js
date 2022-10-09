const { execSync } = require('child_process');
const { apiDocMock, setupDocs, setupResponse } = require('../');

describe('ApiDocMock', () => {
  it('should have specific defined properties', () => {
    expect(apiDocMock).toBeDefined();
    expect(setupDocs).toBeDefined();
    expect(setupResponse).toBeDefined();
  });

  it('should have support functions that fail gracefully', () => {
    expect(setupResponse()).toBe(null);
  });

  it('should create a predictable docs output', () => {
    const outputDir = './.docs/predictable';

    const { dir } = generateFixture(
      `/**
         * @api {get} /hello/world/
         * @apiSuccessExample {json} Success-Response:
         *     HTTP/1.1 200 OK
         *     {
         *       "success": "test"
         *     }
         * @apiErrorExample {json} Error-Response:
         *     HTTP/1.1 400 OK
         *     {
         *       "error": "test"
         *     }
         */`,
      { dir: './.fixtures/predictable', filename: 'test.js' }
    );

    const [helloWorld] = setupDocs(dir, outputDir);
    const fileOutput = execSync(`find ${outputDir} -type f -print0 | xargs -0`);

    const cleanUpFileOutput = fileOutput
      .toString()
      .replace(/\s+|\n+|\r+/g, '')
      .replace(new RegExp(`${outputDir}`, 'gi'), `~${outputDir}`)
      .replace(new RegExp(`~${outputDir}/.DS_Store`, 'gi'), '')
      .replace(/\.([a-z0-9]+)\./gi, '*')
      .split('~')
      .sort();

    expect(cleanUpFileOutput).toMatchSnapshot('specific file output');

    expect({
      type: helloWorld.type,
      title: helloWorld.title,
      url: helloWorld.url,
      success: JSON.stringify(helloWorld.success),
      error: JSON.stringify(helloWorld.error),
      version: helloWorld.version,
      name: helloWorld.name
    }).toMatchSnapshot('setupDocs');
  });

  it('should handle additional response content types', () => {
    const outputDir = './.docs/content-types';

    const { dir } = generateFixture(
      `/**
         * @api {get} /hello/world/html.html
         * @apiSuccessExample {html} Success-Response:
         *   HTTP/1.1 200 OK
         *   <!DOCTYPE html>
         *   <html>
         *     <head>hello</head>
         *     <body>world</body>
         *   </html>
         */`,
      { dir: './.fixtures/content-types', filename: 'html.js' }
    );

    generateFixture(
      `/**
         * @api {get} /hello/world/svg.svg
         * @apiSuccessExample {svg} Success-Response:
         *   HTTP/1.1 200 OK
         *   <?xml version="1.0" encoding="utf-8"?>
         *   <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
         *   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="10px" height="10px" viewBox="0 0 10 10">
         *   <g/>
         *   </svg>
         */`,
      { dir: './.fixtures/content-types', filename: 'svg.js', resetDir: false }
    );

    generateFixture(
      `/**
         * @api {get} /hello/world/txt.txt
         * @apiSuccessExample {unknown} Success-Response:
         *   HTTP/1.1 200 OK
         *   hello world
         */`,
      { dir: './.fixtures/content-types', filename: 'text.js', resetDir: false }
    );

    const output = setupDocs(dir, outputDir);

    expect(
      output.map(({ name, success, title, type, url, version }) => ({
        name,
        success,
        title,
        type,
        url,
        version
      }))
    ).toMatchSnapshot('content-types');
  });

  it('should throw an error during testing', () => {
    expect(() => apiDocMock({})).toThrowErrorMatchingSnapshot('error');
  });
});
