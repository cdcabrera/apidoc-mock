const { apiDocMock, setupResponse } = require('../');
const { OPTIONS } = require('../global');

describe('ApiDocMock', () => {
  it('should have specific defined properties', () => {
    expect(apiDocMock).toBeDefined();
    expect(setupResponse).toBeDefined();
  });

  it('should have support functions that fail gracefully', () => {
    expect(setupResponse()).toBe(null);
  });

  it('should throw an error during testing', async () => {
    const func = async () => apiDocMock();
    await expect(func).rejects.toThrow('Server failed to load');
  });

  it('should generate an api response from annotations', async () => {
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
      { dir: './.fixtures/apiDocMock', filename: 'apiDocMock.js' }
    );

    const { mockClear } = mockObjectProperty(OPTIONS, {
      watchPath: [apiFixture.dir],
      docsPath: 'lorem-ipsum'
    });

    const { apiJson, ...rest } = await apiDocMock();
    expect({
      apiJson: JSON.stringify(
        apiJson.map(({ error, success }) => ({ errorExamples: error?.examples, successExamples: success?.examples })),
        null,
        2
      ),
      ...rest
    }).toMatchSnapshot('apiDocMock, parsed');

    mockClear();
  });
});
