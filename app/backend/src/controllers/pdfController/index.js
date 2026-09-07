const pug = require('pug');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const puppeteer = require('puppeteer');

const { loadSettings } = require('@/middlewares/settings');
const useLanguage = require('@/locale/useLanguage');
const { useMoney, useDate } = require('@/settings');
const amountToFrenchWords = require('@/utils/amountToFrenchWords');

const pugFiles = ['invoice', 'offer', 'quote', 'payment'];

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    const options = {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    browserPromise = puppeteer.launch(options).catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

exports.closeBrowser = async () => {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch (e) {
      // Ignore shutdown errors
    } finally {
      browserPromise = null;
    }
  }
};

exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A4', targetLocation: '' },
  result,
  callback
) => {
  let page = null;
  try {
    const { targetLocation, format = 'A4' } = info;

    if (!targetLocation) {
      throw new Error('Target location path is required for PDF generation.');
    }

    const targetDir = path.dirname(targetLocation);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetLocation)) {
      fs.unlinkSync(targetLocation);
    }

    const normalizedModelName = modelName.toLowerCase();
    if (!pugFiles.includes(normalizedModelName)) {
      throw new Error(`Unsupported PDF template model: ${modelName}`);
    }

    const settings = await loadSettings();
    const selectedLang = settings['ubinarys_app_language'];
    const translate = useLanguage({ selectedLang });

    const {
      currency_symbol,
      currency_position,
      decimal_sep,
      thousand_sep,
      cent_precision,
      zero_format,
    } = settings;

    const { moneyFormatter } = useMoney({
      settings: {
        currency_symbol,
        currency_position,
        decimal_sep,
        thousand_sep,
        cent_precision,
        zero_format,
      },
    });
    const { dateFormat } = useDate({ settings });

    const baseUrl = (
      process.env.PUBLIC_SERVER_FILE || `http://localhost:${process.env.PORT || 8888}/`
    ).replace(/\/$/, '');

    const logo = settings.company_logo?.replace(/^\//, '');
    settings.logoUrl = baseUrl && logo ? `${baseUrl}/${logo}` : '';
    settings.public_server_file = baseUrl ? `${baseUrl}/` : '';

    const pugPath = path.join(process.cwd(), 'src/pdf', `${modelName}.pug`);
    const htmlContent = pug.renderFile(pugPath, {
      model: result,
      settings,
      translate,
      dateFormat,
      moneyFormatter,
      amountToFrenchWords,
      moment,
    });

    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.pdf({
      path: targetLocation,
      format: format,
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    if (callback) {
      await callback();
    }

    return targetLocation;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore page close error
      }
    }
  }
};
