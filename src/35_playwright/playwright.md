# Playwright 从零开始学习指南

## 📚 目录
1. [什么是 Playwright](#什么是-playwright)
2. [原理：浏览器驱动与 Web-First 自动化](#原理浏览器驱动与-web-first-自动化)
3. [安装与两种用法](#安装与两种用法)
3. [Playwright Test（推荐 E2E）](#playwright-test推荐-e2e)
4. [Playwright Library（自动化脚本）](#playwright-library自动化脚本)
5. [Locators 与常用操作](#locators-与常用操作)
6. [断言与 Hooks](#断言与-hooks)
7. [运行与调试](#运行与调试)
8. [配置与 CI](#配置与-ci)
9. [最佳实践](#最佳实践)

---

## 什么是 Playwright

Playwright 是微软开源的**端到端测试与浏览器自动化**框架，提供统一 API 在 **Chromium、Firefox、WebKit** 上运行，支持 Windows / Linux / macOS，可在无头（headless）或有头、本地或 CI 中执行，并支持 Chrome Android、Mobile Safari 等移动端模拟。

### 为什么选择它？
- ✅ **多浏览器**：一套脚本跑 Chromium / Firefox / WebKit，无需改代码
- ✅ **自动等待**：操作前会做「可操作性」检查，减少手写 `sleep` 和竞态
- ✅ **Web-First 断言**：`expect` 会轮询直到条件满足，降低 flaky
- ✅ **隔离**：每个测试独立 Browser Context，相当于全新浏览器环境
- ✅ **工具链全**：Codegen 录屏生成代码、UI 模式、Trace、HTML 报告、VS Code 插件

### 两种使用方式
| 方式 | 包名 | 适用场景 |
|------|------|----------|
| **Playwright Test** | `@playwright/test` | E2E 测试：用例管理、并行、重试、报告、配置矩阵 |
| **Playwright Library** | `playwright` | 自定义自动化脚本：自己启停浏览器、爬虫、截图、脚本工具 |

大多数「写测试」场景用 **Playwright Test**；做一次性脚本、爬虫、非测试类自动化用 **Library**。

### 典型场景
- 前端 E2E：登录、表单、导航、关键路径回归
- 多浏览器/多项目矩阵测试
- 截图、PDF、录屏、性能抓取（Library）
- 文档站、后台的自动化巡检（Test）

---

## 原理：浏览器驱动与 Web-First 自动化

**核心思路**：E2E 要控制真实浏览器执行操作并断言结果。Playwright 通过**与浏览器进程的协议通信**（如 CDP 或自研协议）驱动 Chromium/Firefox/WebKit，并在 API 层做「自动等待」和「Web-First 断言」，减少因时序导致的 flaky。

- **浏览器驱动**：启动浏览器时带调试端口或 pipe，Node 侧通过 WebSocket/pipe 发送「导航」「点击」「填表」等指令，浏览器执行后返回结果；每个 test 或 context 可独立 browser/context，实现隔离与并行。
- **自动等待**：如 `click()` 不是立刻发点击，而是先轮询直到元素可交互（visible、stable、enabled）、再点击，避免「元素还没出现就点了」；locator 的严格性（同一 selector 只匹配最新 DOM）也减少因 DOM 复用导致的误点。
- **Web-First 断言**：`expect(locator).toHaveText(...)` 会重试直到条件成立或超时，而不是立刻断言一次就失败，符合「等界面稳定再判断」的 E2E 习惯。

---

## 安装与两种用法

### 方式一：Playwright Test（推荐，带脚手架）

一键初始化测试项目并安装浏览器：

```bash
npm init playwright@latest
# 或 yarn create playwright / pnpm create playwright
```

按提示选择：TypeScript 或 JavaScript、测试目录（如 `tests`）、是否加 GitHub Actions。会生成：

- `playwright.config.ts`：测试配置
- `tests/example.spec.ts`：示例用例
- `package.json` 中新增 `@playwright/test` 与脚本

**安装浏览器**（若未自动安装）：

```bash
npx playwright install
# 仅 Chromium：npx playwright install chromium
```

### 方式二：Playwright Library（仅自动化）

在已有项目中只装库和浏览器：

```bash
npm i -D playwright
npx playwright install chromium
# 或按需：npx playwright install chromium firefox webkit
```

脚本中从 `playwright` 引入 `chromium` / `firefox` / `webkit`，自行 `launch`、`newContext`、`newPage`，用完后 `close`。

### 环境要求
- Node.js：20.x / 22.x / 24.x
- 系统：Windows 11+、macOS 14+、Debian 12 / Ubuntu 22.04+ 等（见[官方系统要求](https://playwright.dev/docs/intro#system-requirements)）

---

## Playwright Test（推荐 E2E）

### 第一个测试

```javascript
// tests/example.spec.js
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
```

- `test('...', async ({ page }) => { ... })`：每个测试会拿到独立的 `page`（以及可用的 `context`、`browser` 等 [fixtures](https://playwright.dev/docs/test-fixtures)）。
- `page.goto`：导航；Playwright 会等页面达到 load 状态再继续。
- `page.getByRole('link', { name: 'Get started' })`：用**角色 + 可访问名**定位，推荐优先使用。
- `expect(page).toHaveTitle(...)`：Web-First 断言，内部会等待条件成立。

### 运行测试

```bash
npx playwright test                    # 默认无头、并行、多浏览器
npx playwright test --headed          # 有头模式，看浏览器
npx playwright test --project=chromium # 只跑 Chromium
npx playwright test tests/example.spec.js  # 只跑某文件
npx playwright test --ui              # UI 模式：筛选、时间旅行、调试
```

### 查看报告

```bash
npx playwright show-report   # 打开最近一次运行的 HTML 报告
```

失败时默认会打开报告；报告内可看截图、Trace、步骤等。

---

## Playwright Library（自动化脚本）

不跑「测试」，而是像普通 Node 脚本一样：自己启动浏览器、操作页面、关闭。

```javascript
// 示例：Library 方式打开 Chromium，访问页面并取标题
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://playwright.dev/');
  console.log(await page.title());
  await browser.close();
})();
```

- **安装**：`npm i -D playwright`，再 `npx playwright install chromium`（或其它浏览器）。
- **运行**：`node your-script.js`（或 ts-node / 先编译再运行）。
- **断言**：Library 没有 Test 的 `expect(...).toHaveTitle()`，需用 Node 自带的 `assert` 或其它断言库；若要做「会重试的断言」，建议用 Test 或自己写轮询。

### Library 与 Test 对比摘要

| 项目 | Library (`playwright`) | Test (`@playwright/test`) |
|------|------------------------|---------------------------|
| 安装 | `npm i playwright` + `npx playwright install` | `npm init playwright@latest` |
| 入口 | 自己写脚本，`chromium.launch()` → `newPage()` | `npx playwright test`，fixture 注入 `page` |
| 断言 | 无内置 Web-First，需手写 | `expect(page).toHaveTitle()` 等，自动等待 |
| 清理 | 需自己 `context.close()`、`browser.close()` | Test Runner 自动管理 |
| 适用 | 爬虫、截图、一次性脚本 | E2E 测试、CI、报告、重试 |

---

## Locators 与常用操作

### 什么是 Locator

Locator 表示「一种在页面上查找元素的方式」，每次操作/断言时都会**重新解析**，因此适合动态 DOM；不需要手写「等元素出现」的逻辑，Playwright 会在执行前做[可操作性](https://playwright.dev/docs/actionability)检查。

### 推荐定位方式（优先级从高到低）

- **getByRole(role, { name })**：按无障碍角色 + 可访问名，最贴近用户与辅助技术。
  - `page.getByRole('button', { name: 'Submit' })`
  - `page.getByRole('link', { name: 'Get started' })`
- **getByLabel**：通过关联的 `<label>`。
- **getByPlaceholder**：占位符文本。
- **getByText**：文本内容（可正则）。
- **getByAltText**：图片 `alt`。
- **getByTitle**：`title` 属性。
- **getByTestId**：`data-testid`（需在应用中写上），稳定但非面向用户。

不推荐仅用 CSS/XPath 字符串（易随样式和结构调整而碎）；必要时可用 `locator('css=...')` 或 `page.locator('xpath=...')`。

### 常用操作（均在 Locator 上）

| 方法 | 说明 |
|------|------|
| `locator.click()` | 点击 |
| `locator.fill(value)` | 清空后填写输入框 |
| `locator.check()` / `locator.uncheck()` | 勾选/取消复选框 |
| `locator.hover()` | 悬停 |
| `locator.focus()` | 聚焦 |
| `locator.press(key)` | 按键 |
| `locator.selectOption(value)` | 下拉选择 |
| `locator.setInputFiles(files)` | 上传文件 |

导航：

- `page.goto(url)`：打开 URL。

组合示例：

```javascript
await page.goto('https://example.com/login');
await page.getByLabel('User').fill('alice');
await page.getByLabel('Password').fill('secret');
await page.getByRole('button', { name: 'Sign in' }).click();
await expect(page.getByText('Welcome')).toBeVisible();
```

---

## 断言与 Hooks

### Web-First 断言（Test）

使用 `expect` 配合「会等待」的 matcher，无需手写 `waitFor`：

```javascript
await expect(page).toHaveTitle(/Playwright/);
await expect(page).toHaveURL(/playwright\.dev/);
await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
await expect(page.getByText('Welcome')).toContainText('Hi');
await expect(page.getByRole('checkbox')).toBeChecked();
await expect(input).toHaveValue('hello');
await expect(list).toHaveCount(3);
```

同步断言（不等待）用通用 matcher：`expect(value).toEqual(...)`、`expect(x).toBeTruthy()` 等。

### 测试分组与 Hooks（Test）

```javascript
import { test, expect } from '@playwright/test';

test.describe('导航', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://playwright.dev/');
  });

  test('首页 URL', async ({ page }) => {
    await expect(page).toHaveURL('https://playwright.dev/');
  });

  test('点击 Get started', async ({ page }) => {
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});
```

- `test.describe`：分组。
- `test.beforeEach` / `test.afterEach`：每用例前后执行。
- `test.beforeAll` / `test.afterAll`：每个 worker 内所有用例前后各执行一次。

---

## 运行与调试

### 常用命令

```bash
npx playwright test              # 全量
npx playwright test -g "title"   # 用例名匹配
npx playwright test --headed    # 有头
npx playwright test --debug     # 调试模式（逐步执行）
npx playwright test --ui        # UI 模式
npx playwright show-report      # 打开 HTML 报告
```

### Codegen（录屏生成代码）

```bash
npx playwright codegen https://example.com
```

会打开浏览器与 Inspector，操作页面即可生成定位与操作代码，可复制到用例中再精简。

### Trace（失败时查看执行过程）

在 `playwright.config.ts` 的 `use` 里开启：

```javascript
use: {
  trace: 'on-first-retry',  // 或 'on', 'retain-on-failure'
}
```

失败后报告里可点开 Trace，查看每一步的 DOM、网络、截图等。

---

## 配置与 CI

### playwright.config 要点

- **testDir**：测试目录，默认 `tests`。
- **fullyParallel**：是否全并行。
- **retries**：本地/CI 可设不同重试次数。
- **workers**：并行 worker 数。
- **reporter**：如 `'html'`、`'list'`。
- **use**：默认的 context 选项：
  - **baseURL**：`page.goto('/path')` 会拼成 `baseURL + '/path'`。
  - **viewport**、**ignoreHTTPSErrors**、**trace**、**video**、**screenshot** 等。

示例（保留你项目里已有的配置风格）：

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### CI（如 GitHub Actions）

- 使用官方 Action：`micromatch/playwright-github-action` 或 文档中的 [Playwright CI 示例](https://playwright.dev/docs/ci-intro)。
- 安装依赖后执行 `npx playwright install --with-deps`（安装浏览器及系统依赖）。
- 运行 `npx playwright test`；如需上传报告/Artifact，可把 `playwright-report`、`test-results` 等配置为 Artifact。

---

## 最佳实践

1. **优先 getByRole / getByLabel / getByText**：少用脆弱的 CSS 选择器，便于维护与无障碍。
2. **一个用例一个行为**：用例短、语义清晰，失败时容易定位。
3. **用 baseURL + 相对路径**：`page.goto('/login')` 便于换环境。
4. **CI 里开 trace 与重试**：`trace: 'on-first-retry'`、`retries: 2`，便于排查 flaky。
5. **需要时再上 Page Object**：先写直白用例，结构复杂再抽「页面/组件」封装。
6. **Library 仅做脚本**：E2E 回归、多浏览器矩阵、报告与重试交给 Playwright Test。

---

## 参考链接

- [Playwright 官方文档](https://playwright.dev/docs/intro)
- [Writing tests](https://playwright.dev/docs/writing-tests)
- [Locators](https://playwright.dev/docs/locators)
- [Test assertions](https://playwright.dev/docs/test-assertions)
- [Library（脚本模式）](https://playwright.dev/docs/library)
- [Test configuration](https://playwright.dev/docs/test-configuration)
- [CI 入门](https://playwright.dev/docs/ci-intro)
