#!/usr/bin/env node

const yargs = require('yargs');
const { globSync } = require('glob');
const nodeWatch = require('node-watch');
const packageJson = require('../package');
const { logger } = require('../src/logger');
const { apiDocMock, OPTIONS } = require('../src');

/**
 * Setup yargs
 */
const { port, silent, watch } = yargs
  .usage('Create a mock server from apiDoc like comments.\n\nUsage: mock [options]')
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
  .option('watch', {
    alias: 'w',
    describe: 'Watch single, or multiple, files and extensions using glob patterns.',
    requiresArg: true,
    type: 'array',
    coerce: args => args.flat()
  }).argv;

/**
 * Set global OPTIONS
 *
 * @type {{silent, docsPath: string, port: number, watchPath: string[]}}
 * @private
 */
OPTIONS._set = {
  port,
  files: function () {
    let updatedFiles = [];
    try {
      updatedFiles = globSync(watch, { root: this.contextPath || '', absolute: true });
    } catch (error) {
      logger.error(`file-watch\t:${error.message}`);
    }
    return updatedFiles;
  }
};

/**
 * If testing stop here, otherwise continue.
 */
if (process.env.NODE_ENV === 'test') {
  process.stdout.write(JSON.stringify({ port, silent, watch }));
} else {
  apiDocMock();

  if (OPTIONS?.files?.length) {
    nodeWatch(OPTIONS.files, (event, name) => {
      if (event === 'update') {
        logger.info(`updated\t:${name}`);
        apiDocMock();
      }
    });
  }
}
