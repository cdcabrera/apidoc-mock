const { buildDocs } = require('../buildDocs');

describe('BuildDocs', () => {
  it('should have specific defined properties', () => {
    expect(buildDocs).toBeDefined();
  });

  it('should fail a build gracefully', () => {
    expect(buildDocs({})).toMatchSnapshot('fail');
  });
});
