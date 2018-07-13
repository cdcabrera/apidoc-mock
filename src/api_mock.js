let group = '';

const parse = (content, source, defaultGroup) => {
  group = defaultGroup || 'settings';

  const keyValue = content.split('}');

  let key = (keyValue[0] || '').replace(/({|^\s+|\s+$)/, '');
  const value = (keyValue[1] || '').replace(/(^\s+|\s+$)/, '');

  key = key.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
  });

  return { [key]: value };
};

const getGroup = () => group;

const path = () => `local.mock.${getGroup()}`;

module.exports = {
  parse,
  path,
  getGroup: getGroup,
  method: 'push'
};
