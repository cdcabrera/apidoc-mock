#!/usr/bin/env node

const { join } = require('path');
const { existsSync } = require('fs');
const nodeWatch = require('node-watch');
const yargs = require('yargs');
const packageJson = require('../package');
const { logger } = require('../src/logger');
const { apiDocMock, OPTIONS } = require('../src');

/**
 * Setup yargs
 */
const { port, silent, watch } = yargs
  .usage('Create a mock server from apiDoc comments.\n\nUsage: mock [options]')
  .help('help')
  .alias('h', 'help')
  .version('version', packageJson.version)
  .alias('v', 'version')
  .option('p', {
    alias: 'port',
    default: 8000,
    describe: 'Set mock port',
    requiresArg: true,
    type: 'number'
  })
  .option('s', {
    alias: 'silent',
    default: true,
    describe: "Silence apiDoc's output warnings, errors",
    type: 'boolean'
  })
  .option('watch', {
    alias: 'w',
    describe: 'Watch single, or multiple directories',
    requiresArg: true,
    type: 'array',
    coerce: args => args.flat()
  }).argv;

/**
 * Set global OPTIONS
 *
 * @type {{silent, port: number, watchPath: string[]}}
 * @private
 */
OPTIONS._set = {
  port,
  silent,
  watchPath: function () {
    return watch?.map(val => join(this.contextPath || '', val))?.filter(val => (existsSync(val) && val) || false) || [];
  }
};

/**
 * If testing stop here, otherwise continue.
 */
if (process.env.NODE_ENV === 'test') {
  process.stdout.write(JSON.stringify({ port, silent, watch }));
} else {
  apiDocMock();

  if (OPTIONS?.watchPath?.length) {
    nodeWatch(OPTIONS?.watchPath, (event, name) => {
      if (event === 'update') {
        logger.info(`updated\t:${name}`);
        apiDocMock();
      }
    });
  }
}
