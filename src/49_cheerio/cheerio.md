# cheerio 学习文档

> Node.js 下用 jQuery 风格解析与操作 HTML/XML

## 📚 目录

1. [用大白话说：cheerio 是啥](#用大白话说cheerio-是啥)
2. [原理：HTML 解析与 jQuery 风格 API](#原理html-解析与-jquery-风格-api)
3. [安装与引入](#安装与引入)
4. [加载文档：load 与选项](#加载文档load-与选项)
5. [选择与遍历](#选择与遍历)
6. [读取与修改](#读取与修改)
7. [与 jQuery / 浏览器的区别](#与-jquery--浏览器的区别)
8. [完整示例](#完整示例)
9. [常见坑与最佳实践](#常见坑与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：cheerio 是啥

### 你遇到的问题（在 Node 里处理 HTML 时）

- **要解析 HTML**：从接口、文件或爬虫拿到一段 HTML，想按标签、class、id 取内容或改结构。
- **不想起浏览器**：不需要渲染、不跑 JS、不加载图片，只要「解析 + 查 + 改」，用 Puppeteer/Playwright 太重。
- **想用熟悉语法**：jQuery 的 `$('selector')`、`.text()`、`.attr()`、`.find()` 在服务端也能用就好了。

也就是说：**在 Node 里用 jQuery 风格解析、查询、修改 HTML/XML**，就是 cheerio 要解决的。

### cheerio 帮你做啥

**cheerio** 是 **Node.js 的 HTML/XML 解析与操作库**：

1. **jQuery 风格 API**：`load(html)` 得到 `$`，用 `$('selector')` 选择、`.text()`/`.html()`/`.attr()` 读写、`.find()`/`.parent()` 遍历、`.append()`/`.remove()` 修改，语法和 jQuery 很像。
2. **不跑浏览器**：只解析标记、不渲染、不执行 JS、不加载外部资源，所以**快、省资源**。
3. **支持 XML**：`load(html, { xml: true })` 可解析 XML（RSS、SVG 等）。
4. **输出 HTML**：改完后用 `$.html()` 得到字符串，可写回文件或响应。

一句话：**cheerio = 在 Node 里用 jQuery 方式解析和操作 HTML/XML**，适合爬虫、HTML 转换、模板处理等；需要「真浏览器」时用 Puppeteer/Playwright。

---

## 原理：HTML 解析与 jQuery 风格 API

**核心思路**：cheerio 先把 HTML 字符串**解析成 DOM 树**（内部用 htmlparser2 等解析器，得到类似 DOM 的节点树），再在这棵树上实现 **jQuery 风格的 API**：选择器、遍历、读写属性/文本、增删节点；不执行 JS、不渲染，只做「解析 + 内存中的 DOM 操作」，最后可再序列化回 HTML 字符串。

- **解析**：load(html) 时用解析器把 HTML 转成节点树（Element、Text 等）；支持不完整 HTML、可配置是否忽略大小写等；XML 模式用 XML 解析规则。
- **选择器**：用 css-select 等库把 CSS 选择器转成「在节点树上匹配」的逻辑，$('selector') 返回匹配节点的集合（类 jQuery 对象），可链式调用 .find()、.attr()、.text() 等。
- **与浏览器区别**：没有布局、样式、脚本执行；选择器只基于标签/属性/类/id 等静态结构，不包含 :hover、动态插入的 DOM；适合服务端抓取、模板处理，不适合需要执行 JS 的页面。

---

## 安装与引入

### 安装

```bash
pnpm add cheerio
# 或
npm i cheerio
```

### 引入

```javascript
// ESM
import * as cheerio from 'cheerio';

// CommonJS
const cheerio = require('cheerio');
```

### 基本用法

```javascript
const $ = cheerio.load('<h2 class="title">Hello</h2>');
$('h2.title').text();        // "Hello"
$('h2.title').text('Hi!');   // 修改文本
$.html();                    // 输出整份 HTML 字符串
```

---

## 加载文档：load 与选项

### load(html, options?)

- **html**：HTML 或 XML 字符串。
- **options**：可选，常用如下。

| 选项 | 说明 |
|------|------|
| **xml** / **xmlMode** | 设为 `true` 按 XML 解析（如 RSS、SVG）；新版推荐 `xml: true`。 |
| **decodeEntities** | 是否解码 HTML 实体（如 `&amp;` → `&`），默认 true。 |
| **script** | 是否解析并保留 `<script>` 标签内容。 |
| **style** | 是否解析并保留 `<style>` 标签内容。 |

```javascript
const $ = cheerio.load('<p>&amp; &lt;</p>');
$('p').text(); // "& <"（decodeEntities 默认 true）

const $xml = cheerio.load(rssString, { xml: true });
$xml('item').each((i, el) => { ... });
```

- 从文件或网络读 HTML 时，先拿到字符串再 `load`，例如 `cheerio.load(fs.readFileSync('a.html', 'utf-8'))` 或 `cheerio.load(await response.text())`。

---

## 选择与遍历

### 选择器 $(selector)

- 使用 **CSS 选择器**（与 jQuery 类似）：标签、class、id、属性、伪类等。

```javascript
$('div');           // 所有 div
$('.title');        // class="title"
$('#main');         // id="main"
$('a[href]');       // 带 href 的 a
$('ul li:first-child');
$('input[type="text"]');
```

### 遍历方法

| 方法 | 说明 |
|------|------|
| **.find(selector)** | 在当前集合的子节点中查找匹配 selector 的节点。 |
| **.children(selector?)** | 直接子节点，可选按 selector 过滤。 |
| **.parent()** | 父节点。 |
| **.parents(selector?)** | 所有祖先，可选过滤。 |
| **.next() / .prev()** | 下一个/上一个兄弟。 |
| **.eq(i)** | 取第 i 个（从 0 开始）。 |
| **.first() / .last()** | 第一个/最后一个。 |
| **.each(fn)** | 遍历，`fn(i, element)`；可用 `$(element)` 包成 Cheerio 再操作。 |

```javascript
$('ul').find('li').each((i, el) => {
  console.log($(el).text());
});
$('li').eq(0).text();
$('div').children('.item');
```

---

## 读取与修改

### 读取

| 方法 | 说明 |
|------|------|
| **.text()** | 当前集合所有节点的文本拼接（去标签）。 |
| **.text(newText)** | 设置文本（会覆盖子节点）。 |
| **.html()** | 第一个节点的 innerHTML。 |
| **.html(newHtml)** | 设置 innerHTML。 |
| **.attr(name)** | 第一个节点某属性值。 |
| **.attr(name, value)** | 设置属性；value 为 null 可删除属性。 |
| **.val()** | 表单元素 value（如 input）。 |

```javascript
$('h1').text();
$('a').attr('href');
$('input').val();
```

### 修改结构

| 方法 | 说明 |
|------|------|
| **.append(content)** | 在内部末尾插入。 |
| **.prepend(content)** | 在内部开头插入。 |
| **.after(content) / .before(content)** | 在节点后/前插入兄弟。 |
| **.remove()** | 移除当前节点。 |
| **.replaceWith(content)** | 用新内容替换。 |
| **.addClass(name) / .removeClass(name)** | 增/删 class。 |
| **.attr(name, value)** | 设置属性。 |

```javascript
$('body').append('<p>New</p>');
$('h2.title').after('<h3>Sub</h3>');
$('.old').remove();
$('div').addClass('box');
```

### 输出

- **$.html()**：返回当前加载的文档的 HTML 字符串（含你做的修改）。

```javascript
const $ = cheerio.load('<div>a</div>');
$('div').append('<span>b</span>');
console.log($.html()); // 含 <div>a<span>b</span></div>
```

---

## 与 jQuery / 浏览器的区别

- **cheerio 不是浏览器**：不渲染、不执行 JS、不加载 CSS/图片/字体，不触发事件。只是「解析 + DOM 树 + API 操作」。
- **API 是 jQuery 的子集**：选择、遍历、读写、增删和 jQuery 很像，但并非 100% 一致；动画、事件绑定等没有。
- **需要「真浏览器」时**：例如 SPA 首屏要执行 JS 才出 HTML、要截图、要点击交互，用 **Puppeteer** 或 **Playwright**；cheerio 只适合**静态 HTML/XML 的解析与转换**。

---

## 完整示例

### 示例 1：从 HTML 字符串提取链接与标题

```javascript
import * as cheerio from 'cheerio';

const html = `
  <ul>
    <li><a href="/a">Link A</a></li>
    <li><a href="/b">Link B</a></li>
  </ul>
`;
const $ = cheerio.load(html);
const links = [];
$('ul a').each((i, el) => {
  links.push({ href: $(el).attr('href'), text: $(el).text() });
});
console.log(links);
// [{ href: '/a', text: 'Link A' }, { href: '/b', text: 'Link B' }]
```

### 示例 2：读文件、改内容、写回

```javascript
import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('index.html', 'utf-8');
const $ = cheerio.load(html);
$('title').text('New Title');
$('body').append('<script src="app.js"></script>');
fs.writeFileSync('index.out.html', $.html());
```

### 示例 3：配合 axios 抓取页面并提取列表

```javascript
import * as cheerio from 'cheerio';
import axios from 'axios';

const { data } = await axios.get('https://example.com/list');
const $ = cheerio.load(data);
$('.item').each((i, el) => {
  const title = $(el).find('.title').text().trim();
  const link = $(el).find('a').attr('href');
  console.log(title, link);
});
```

---

## 常见坑与最佳实践

1. **先 load 再操作**：只有 `cheerio.load(html)` 返回的 `$` 才能选择该文档里的节点；不同 load 的 `$` 之间不能混用。
2. **选择器返回的是「集合」**：`.text()`、`.attr()` 等读操作通常取**第一个**元素；写操作会作用到集合里**所有**元素。
3. **each 里用 $(el)**：`each((i, el) => { ... })` 里 `el` 是底层节点，要用 `$(el)` 包成 Cheerio 再调 `.text()`、`.attr()` 等。
4. **XML 用 xml: true**：解析 RSS、SVG 等 XML 时加 `load(xml, { xml: true })`，否则可能标签/属性解析异常。
5. **编码**：从文件或网络读时注意编码（如 UTF-8）；`load` 的输入是字符串，不负责解码二进制。
6. **大文档**：超大 HTML 时解析会占内存；若只需局部，可先用正则或流式处理裁出一段再交给 cheerio。

---

## 参考与延伸阅读

- [Cheerio 官方文档](https://cheerio.js.org/)
- [Cheerio GitHub](https://github.com/cheeriojs/cheerio)
- [Cheerio 中文网](https://www.cheeriojs.cn/)
- 需要执行 JS、渲染页面时：本仓库 [35_playwright/playwright.md](../35_playwright/playwright.md)；或使用 Puppeteer。

---

**文档版本**：针对 cheerio 当前 API 整理；具体以官方文档为准。
