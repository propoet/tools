# happy-dom 学习文档

> 轻量、快速的 JavaScript DOM 实现，无图形界面，面向单元测试、爬虫与服务端渲染；Vitest 默认支持，比 JSDOM 快一个数量级

## 📚 目录

1. [用大白话说：happy-dom 是啥](#用大白话说happy-dom-是啥)
2. [原理：为什么快、适合测什么](#原理为什么快适合测什么)
3. [与 JSDOM 的对比](#与-jsdom-的对比)
4. [安装与使用方式](#安装与使用方式)
5. [Window 类：单窗口快速建 DOM](#window-类单窗口快速建-dom)
6. [Browser 类：多页面模拟浏览器](#browser-类多页面模拟浏览器)
7. [作为测试环境：Vitest / Jest / Node / Bun](#作为测试环境vitest--jest--node--bun)
8. [Global Registrator 与 happyDOM API](#global-registrator-与-happydom-api)
9. [Mock / Spy（如 Storage）](#mockspy如-storage)
10. [常见场景与最佳实践](#常见场景与最佳实践)
11. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：happy-dom 是啥

### 你遇到的问题（在 Node 里测前端时）

- **没有 DOM**：Node 里没有 `document`、`window`、`querySelector`，直接跑依赖 DOM 的代码会报错。
- **JSDOM 太慢**：用 JSDOM 当测试环境，启动和解析 HTML 都要几百毫秒，单测一多就卡。
- **只想「有 document/window、能挂节点、能查能改」**：不需要真浏览器，但要够快、API 够用、和 Testing Library / Vitest 等配合好。

也就是说：**在「无头环境里提供一套可用的 DOM + 部分浏览器 API」这件事上，做到轻量、快、适合单测**，就是 happy-dom 要解决的问题。

### happy-dom 帮你做啥

**happy-dom** 是一个 **用 JavaScript 实现的「无界面浏览器」**，主要面向：

1. **单元测试**：在 Node（或 Bun）里提供 `window`、`document`、`localStorage`、`fetch` 等，让依赖 DOM 的代码能直接跑；Vitest 内置支持，Jest 可用 `@happy-dom/jest-environment`。
2. **爬虫 / 服务端渲染**：需要解析 HTML、操作 DOM、执行简单脚本时，不必起真浏览器，用 happy-dom 的 Window 或 Browser 即可。
3. **性能**：导入、解析 HTML、序列化、querySelector 等相比 JSDOM 快一个数量级（官方 benchmark：导入约 45ms vs 333ms，解析 HTML 约 26ms vs 256ms）。

它提供两类入口：

- **Window**：单个「窗口」，一个 `document`，适合单测里快速建 DOM、挂节点、查改。
- **Browser**：模拟多页面（`newPage()`、`goto()`、`waitUntilComplete()` 等），适合需要「多页 / 导航」的场景。

一句话：**happy-dom = 轻量、快速的「假浏览器」**：给你 document/window 和常用 API，让你在 Node 里测前端逻辑或做无头 DOM 操作；Vitest 等默认就用它。

---

## 原理：为什么快、适合测什么

### 1. 只实现「测得到、用得到」的部分

- happy-dom 不追求完整实现所有 Web 标准，而是优先实现 **单测和简单 SSR/爬虫常用** 的部分：DOM 节点树、querySelector、innerHTML、createElement、事件、MutationObserver、Fetch、localStorage/sessionStorage、Custom Elements、Declarative Shadow DOM 等。
- 不实现或简化：复杂 CSS 布局、真实渲染、完整 iframe、复杂安全策略等。这样代码路径短、数据结构简单，解析和查询都更快。

### 2. 数据结构与算法针对性能优化

- 解析 HTML、序列化、选择器查询等路径都针对「小到中等规模 DOM」优化；例如 querySelectorAll 在 benchmark 里比 JSDOM 快数倍。
- 不做「完整浏览器兼容层」，少一层抽象，内存和 CPU 都更省。

### 3. 单例 Window vs 多页 Browser

- **Window**：一个实例对应一个 document，无导航、无多页，适合「每个测试里建一个干净 document」或「脚本里只操作一棵 DOM」。
- **Browser**：内部多个 Page/Frame，有 URL、content、goto、waitUntilComplete 等，适合「模拟点击链接、等异步、再读 DOM」的集成式测试或简单爬虫。

### 4. 与测试框架的集成方式

- **Vitest**：配置 `environment: 'happy-dom'` 即可，全局自动有 `document`/`window`。
- **Jest**：用 `@happy-dom/jest-environment` 把测试跑在 happy-dom 环境里。
- **Node 自带 test runner**：用 `@happy-dom/global-registrator` 在跑测试前 `register()`，把全局替换成 happy-dom 的 Window。

可以简单记：**只做常用子集 + 性能优化 + Window/Browser 两种粒度 = 快且够用的测试/无头 DOM 环境**。

---

## 与 JSDOM 的对比

| 对比项           | happy-dom              | JSDOM                    |
|------------------|------------------------|--------------------------|
| **定位**         | 轻量、快速、面向测试   | 完整 DOM/Web 实现        |
| **导入耗时**     | ~45ms                  | ~333ms                   |
| **解析 HTML**    | ~26ms                  | ~256ms                   |
| **序列化 HTML**  | ~8ms                   | ~65ms                    |
| **querySelectorAll** | 明显更快           | 较慢                     |
| **Web API 覆盖** | 常用部分（够单测/SSR） | 更全面                   |
| **Vitest 默认**  | 是                     | 需配置                   |
| **Jest**         | @happy-dom/jest-environment | jest-environment-jsdom |
| **典型用途**     | 单测、轻量 SSR、爬虫   | 需要更完整兼容时         |

**简单记**：  
- **单测、Vitest、要速度** → 用 **happy-dom**。  
- **必须兼容 JSDOM 的怪异行为或冷门 API** → 用 **JSDOM**。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D happy-dom
# 或
npm i happy-dom --save-dev
```

### 两种用法概览

1. **直接用 Window**：自己 `new Window()`，拿到 `document`，在脚本或单测里挂 DOM、查节点（不依赖测试框架时常用）。
2. **作为测试环境**：在 Vitest/Jest/Node test 里把「环境」设为 happy-dom，这样 `global.document` / `global.window` 就是 happy-dom 的，无需手动 new Window。

下面分节说。

---

## Window 类：单窗口快速建 DOM

适合：单测里需要一个干净的 document，或脚本里只操作一棵 DOM。

### 基本用法

```js
import { Window } from "happy-dom";

const window = new Window({ url: "https://localhost:8080" });
const document = window.document;

document.body.innerHTML = '<div class="container"></div>';
const container = document.querySelector(".container");
const button = document.createElement("button");
container.appendChild(button);

console.log(document.body.innerHTML);
// <div class="container"><button></button></div>
```

### 构造选项（常见）

- **url**：`window.location` 等会用的基础 URL。
- **width / height**：视口宽高，影响 `window.innerWidth` 等（若需要）。

### 用完后释放

- **await window.happyDOM.abort()**：中止进行中的异步（如 fetch、定时器）。
- **window.close()**：关闭窗口，释放资源。

在单测里若每个用例都 `new Window()`，用例结束前建议 `abort()` + `close()`，避免定时器或请求拖到下一个用例。

---

## Browser 类：多页面模拟浏览器

适合：多页、导航、等异步加载再读 DOM（如简单爬虫或集成测试）。

### 示例 1：单页设 HTML

```js
import { Browser } from "happy-dom";

const browser = new Browser();
const page = browser.newPage();
page.url = "https://example.com";
page.content = "<html><body>Hello world!</body></html>";

console.log(page.mainFrame.document.body.textContent); // "Hello world!"
await browser.close();
```

### 示例 2：导航、点击、等待完成

```js
import { Browser, BrowserErrorCaptureEnum } from "happy-dom";

const browser = new Browser({
  settings: { errorCapture: BrowserErrorCaptureEnum.processLevel },
});
const page = browser.newPage();

await page.goto("https://github.com/capricorn86");
page.mainFrame.document.querySelector('a[href*="capricorn86/happy-dom"]').click();
await page.waitUntilComplete();

console.log(page.mainFrame.document.title);
await browser.close();
```

### 常用 API（Page / Frame）

- **page.goto(url)**、**reload()**、**goBack()**、**goForward()**
- **page.waitUntilComplete()**、**waitForNavigation()**
- **page.mainFrame.document**：当前主框架的 document
- **browser.close()**、**browser.abort()**

---

## 作为测试环境：Vitest / Jest / Node / Bun

### Vitest（开箱即用）

在 `vitest.config.*` 里设：

```js
export default {
  test: {
    environment: "happy-dom",
  },
};
```

测试里直接用 `document`、`window`、`querySelector` 等即可，无需手动 new Window。

**定时器说明**：Vitest 默认不一定用 happy-dom 的定时器，所以 `happyDOM.waitUntilComplete()` / `happyDOM.abort()` 可能不完整。若需要，可在 setup 里把全局定时器指到 happy-dom 的 window（见官方 Wiki：Setup as Test Environment）。

### Bun

Bun 自带对 happy-dom 的支持，见 [Bun 文档](https://bun.sh/docs/test/dom)。

### Node 自带 test runner（v23+）

1. 装 `@happy-dom/global-registrator`。
2. 建一个环境文件（如 `happy-dom-env.ts`）：

```js
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register({
  url: "http://localhost:3000",
  width: 1920,
  height: 1080,
});
```

3. 在 `package.json` 的 test 脚本里用 `--import` 最先加载该文件：

```json
{
  "scripts": {
    "test": "node --import ./happy-dom-env.ts --test ./test/**/*.test.{ts,tsx}"
  }
}
```

这样测试跑在 happy-dom 的全局 `document`/`window` 下。

### Jest

安装并配置：

```bash
pnpm add -D @happy-dom/jest-environment
```

在 Jest 配置里：

```js
module.exports = {
  testEnvironment: "@happy-dom/jest-environment",
};
```

### Testing Library

和 Vitest/Jest 一样，只要测试环境是 happy-dom，Testing Library 会直接用当前的 `document`，无需额外配置。

---

## Global Registrator 与 happyDOM API

### @happy-dom/global-registrator

当没有 Vitest/Jest 等「环境」时，可以手动把 happy-dom 挂到全局：

```js
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({
  url: "http://localhost:3000",
  width: 1920,
  height: 1080,
});

document.body.innerHTML = "<button>My button</button>";
const button = document.querySelector("button");
console.log(button.innerText); // "My button"

await GlobalRegistrator.unregister(); // 用完恢复全局
```

- **register(options)**：创建一个 Window，并把其属性挂到 `global`（如 `global.document`、`global.window`）。
- **unregister()**：关闭该 Window 并恢复原来的全局属性。

### Window.happyDOM（DetachedWindowAPI）

在测试环境里，当前 `window` 可能是 happy-dom 的，会带一个 **window.happyDOM**（或 `document[PropertySymbol.ownerWindow]` 等，视版本而定），提供：

- **waitUntilComplete()**：等当前窗口的异步（fetch、定时器）完成。
- **abort()**：中止这些异步。
- **setURL(url)**、**setViewport({ width, height })**：改 URL、视口。

TypeScript 若要用到 `happyDOM`，可加全局类型（见官方 Wiki：Setup as Test Environment 的 Type definition）。

---

## Mock / Spy（如 Storage）

单测里经常要 mock `localStorage`/`sessionStorage`。happy-dom 自带 Storage 实现，但和标准一致：`Object.getOwnPropertyDescriptor(Storage.prototype, 'getItem')` 等可能为 undefined，Jest 的 spy 对「实例方法」可能不友好。

- **Vitest**：可直接 `vi.spyOn(localStorage, 'getItem').mockImplementation(...)`，或 spy `Storage.prototype.getItem`。
- **Jest**：通常只能 spy **Storage.prototype**，例如 `jest.spyOn(Storage.prototype, 'getItem').mockImplementation(...)`。

具体见官方 Wiki：Mocking / Spying - Storage。

---

## 常见场景与最佳实践

### 1. 单测里测「依赖 document 的纯函数」

用 Vitest + `environment: 'happy-dom'`，在测试里 `document.body.innerHTML = '...'`，然后调用你的函数，断言 DOM 或返回值。

### 2. 每个用例一个干净 DOM

在 `beforeEach` 里 `document.body.innerHTML = ''` 或重新 `new Window()` 并挂到全局（若用 Global Registrator 可先 unregister 再 register）。

### 3. 有 fetch / 定时器时

用例结束前在能拿到 `window` 的地方调用 `await window.happyDOM.abort()`，避免异步泄漏到下一个用例；需要等异步完成时用 `waitUntilComplete()`。

### 4. 和 Testing Library 一起用

环境设为 happy-dom 即可，`render()` 会往当前 `document.body` 挂节点，其余用法不变。

### 5. SSR 或爬虫

用 **Window** 或 **Browser** 按需选：只解析一段 HTML 用 Window；要模拟多页、点击、导航用 Browser。

---

## 参考与延伸阅读

- [happy-dom GitHub](https://github.com/capricorn86/happy-dom)
- [happy-dom Wiki](https://github.com/capricorn86/happy-dom/wiki)（Getting started, Setup as Test Environment, Global Registrator, Jest Environment, Window/Browser API 等）
- [Vitest - environment](https://vitest.dev/config/#environment)
- [@happy-dom/global-registrator](https://www.npmjs.com/package/@happy-dom/global-registrator)
- [@happy-dom/jest-environment](https://www.npmjs.com/package/@happy-dom/jest-environment)

---

**小结**：happy-dom 用「子集 DOM + 性能优化」在 Node 里提供可用的 `document`/`window`，适合单测和轻量无头场景；用 **Window** 快速建 DOM，用 **Browser** 做多页/导航；在 Vitest/Jest/Node/Bun 里设为测试环境或配合 Global Registrator 即可全局使用。
