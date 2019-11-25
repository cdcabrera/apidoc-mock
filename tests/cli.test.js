const { execSync } = require('child_process');

describe('CLI', () => {
  it('should use default options', () => {
    const output = execSync(`node ./bin/cli.js`);
    expect(output.toString()).toMatchSnapshot('defaults');
  });

  it('should use custom options', () => {
    const output = execSync(`node ./bin/cli.js -p 9000 -d dolorDocs -w lorem -w ipsum`);
    expect(output.toString()).toMatchSnapshot('custom');
  });
});
