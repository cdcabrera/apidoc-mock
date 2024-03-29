const { apiDocMock, setupResponse } = require('../');

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
});
