// Genera le icone PNG da scripts/icon.svg: node scripts/make-icons.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
  const browser = await chromium.launch();
  for (const size of [180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<html><body style="margin:0">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
    await page.screenshot({ path: path.join(__dirname, '..', 'icons', `icon-${size}.png`) });
    await page.close();
  }
  await browser.close();
})();
