/**
 * Playwright Library 示例：不用 Test Runner，直接脚本控制浏览器
 *
 * 安装：pnpm add -D playwright && npx playwright install chromium
 * 运行：node src/35_playwright/1.library.js
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://playwright.dev/');
  const title = await page.title();
  console.log('页面标题:', title);

  // 点击 "Get started"，等待标题出现
  await page.getByRole('link', { name: 'Get started' }).click();
  await page.getByRole('heading', { name: 'Installation' }).waitFor({ timeout: 5000 });
  console.log('已进入 Get started 页');

  // 可选：截图
  // await page.screenshot({ path: 'playwright-docs.png' });

  await browser.close();
})();
