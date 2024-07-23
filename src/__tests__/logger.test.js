const logger = require('../logger');

describe('logger', () => {
  it('should return specific properties', () => {
    expect(Object.keys(logger)).toMatchSnapshot('specific properties');
  });
});
