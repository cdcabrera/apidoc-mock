const parseApi = require('../parseApi');
const { exampleResponse, parseAuthExample, parseStatus } = parseApi;

describe('ParseApi', () => {
  it('should return specific properties', () => {
    expect(Object.keys(parseApi)).toMatchSnapshot('specific properties');
  });

  it('should force a response, or a general example', () => {
    const mockSettings = {
      forceStatus: 200,
      response: 'response'
    };

    let exampleObjects = [{ status: 200 }, { status: 400 }];
    const successObjects = [];
    const errorObjects = [];

    expect(exampleResponse({ mockSettings, exampleObjects, successObjects, errorObjects })).toMatchSnapshot(
      'exampleResponse.forcedStatus.200'
    );

    mockSettings.forceStatus = 400;

    expect(exampleResponse({ mockSettings, exampleObjects, successObjects, errorObjects })).toMatchSnapshot(
      'exampleResponse.forcedStatus.400'
    );

    mockSettings.forceStatus = null;
    mockSettings.response = 'success';
    exampleObjects = [];

    expect(exampleResponse({ mockSettings, exampleObjects, successObjects, errorObjects })).toMatchSnapshot(
      'exampleResponse.fallback'
    );
  });

  it('return a 401 specific example', () => {
    const errorObjects = [
      {
        status: 400,
        title: 'Error-Response:',
        content: 'HTTP/1.1 400 OK\n{\n  "bad": "hello",\n  "request": "world",\n}',
        type: 'json'
      },
      {
        status: 401,
        title: 'Error-Response:',
        content: 'HTTP/1.1 401 Unauthorized\n{\n  "detail": "Authentication credentials were not provided."\n}',
        type: 'json'
      }
    ];

    expect(parseAuthExample(errorObjects)).toMatchSnapshot('parseAuthExample');
  });

  it('should parse type and status examples', () => {
    const examples = [
      {
        title: 'Success-Response:',
        content: 'HTTP/1.1 200 OK\n{\n  "foo": "hello",\n  "bar": "world"\n}',
        type: 'json'
      }
    ];

    const response = 'success';
    const path = '/hello/world/';

    expect(parseStatus({ examples, response, type: 'post', path })).toMatchSnapshot('parseStatus.success.delete');
    expect(parseStatus({ examples, response, type: 'get', path })).toMatchSnapshot('parseStatus.success.get');
  });
});
