const {
  exampleResponse,
  parseAuthExample,
  parseCustomMockSettings,
  parseContentAndType,
  parseStatus
} = require('../parseApi');

describe('ParseApi', () => {
  it('should have specific defined properties', () => {
    expect(exampleResponse).toBeDefined();
    expect(parseAuthExample).toBeDefined();
    expect(parseCustomMockSettings).toBeDefined();
    expect(parseContentAndType).toBeDefined();
    expect(parseStatus).toBeDefined();
  });

  it('should force a response, or a general example', () => {
    const mockSettings = {
      forceStatus: 200,
      response: 'response'
    };

    let exampleObjects = [{ status: 200 }, { status: 400 }];
    const successObjects = [];
    const errorObjects = [];

    expect(exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects)).toMatchSnapshot(
      'exampleResponse.forcedStatus.200'
    );

    mockSettings.forceStatus = 400;

    expect(exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects)).toMatchSnapshot(
      'exampleResponse.forcedStatus.400'
    );

    mockSettings.forceStatus = null;
    mockSettings.response = 'success';
    exampleObjects = [];

    expect(exampleResponse(mockSettings, exampleObjects, successObjects, errorObjects)).toMatchSnapshot(
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

  it('should parse custom mock api settings', () => {
    const customSettings = {
      mock: {
        settings: [
          {
            randomResponse: ''
          },
          {
            delayResponse: 2000
          },
          {
            forceStatus: 401
          }
        ]
      }
    };

    expect(parseCustomMockSettings(customSettings)).toMatchSnapshot('parseCustomMockSettings');
  });

  it('should parse malformed mock api settings and provide fallbacks', () => {
    const randomSettings = {
      mock: {
        settings: [
          {
            delayResponse: 'lorem'
          }
        ]
      }
    };

    expect(parseCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.delayResponse.malformed');

    delete randomSettings.mock.settings[0].delayResponse;
    randomSettings.mock.settings[0].forceStatus = 'ipsum';

    expect(parseCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.forceStatus.malformed');
  });

  it('should parse random mock api settings', () => {
    const randomSettings = {
      mock: {
        settings: [
          {
            randomSuccess: ''
          }
        ]
      }
    };

    expect(parseCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.randomSuccess');

    delete randomSettings.mock.settings[0].randomSuccess;
    randomSettings.mock.settings[0].randomError = '';

    expect(parseCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.randomError');
  });

  it('should parse type and status examples', () => {
    const example = [
      {
        title: 'Success-Response:',
        content: 'HTTP/1.1 200 OK\n{\n  "foo": "hello",\n  "bar": "world"\n}',
        type: 'json'
      }
    ];

    /*
    {
      title: 'Error-Response:',
        content: 'HTTP/1.1 400 OK\n{\n  "bad": "hello",\n  "request": "world",\n}',
      type: 'json'
    },
    {
      title: 'Error-Response:',
        content:
      'HTTP/1.1 401 Unauthorized\n{\n  "detail": "Authentication credentials were not provided."\n}',
        type: 'json'
    }
    */
    const response = 'success';
    const path = '/hello/world/';

    expect(parseStatus(example, response, 'post', path)).toMatchSnapshot('parseStatus.success.delete');
    expect(parseStatus(example, response, 'get', path)).toMatchSnapshot('parseStatus.success.get');
  });

  it('should return a mock mime type and parsed content', () => {
    const content = 'HTTP/1.1 200 OK\n{\n  "foo": "hello",\n  "bar": "world"\n}';
    const type = 'json';

    expect(parseContentAndType(content, type)).toMatchSnapshot('parseContentAndType');
    expect(parseContentAndType(content)).toMatchSnapshot('parseContentAndType.fallback');
  });
});
