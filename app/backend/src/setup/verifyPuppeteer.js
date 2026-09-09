const puppeteer = require('puppeteer');
const fs = require('fs');

async function verifyPuppeteerLaunch(customExecutablePath) {
  const executablePath = customExecutablePath || process.env.PUPPETEER_EXECUTABLE_PATH;

  if (executablePath) {
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Configured PUPPETEER_EXECUTABLE_PATH does not exist: "${executablePath}"`);
    }
    try {
      fs.accessSync(executablePath, fs.constants.X_OK);
    } catch (e) {
      throw new Error(`Configured PUPPETEER_EXECUTABLE_PATH is not executable: "${executablePath}"`);
    }
  }

  const options = {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  };

  if (executablePath) {
    options.executablePath = executablePath;
  }

  let browser;
  try {
    browser = await puppeteer.launch(options);
    const version = await browser.version();
    await browser.close();
    return { success: true, version };
  } catch (err) {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
    throw err;
  }
}

if (require.main === module) {
  verifyPuppeteerLaunch()
    .then((res) => {
      console.log(`✅ Puppeteer browser preflight successful (${res.version}).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`❌ Puppeteer browser preflight failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { verifyPuppeteerLaunch };
