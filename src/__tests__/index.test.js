const { execSync } = require('child_process');
const { apiDocMock, setupDocs, setupResponse } = require('../');

describe('ApiDocMock', () => {
  const tempFile = contents => {
    const dir = './.fixtures';
    const stdout = execSync(`mkdir -p ${dir}; echo "${contents}" > ${dir}/test.js`);
    return { dir, stdout };
  };

  it('should have specific defined properties', () => {
    expect(apiDocMock).toBeDefined();
    expect(setupDocs).toBeDefined();
    expect(setupResponse).toBeDefined();
  });

  it('should have support functions that fail gracefully', () => {
    expect(setupResponse()).toBe(null);
  });

  it('should create a predictable docs output', () => {
    const outputDir = './.docs';

    const { dir } = tempFile(`/**
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
     */`);

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

  it('should throw an error during testing', () => {
    expect(() => apiDocMock({})).toThrowErrorMatchingSnapshot('error');
  });
});
