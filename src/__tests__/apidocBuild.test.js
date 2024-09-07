const { setupDocs } = require('../apidocBuild');
const { OPTIONS } = require('../global');

describe('apidocBuild', () => {
  it('should have specific defined properties', () => {
    expect(setupDocs()).toBeDefined();
  });

  it('should fail a build gracefully', () => {
    expect(setupDocs({})).toMatchSnapshot('fail');
  });

  it('should setup api docs and create a predictable output', () => {
    const apiFixture = generateFixture(
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

    const [helloWorld] = setupDocs({ ...OPTIONS, watchPath: [apiFixture.dir] });

    expect({
      ...helloWorld,
      success: JSON.stringify(helloWorld.success),
      error: JSON.stringify(helloWorld.error),
      group: undefined,
      groupTitle: undefined
    }).toMatchSnapshot('setupDocs');
  });

  it('should handle additional response content types', () => {
    const htmlFixture = generateFixture(
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

    const [html, svg] = setupDocs({ ...OPTIONS, watchPath: [htmlFixture.dir] });

    expect({
      ...html,
      success: JSON.stringify(html.success),
      error: JSON.stringify(html.error),
      group: undefined,
      groupTitle: undefined
    }).toMatchSnapshot('html mock');

    expect({
      ...svg,
      success: JSON.stringify(svg.success),
      error: JSON.stringify(svg.error),
      group: undefined,
      groupTitle: undefined
    }).toMatchSnapshot('svg mock');
  });
});
