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

    const [helloWorld] = setupDocs(dir, './.docs');

    expect({
      type: helloWorld.type,
      url: helloWorld.url,
      success: JSON.stringify(helloWorld.success),
      error: JSON.stringify(helloWorld.error)
    }).toMatchSnapshot('setupDocs');
  });

  it('should throw an error during testing', () => {
    try {
      apiDocMock({});
    } catch (e) {
      expect(e).toMatchSnapshot('error');
    }
  });
});
