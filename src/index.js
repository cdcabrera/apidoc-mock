const { OPTIONS } = require('./global');
const { setServer } = require('./server');

/**
 * ApiDocMock
 *
 * @param {object} settings
 * @param {setServer} settings.setServer
 * @returns {Promise<void>}
 */
const apiDocMock = ({ setServer: aliasSetServer = setServer } = {}) => aliasSetServer();

module.exports = { apiDocMock, OPTIONS };
