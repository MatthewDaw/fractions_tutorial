const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('http://localhost:5180/#/title');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/wf-title.png' });
  console.log('wf-title done');

  await page.goto('http://localhost:5180/#/intro');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/wf-intro.png' });
  console.log('wf-intro done');

  await page.goto('http://localhost:5180/#/settings');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/wf-settings.png' });
  console.log('wf-settings done');

  // Real app
  await page.goto('http://localhost:5173/#/');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/app-title.png' });
  console.log('app-title done');

  await page.goto('http://localhost:5173/#/intro');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/app-intro.png' });
  console.log('app-intro done');

  await page.goto('http://localhost:5173/#/settings');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/mattd/AppData/Local/Temp/app-settings.png' });
  console.log('app-settings done');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
