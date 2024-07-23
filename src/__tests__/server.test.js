const server = require('../server');

describe('logger', () => {
  it('should return specific properties', () => {
    expect(server).toMatchSnapshot('specific properties');
  });

  it('should setHeaders', () => {
    const mockFunction = jest.fn();
    const mockResponse = { end: mockFunction, set: mockFunction };

    server.setHeaders({ headers: {} }, mockResponse, mockFunction);
    expect(mockFunction.mock.calls).toMatchSnapshot('default headers');
    mockFunction.mockClear();

    server.setHeaders({ headers: { origin: 'dolor sit' } }, mockResponse, mockFunction);
    expect(mockFunction.mock.calls).toMatchSnapshot('origin headers');
    mockFunction.mockClear();

    server.setHeaders({ headers: { 'access-control-request-headers': 'lorem ipsum' } }, mockResponse, mockFunction);
    expect(mockFunction.mock.calls).toMatchSnapshot('allow headers');
    mockFunction.mockClear();

    server.setHeaders({ method: 'OPTIONS' }, mockResponse, mockFunction);
    expect(mockFunction.mock.calls).toMatchSnapshot('request method');
    mockFunction.mockClear();
  });

  it('should setResponse', () => {
    const mockLogger = jest.fn();
    const defaultOutput = server.setResponses(undefined, undefined, { logger: { info: mockLogger } });
    expect({
      output: defaultOutput,
      mock: mockLogger.mock.calls
    }).toMatchSnapshot('default');

    const mockServer = jest.fn();
    const basicServer = server.setResponses(
      { get: mockServer, listen: mockServer, on: mockServer },
      { port: 3000 },
      {
        buildResponses: () => [{ type: 'get', url: '/lorem/ipsum', callback: jest.fn() }]
      }
    );
    expect({
      output: basicServer,
      mock: mockServer.mock.calls
    }).toMatchSnapshot('basicServer');
  });

  it('should setServer', async () => {
    const mockFunction = jest.fn();
    await expect(async () =>
      server.setServer(
        { port: 8000, watch: ['./testFile.js'] },
        { logger: { error: mockFunction }, setResponses: mockFunction }
      )
    ).rejects.toThrow('Server failed to load');

    expect({
      mock: mockFunction.mock.calls
    }).toMatchSnapshot('default');
  });
});
