module.exports = {
  // eslint-disable-next-line no-unused-vars
  extend: ({ jsonSchemaFaker, chance }) => {
    jsonSchemaFaker.option({
      fillProperties: false
    });
  }
};
