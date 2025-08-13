/**
 * Configure apiDocs output. Filter custom "apiMock" related key/value
 * pairs such as randomResponse, forceStatus, or delayResponse.
 */
let group = '';

/**
 * apiDoc parsing extension, see apiDocs parsing for setup.
 *
 * @param {string} content
 * @param {*} source
 * @param {*} defaultGroup
 * @returns {{}}
 */
const parse = (content, source, defaultGroup) => {
  group = defaultGroup || 'settings';

  const [tempKey = '', tempValue = ''] = content.split('}');

  const updatedKey = tempKey
    ?.replace(/{/, '')
    ?.trim()
    ?.replace(
      /(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
        (index === 0 ? letter.toLowerCase() : letter.toUpperCase())
    );

  return { [updatedKey]: tempValue?.trim() };
};

const getGroup = () => group;

const path = () => `local.mock.${getGroup()}`;

module.exports = {
  parse,
  path,
  getGroup,
  method: 'push'
};
