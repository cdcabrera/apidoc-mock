const { buildRequestHeaders, buildResponse } = require('../buildApi');

describe('BuildApi', () => {
  it('should have specific defined properties', () => {
    expect(buildRequestHeaders).toBeDefined();
    expect(buildResponse).toBeDefined();
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

  it('should build a response with specific properties', () => {
    const mockApiResponse = [
      {
        type: 'get',
        url: '/hello/world/'
      }
    ];

    expect(buildResponse(mockApiResponse)).toMatchSnapshot('buildResponse');
  });
});
