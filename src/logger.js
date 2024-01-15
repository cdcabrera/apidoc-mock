const { createLogger, format, transports } = require('winston');
const { colorize, combine, timestamp, printf } = format;

/**
 * Setup console logging, provide error, info, warn, etc.
 *
 * @type {{ error: Function, info: Function, warn: Function }}
 */
const logger = createLogger({
  format: combine(
    colorize(),
    timestamp({
      format: 'HH:mm:ss'
    }),
    printf(({ level, message, timestamp }) => `${timestamp} mock ${level}: ${message}`)
  ),
  transports: [new transports.Console()],
  silent: process.env.NODE_ENV === 'test'
});

module.exports = { logger };
