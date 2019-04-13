const { parse, path, getGroup, method } = require('../configDocs');

describe('ConfigDocs', () => {
  it('should have specific defined properties', () => {
    expect(parse).toBeDefined();
    expect(path).toBeDefined();
    expect(getGroup).toBeDefined();
    expect(method).toBeDefined();
  });

  it('should parse custom settings and return an object', () => {
    const content = '{DelayResponse} 3000';
    const source = '@apiMock {DelayResponse} 3000';
    const defaultGroup = undefined;

    expect(parse(content, source, defaultGroup)).toMatchSnapshot();
  });
});
