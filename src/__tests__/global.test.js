const global = require('../global');

describe('Global', () => {
  it('should return specific properties', () => {
    expect(Object.keys(global)).toMatchSnapshot('specific properties');
  });

  it('should set a one-time mutable OPTIONS object', () => {
    const { OPTIONS } = global;

    // for testing set a consistent contextPath and parser
    OPTIONS.contextPath = '/';
    OPTIONS.apiDocBaseConfig.parsers.apimock = '/customParser.js';

    OPTIONS.lorem = 'et all';
    OPTIONS.dolor = 'magna';
    OPTIONS._set = {
      lorem: 'ipsum',
      sit: function () {
        return `function test ${this.contextPath}`;
      }
    };
    OPTIONS.lorem = 'hello world';
    OPTIONS.dolor = 'sit';

    expect({ isFrozen: Object.isFrozen(OPTIONS), OPTIONS }).toMatchSnapshot('immutable');
  });
});
