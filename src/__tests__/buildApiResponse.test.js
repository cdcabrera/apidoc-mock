const buildApiResponse = require('../buildApiResponse');
const { buildRequestHeaders, buildResponse, getContentAndType, getCustomMockSettings } = buildApiResponse;

describe('buildApiResponse', () => {
  it('should return specific properties', () => {
    expect(Object.keys(buildApiResponse)).toMatchSnapshot('specific properties');
  });

  it('should build specific headers', () => {
    const mockRequest = {
      headers: {}
    };
    const mockResponse = {
      set: (key, value) => (mockRequest.headers[key] = value),
      end: jest.fn().mockName('end')
    };
    const mockNext = jest.fn().mockName('next');

    buildRequestHeaders(mockRequest, mockResponse, mockNext);
    expect(mockRequest.headers).toMatchSnapshot('buildRequestHeaders.request.headers');
    expect(mockNext).toHaveBeenCalledTimes(1);

    mockRequest.headers['access-control-request-headers'] = 'x-test-header';
    mockRequest.method = 'OPTIONS';
    buildRequestHeaders(mockRequest, mockResponse, mockNext);
    expect(mockRequest.headers).toMatchSnapshot('buildRequestHeaders.request.preflight');
    expect(mockResponse.end).toHaveBeenCalledTimes(1);
  });

  it('should build a response with specific properties', async () => {
    const mockApiResponse = [
      {
        type: 'get',
        url: '/hello/world/',
        success: {
          examples: [
            {
              title: 'Success-Response:',
              content: 'HTTP/1.1 200 OK\n{\n  "foo": "hello",\n  "bar": "world"\n}',
              type: 'json'
            }
          ]
        },
        error: {
          examples: [
            {
              title: 'Error-Response:',
              content: 'HTTP/1.1 400 Bad Request\n{\n  "detail": "Bad request."\n}',
              type: 'json'
            }
          ]
        }
      }
    ];

    const results = buildResponse(mockApiResponse);
    expect(results).toMatchSnapshot('buildResponse');

    const { appResponses } = results;
    const callback = appResponses[0].callback;
    const mockResponse = jest.fn();

    await callback(
      {},
      {
        send: mockResponse,
        set: mockResponse,
        status: mockResponse
      }
    );

    expect(mockResponse.mock.calls).toMatchSnapshot('buildResponse callback');
  });

  it('should return a mock mime type and parsed content', () => {
    const objContent = 'HTTP/1.1 200 OK\n{\n  "foo": "hello",\n  "bar": "world"\n}';
    const contentType = 'json';

    expect(getContentAndType({ content: objContent, type: contentType })).toMatchSnapshot('parseContentAndType');
    expect(getContentAndType({ content: objContent })).toMatchSnapshot('parseContentAndType.fallback');
    expect(getContentAndType({ content: objContent, type: 'lorem/ipsum' })).toMatchSnapshot(
      'parseContentAndType.passthrough'
    );

    const xmlContent = `<lorem><ipsum dolor="sit" /></lorem>`;
    expect(getContentAndType({ content: xmlContent, type: 'xml' })).toMatchSnapshot('parseContentAndType.xml');
    expect(getContentAndType({ content: xmlContent, type: 'svg' })).toMatchSnapshot('parseContentAndType.svg');
  });

  it('should parse custom mock api settings', () => {
    const customSettings = {
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
    };

    expect(getCustomMockSettings(customSettings)).toMatchSnapshot('parseCustomMockSettings');
  });

  it('should parse malformed mock api settings and provide fallbacks', () => {
    const randomSettings = {
      settings: [
        {
          delayResponse: 'lorem'
        }
      ]
    };

    expect(getCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.delayResponse.malformed');

    delete randomSettings.settings[0].delayResponse;
    randomSettings.settings[0].forceStatus = 'ipsum';

    expect(getCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.forceStatus.malformed');
  });

  it('should parse random mock api settings', () => {
    const randomSettings = {
      settings: [
        {
          randomSuccess: ''
        }
      ]
    };

    expect(getCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.randomSuccess');

    delete randomSettings.settings[0].randomSuccess;
    randomSettings.settings[0].randomError = '';

    expect(getCustomMockSettings(randomSettings)).toMatchSnapshot('parseCustomMockSettings.randomError');
  });
});
