const { apiDocMock, setupDocs, setupResponse } = require('../');

describe('ApiDocMock', () => {
  it('should have specific defined properties', () => {
    expect(apiDocMock).toBeDefined();
    expect(setupDocs).toBeDefined();
    expect(setupResponse).toBeDefined();
  });

  it('should have support functions that fail gracefully for tests', () => {
    expect(setupDocs()).toBe(null);
    expect(setupResponse()).toBe(null);
  });

  it('should throw an error during testing', () => {
    try {
      apiDocMock({});
    } catch (e) {
      expect(e).toMatchSnapshot('error');
    }
  });
});
