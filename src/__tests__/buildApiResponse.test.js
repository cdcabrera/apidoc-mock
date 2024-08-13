const buildApiResponse = require('../buildApiResponse');

describe('buildApiResponse', () => {
  it('should return specific properties', () => {
    expect(buildApiResponse).toMatchSnapshot('specific properties');
  });

  it('should get an authorized example', () => {
    expect({
      default: buildApiResponse.getAuthExampleResponse(),
      filteredAndMissing: buildApiResponse.getAuthExampleResponse([
        {
          status: 200
        }
      ]),
      filteredAndFound: buildApiResponse.getAuthExampleResponse([
        {
          status: 200
        },
        {
          status: 401,
          content: 'lorem ipsum dolor sit amet'
        }
      ])
    }).toMatchSnapshot('authorized');
  });

  it('should get an example', () => {
    expect({
      default: buildApiResponse.getExampleResponse(),
      mockForcedAndFilteredAndMissing: buildApiResponse.getExampleResponse({
        mockSettings: { forceStatus: 404 },
        successExamples: undefined,
        errorExamples: []
      }),
      mockForcedExcessiveStatusHigh: buildApiResponse.getExampleResponse({
        mockSettings: { forceStatus: 700 }
      }),
      mockForcedExcessiveStatusLow: buildApiResponse.getExampleResponse({
        mockSettings: { forceStatus: -700 }
      }),
      mockResponseAndFilteredSuccess: buildApiResponse.getExampleResponse({
        mockSettings: { response: 'response' },
        successExamples: [{ status: 201 }],
        errorExamples: []
      }),
      mockResponseAndFilteredError: buildApiResponse.getExampleResponse({
        mockSettings: { response: 'response' },
        successExamples: [],
        errorExamples: [{ status: 400 }]
      }),
      mockSuccessAndFilteredSuccess: buildApiResponse.getExampleResponse({
        mockSettings: { response: 'success' },
        successExamples: [{ status: 201, content: 'lorem ipsum dolor sit amet' }],
        errorExamples: []
      }),
      mockSuccessAndFilteredAndMissing: buildApiResponse.getExampleResponse({
        mockSettings: { response: 'success' },
        successExamples: [],
        errorExamples: [{ status: 400, content: 'lorem ipsum dolor sit amet' }]
      }),
      mockErrorAndFilteredError: buildApiResponse.getExampleResponse({
        mockSettings: { response: 'error' },
        successExamples: [],
        errorExamples: [{ status: 400, content: 'lorem ipsum dolor sit amet' }]
      }),
      mockErrorAndFilteredAndMissing: buildApiResponse.getExampleResponse({
        mockSettings: { response: 'error' },
        successExamples: [{ status: 201, content: 'lorem ipsum dolor sit amet' }],
        errorExamples: []
      })
    }).toMatchSnapshot('example');
  });

  it('should get an authorized and general example', () => {
    const mockFunction = jest.fn();
    buildApiResponse.getMockResponseExample(undefined, {
      getExampleResponse: mockFunction,
      getAuthExampleResponse: mockFunction
    });
    expect(mockFunction).toHaveBeenCalledTimes(2);
  });

  it('should build responses based on examples', () => {
    const mockFunction = jest.fn().mockImplementation(() => jest.fn());

    expect({
      default: buildApiResponse.buildResponses(),
      basic: buildApiResponse.buildResponses({
        getDocs: () => [{ type: 'get', url: 'lorem/ipsum', dolor: 'sit' }],
        getResponseCallback: mockFunction
      })
    }).toMatchSnapshot('responses');

    expect(mockFunction.mock.calls).toMatchSnapshot('getResponseCallback');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('should process a request with mock settings and return a response', async () => {
    jest.useFakeTimers();
    const mockRequest = jest.fn();
    const mockRequestWrapper = {
      get: mockRequest
    };

    const mockResponse = jest.fn().mockImplementation((...args) => args);
    const mockResponseWrapper = {
      append: (...args) => mockResponse('append', args),
      end: (...args) => mockResponse('end', args),
      status: (...args) => mockResponse('status', args),
      set: (...args) => mockResponse('set', args),
      send: (...args) => mockResponse('send', args)
    };

    const basicResponse = buildApiResponse.getResponseCallback();
    await basicResponse(mockRequestWrapper, mockResponseWrapper);
    jest.runAllTimers();

    expect(mockResponse.mock.calls).toMatchSnapshot('default response');
    mockResponse.mockClear();
    mockRequest.mockClear();

    const successResponse = buildApiResponse.getResponseCallback({
      successExamples: [{ status: 201, type: 'text/html', content: '<html><body>lorem ipsum dolor sit</body></html>' }]
    });
    await successResponse(mockRequestWrapper, mockResponseWrapper);
    jest.runAllTimers();

    expect(mockResponse.mock.calls).toMatchSnapshot('success response');
    mockResponse.mockClear();
    mockRequest.mockClear();

    const errorResponse = buildApiResponse.getResponseCallback({
      mockSettings: { forceStatus: 400 },
      errorExamples: [{ status: 400, type: 'text/html', content: '<html><body>lorem ipsum dolor sit</body></html>' }]
    });
    await errorResponse(mockRequestWrapper, mockResponseWrapper);
    jest.runAllTimers();

    expect(mockResponse.mock.calls).toMatchSnapshot('error response');
    mockResponse.mockClear();
    mockRequest.mockClear();

    const notAuthorizedResponse = buildApiResponse.getResponseCallback({
      requestHeaders: { Authorization: 'Token AUTH_TOKEN' }
    });
    await notAuthorizedResponse(mockRequestWrapper, mockResponseWrapper);
    jest.runAllTimers();

    expect(mockResponse.mock.calls).toMatchSnapshot('not authorized response');
    mockResponse.mockClear();
    mockRequest.mockClear();

    const authorizedResponse = buildApiResponse.getResponseCallback({
      requestHeaders: { Authorization: 'Token AUTH_TOKEN' }
    });
    await authorizedResponse({ get: (...args) => `mockGetHeader: ${args}` }, mockResponseWrapper);
    jest.runAllTimers();

    expect(mockResponse.mock.calls).toMatchSnapshot('authorized response');
    mockResponse.mockClear();
  });
});
