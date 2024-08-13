const comments = require('../comments');

//   "generateApiData": [Function],
//   "getCommentContentStatusType": [Function],
//   "parseCommentTag": [Function],
//   "readFilesGetComments": [Function],

describe('comments', () => {
  it('should return specific properties', () => {
    expect(comments).toMatchSnapshot('specific properties');
  });

  it('should filter for ignored headers', () => {
    expect({
      default: comments.filterForIgnoredHeaders(),
      basic: comments.filterForIgnoredHeaders({ 'access-control-lorem': 'ipsum', dolor: 'sit' })
    }).toMatchSnapshot('filtered headers');
  });

  it('should parse comment header examples', () => {
    const mockFunction = jest.fn();
    const mockLogger = {
      warn: mockFunction
    };

    expect({
      default: comments.parseCommentHeaderExample(),
      basic: comments.parseCommentHeaderExample({
        content: '{ "Access-control-lorem": "ipsum", "dolor": "" }',
        type: 'request'
      }),
      malformedStringJSON: comments.parseCommentHeaderExample(
        {
          content: '{ dolor: "sit" }'
        },
        { logger: mockLogger }
      ),
      malformedObjectJSON: comments.parseCommentHeaderExample(
        {
          content: { dolor: 'sit' }
        },
        { logger: mockLogger }
      )
    }).toMatchSnapshot('parsed headers');

    expect(mockFunction.mock.calls.map(mock => mock.map(call => call.split(/},\s/)[0]))).toMatchSnapshot(
      'malformed string JSON'
    );
  });

  it('should parse comment content, status, and type', () => {
    const mockFunction = jest.fn();
    const mockLogger = {
      warn: mockFunction
    };

    expect({
      default: comments.parseCommentContentStatusType(),
      basic: comments.parseCommentContentStatusType({
        content: `HTTP/1.1 400\n{ "bad": "request example" }`
      }),
      fallbackStatus: comments.parseCommentContentStatusType({
        content: `HTTP/1.1\n{ "lorem": "ipsum" }`,
        status: 201
      }),
      withErrorStatusAndSuccessExample: comments.parseCommentContentStatusType(
        {
          content: `HTTP/1.1 400\n{ "lorem": "ipsum", "dolor": "sit", "hello": "world" }`,
          isSuccessExample: true
        },
        {
          logger: mockLogger
        }
      ),
      withSuccessStatusAndErrorExample: comments.parseCommentContentStatusType(
        {
          content: `HTTP/1.1 200\n{ "lorem": "ipsum", "dolor": "sit", "hello": "world" }`,
          isSuccessExample: false
        },
        {
          logger: mockLogger
        }
      ),
      existingContentType: comments.parseCommentContentStatusType({
        content: `HTTP/1.1 200\n{ lorem: "ipsum"}`,
        type: 'application/lorem+ipsum'
      })
    }).toMatchSnapshot('parsed content');

    expect(mockFunction.mock.calls).toMatchSnapshot('mismatched status codes');

    expect(
      ['zip', 'gzip', 'json', 'xml', 'html', 'csv', 'css', 'svg', 'txt', 'lorem'].map(type => ({
        type,
        output: comments.parseCommentContentStatusType({
          type
        })
      }))
    ).toMatchSnapshot('content types');
  });

  it('should normalize response behavior with mock settings', () => {
    expect({
      default: comments.normalizeMockSettings(),
      delayNumber: comments.normalizeMockSettings({ delay: 500 }),
      forceNumber: comments.normalizeMockSettings({ Force: 418 }),
      response: comments.normalizeMockSettings({ response: 'lorem ipsum' }),
      random: comments.normalizeMockSettings({ random: 'dolor sit' }),
      randomSuccess: comments.normalizeMockSettings({ RANDOMSUCCESS: 'dolor sit' }),
      randomError: comments.normalizeMockSettings({ randomError: 'dolor sit' })
    }).toMatchSnapshot('normalized');
  });

  it('should parse a comment tag', () => {
    expect({
      default: comments.parseCommentTag()
    }).toMatchSnapshot('empty');

    expect({
      default: comments.parseCommentTag({ tag: 'api', name: '/lorem/ipsum' }),
      basic: comments.parseCommentTag({ tag: 'api', name: '/lorem/ipsum', type: 'POST' })
    }).toMatchSnapshot('api');

    expect({
      default: comments.parseCommentTag({ tag: 'apiMock' }),
      basic: comments.parseCommentTag({ tag: 'apiMock', type: 'FORCE', name: 404 }),
      withName: comments.parseCommentTag({ tag: 'apiMock', type: 'FORCE', name: 'lorem-ipsum' })
    }).toMatchSnapshot('apiMock');

    expect({
      default: comments.parseCommentTag({ tag: 'apiHeader' }),
      basic: comments.parseCommentTag({ tag: 'apiHeader', name: 'Lorem-Ipsum' }),
      withType: comments.parseCommentTag({ tag: 'apiHeader', name: 'Lorem-Ipsum', type: 'request' }),
      withDescription: comments.parseCommentTag({ tag: 'apiHeader', name: 'Lorem-Ipsum', description: 'Dolor sit' })
    }).toMatchSnapshot('apiHeader');

    expect({
      default: comments.parseCommentTag({ tag: 'apiHeaderExample' }),
      basic: comments.parseCommentTag({
        tag: 'apiHeaderExample',
        name: 'Lorem-Ipsum',
        type: 'REQUEST',
        description: 'Dolor sit',
        source: [{ tokens: { description: '{ "DolorSit": "mock header value" }' } }]
      }),
      withMalformedJSON: comments.parseCommentTag({
        tag: 'apiHeaderExample',
        name: 'Lorem-Ipsum',
        type: 'RESPONSE',
        description: 'Dolor sit',
        source: [{ tokens: { description: '{ DolorSit: "mock header value", "lorem-ipsum": "mock header value" }' } }]
      }),
      withMissingSource: comments.parseCommentTag({
        tag: 'apiHeaderExample',
        name: 'Lorem-Ipsum',
        type: 'RESPONSE',
        description: 'Dolor sit',
        source: [{ tokens: undefined }]
      })
    }).toMatchSnapshot('apiHeaderExample');

    expect({
      default: comments.parseCommentTag({ tag: 'apiSuccessExample' }),
      basic: comments.parseCommentTag({
        tag: 'apiSuccessExample',
        type: 'json',
        name: '200',
        source: [{ tokens: { description: '{ "DolorSit": "mock response value" }' } }]
      }),
      withMissingStatus: comments.parseCommentTag({
        tag: 'apiSuccessExample',
        type: 'json',
        source: [{ tokens: { description: '{ "DolorSit": "mock response value" }' } }]
      }),
      withMalformedSource: comments.parseCommentTag({
        tag: 'apiSuccessExample',
        type: 'json',
        name: '200',
        source: [{ tokens: {} }]
      })
    }).toMatchSnapshot('apiSuccessExample');

    expect({
      default: comments.parseCommentTag({ tag: 'apiErrorExample' }),
      basic: comments.parseCommentTag({
        tag: 'apiErrorExample',
        type: 'json',
        name: '400',
        source: [{ tokens: { description: '{ "DolorSit": "mock response value" }' } }]
      }),
      withMissingStatus: comments.parseCommentTag({
        tag: 'apiErrorExample',
        type: 'json',
        source: [{ tokens: { description: '{ "DolorSit": "mock response value" }' } }]
      })
    }).toMatchSnapshot('apiErrorExample');
  });

  it('should attempt to generate a basic api spec', () => {
    const mockFunction = jest.fn();
    const mockLogger = {
      warn: mockFunction
    };

    expect({
      default: comments.generateApiSpec(),
      basic: comments.generateApiSpec([
        {
          tags: [
            [
              {
                tag: 'api',
                type: 'post',
                name: '/dolor/sit'
              },
              {
                tag: 'apiMock',
                type: 'force',
                name: '500'
              },
              {
                tag: 'apiHeader',
                name: 'Authorization',
                description: 'Dolor sit token'
              },
              {
                tag: 'apiHeaderExample',
                type: 'REQUEST',
                source: [{ tokens: { description: '{ "Access-control-mock": "lorem-ipsum", "Hello": "world" }' } }]
              },
              {
                tag: 'apiHeaderExample',
                type: 'response',
                source: [{ tokens: { description: '{ "Mock-response-header": "lorem-ipsum" }' } }]
              },
              {
                tag: 'apiHeaderExample',
                source: [{ tokens: {} }]
              },
              {
                tag: 'apiSuccessExample',
                type: 'json',
                name: '200',
                source: [{ tokens: { description: '{ "DolorSit": "mock response value" }' } }]
              },
              {
                tag: 'apiErrorExample',
                type: 'json',
                name: '400',
                source: [{ tokens: { description: '{ "DolorSit": "mock response value" }' } }]
              }
            ]
          ],
          file: './lorem-ipsum.txt'
        }
      ]),
      missingPath: comments.generateApiSpec(
        [
          {
            tags: [
              [
                {
                  tag: 'api',
                  type: 'post'
                }
              ]
            ],
            file: './lorem-ipsum.txt'
          }
        ],
        { logger: mockLogger }
      )
    }).toMatchSnapshot('generated spec');

    expect(mockFunction.mock.calls).toMatchSnapshot('missing api path');
  });

  it('should attempt to read files and get comments', () => {
    /*
    const mockFunction = jest.fn();
    const mockLogger = {
      error: mockFunction,
      warn: mockFunction
    };
    */

    const basicFixture = generateFixture(
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
      { dir: './.fixtures/comments', filename: 'test.txt' }
    );

    expect({
      default: comments.readFilesGetComments(),
      basic: comments.readFilesGetComments([basicFixture.path])
    }).toMatchSnapshot('read files');

    // expect(mockFunction.mock.calls).toMatchSnapshot('logger');
  });

  it('should attempt to generate an api', () => {
    expect({
      default: comments.getDocs(),
      filesNoLength: comments.getDocs({ files: [] })
    }).toMatchSnapshot('no files');

    const mockFunction = jest.fn();
    comments.getDocs(
      { files: ['lorem/ipsum.txt'] },
      { generateApiSpec: mockFunction, readFilesGetComments: mockFunction }
    );
    expect(mockFunction).toHaveBeenCalledTimes(2);
  });
});
