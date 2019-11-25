#!/usr/bin/env node

const nodeWatch = require('node-watch');
const yargs = require('yargs');
const packageJson = require('../package');
const { logger } = require('../src/logger/configLogger');
const { apiDocMock } = require('../src');

const { port, watch, docs } = yargs
  .usage('Create a mock server from apiDoc comments.\n\nUsage: mock [options]')
  .help('help')
  .alias('h', 'help')
  .version('version', packageJson.version)
  .alias('v', 'version')
  .option('d', {
    alias: 'docs',
    default: './.docs',
    describe: 'Output directory used to compile apidocs',
    requiresArg: true
  })
  .option('p', {
    alias: 'port',
    default: 8000,
    describe: 'Set mock port',
    requiresArg: true
  })
  .option('w', {
    alias: 'watch',
    describe: 'Watch single, or multiple directories',
    requiresArg: true
  }).argv;

const start = () =>
  apiDocMock({
    port: (/^\d+$/g.test(port) && port) || undefined,
    dataPath: watch,
    docsPath: docs
  });

if (process.env.NODE_ENV === 'test') {
  process.stdout.write(JSON.stringify({ port, watch, docs }));
} else {
  start();

  if (watch && watch.length) {
    nodeWatch(watch, (event, name) => {
      if (event === 'update') {
        logger.info(`updated\t:${name}`);
        start();
      }
    });
  }
}
