const assert = require('node:assert/strict');
const fs = require('node:fs');

function bundleBudget(report, reportOnly = process.env.AVALON_BUNDLE_BUDGET === 'report') {
  const violations = [];
  return {
    check(bytes, limit, message) {
      assert(Number.isFinite(bytes) && bytes >= 0 && Number.isFinite(limit) && limit > 0, 'Invalid budget measurement');
      if (bytes >= limit) violations.push({ bytes, limit, message });
    },
    finish() {
      fs.writeFileSync(report, JSON.stringify({ violations }, null, 2));
      if (!violations.length) return;
      const message = `${violations.length} bundle budget limit(s) exceeded:\n${violations
        .slice(0, 5)
        .map(({ message }) => message)
        .join('\n')}\nFull report: ${report}`;
      if (!reportOnly) throw Error(message);
      console.warn(message);
    },
  };
}
module.exports = { bundleBudget };
