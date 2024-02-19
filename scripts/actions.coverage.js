const fs = require('fs');
const path = require('path');

/**
 * Add release coverage totals to a summary.json for dynamic badge display.
 *
 * @param {object} options
 * @param {string} options.coverageJson
 * @param {string} options.outputJson
 */
const addCoverageTotals = ({
  coverageJson = path.join(process.cwd(), 'coverage/coverage-summary.json'),
  outputJson = path.join(process.cwd(), 'coverage/lcov-report/summary.json')
} = {}) => {
  try {
    if (!fs.existsSync(coverageJson)) {
      return;
    }
    const { total } = require(coverageJson);
    const resultJson = {};
    resultJson.coverage = { ...total?.lines };
    fs.writeFileSync(outputJson, JSON.stringify(resultJson, null, 2) + '\n');
  } catch (e) {
    console.error(new Error(`Add coverage totals: ${e.message}`));
  }
};

addCoverageTotals();
