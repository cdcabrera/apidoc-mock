const { apiDocMock } = require('../');

describe('apiDocMock', () => {
  it('should return specific properties', () => {
    expect(apiDocMock).toMatchSnapshot('specific properties');
  });

  it('should attempt to run the server', () => {
    const mockFunction = jest.fn();
    apiDocMock({ setServer: mockFunction });
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});
