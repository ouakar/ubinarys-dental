require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { globSync } = require('glob');

const modelsFiles = globSync('./src/models/**/*.js');
for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

const pdfController = require('../src/controllers/pdfController');

test('PDF generation fails cleanly when targetLocation is missing', async () => {
  await assert.rejects(
    async () => {
      await pdfController.generatePdf('Invoice', { targetLocation: '' }, {});
    },
    (err) => {
      assert.match(err.message, /Target location path is required/);
      return true;
    }
  );
});
