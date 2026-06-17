const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('http://localhost:5180/#/title');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/wf-after-title.png' });
  console.log('after-title done');

  await page.goto('http://localhost:5180/#/intro');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/wf-after-intro.png' });
  console.log('after-intro done');

  await page.goto('http://localhost:5180/#/settings');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/wf-after-settings.png' });
  console.log('after-settings done');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
