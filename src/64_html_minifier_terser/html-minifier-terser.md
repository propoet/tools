# html-minifier-terser 学习文档

> 高度可配置、基于 JavaScript 的 HTML 压缩器，由 Terser 团队维护；可同时压缩内联 CSS/JS，几乎所有选项默认关闭，需按需开启

## 📚 目录

1. [用大白话说：html-minifier-terser 是啥](#用大白话说html-minifier-terser-是啥)
2. [原理：怎么压、为什么选项默认关](#原理怎么压为什么选项默认关)
3. [与 cssnano、Terser 的关系](#与-cssnanoterser-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [常用选项一览](#常用选项一览)
6. [CLI 与 Node API](#cli-与-node-api)
7. [内联 CSS/JS 与自定义片段](#内联-cssjs-与自定义片段)
8. [特殊场景：忽略块、JSON-LD、SVG、非法标记](#特殊场景忽略块json-ldsvg非法标记)
9. [常见坑与最佳实践](#常见坑与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：html-minifier-terser 是啥

### 你遇到的问题（HTML 体积大时）

- **开发时**：为了可读性会写换行、注释、属性引号、冗余 type，HTML 体积偏大。
- **上线后**：首屏 HTML 越大，解析越慢；内联的 `<style>`、`<script>` 没压过，也会占不少字节。
- **只靠 gzip**：gzip 是「无损压缩」，不删东西；注释、多余空格、冗余属性压完还是占地方。

也就是说：**在「页面表现一致」的前提下，把 HTML（及内联 CSS/JS）变小**，就是 html-minifier-terser 要解决的问题。

### html-minifier-terser 帮你做啥

**html-minifier-terser**（原 html-minifier 的 Terser 维护分支）是一个 **高度可配置的 HTML 压缩器**：

1. **压 HTML**：去空白、去注释、去冗余属性、可选标签可删、属性引号可省、布尔属性可简写等，输出更短字符串。
2. **压内联 CSS**：`minifyCSS: true` 时，用 [clean-css](https://github.com/jakubpawlowicz/clean-css) 压 `<style>` 和 `style=""`。
3. **压内联 JS**：`minifyJS: true` 时，用 [Terser](https://github.com/terser/terser) 压 `<script>` 和事件属性（如 `onclick`），支持 ES6+。
4. **选项默认关**：几乎所有压缩选项**默认都是 false**，需要你显式开启，避免误伤模板/服务端标签；适合和构建管线配合，按项目调参。

一句话：**html-minifier-terser = 读 HTML → 解析成树 → 按选项删/改/压 → 输出更小的 HTML**；内联 CSS/JS 可一并压，选项多且默认保守。

---

## 原理：怎么压、为什么选项默认关

### 压缩流程：解析 → 变换 → 序列化

- **解析**：用基于 John Resig 的 HTML 解析器把字符串解析成**树结构**（标签、属性、文本、注释等节点），不是正则瞎替换。
- **变换**：根据你开启的选项在树上做操作：合并/删除空白、删注释、删冗余属性、删可选标签、改写属性写法等；内联 CSS/JS 交给 clean-css 和 Terser 处理。
- **序列化**：把树再转回 HTML 字符串输出。

这样做的**好处**：知道哪里是标签、哪里是属性、哪里是文本，不会把模板里的 `{{ }}` 或 `<?php ?>` 当普通文本乱改；通过 **ignoreCustomFragments** 等可保护指定片段。

### 为什么选项默认关

- HTML 常和**服务端模板**（Handlebars、EJS、PHP、Vue/React 服务端标签）混在一起，激进默认可能破坏 `{{ }}`、`<% %>` 等。
- 不同项目对「可删空白」「可去引号」「可删可选标签」的接受度不同，默认关让你**按需开启**，更安全。
- 官方建议：**先小范围试，再逐步加选项**，找到适合你项目的一组配置。

可以简单记：**解析成树 + 按选项改树 + 再输出 = 安全可控；默认关 = 避免误伤模板**。

---

## 与 cssnano、Terser 的关系

| 角色 | 作用 |
|------|------|
| **html-minifier-terser** | 压整份 HTML：去空白/注释/冗余属性、改写标签与属性；内联 CSS/JS 可委托给下文。 |
| **clean-css** | 被 html-minifier-terser 在 `minifyCSS: true` 时调用，只处理**内联**的 `<style>` 和 `style=""`，不处理外部 CSS 文件。 |
| **Terser** | 被 html-minifier-terser 在 `minifyJS: true` 时调用，只处理**内联**的 `<script>` 和事件属性，不处理外部 JS 文件。 |

**简单记**：  
- **外部 CSS** → 用 PostCSS + cssnano（或别的 CSS 压缩）单独压。  
- **外部 JS** → 用 Terser/esbuild 等单独压。  
- **HTML 本身 + 内联 style/script** → 用 html-minifier-terser，可选开 `minifyCSS`/`minifyJS` 一起压。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D html-minifier-terser
# 或
npm i html-minifier-terser --save-dev
```

### 使用方式

- **Node API**：`import { minify } from 'html-minifier-terser'`，`await minify(htmlString, options)`。
- **CLI**：全局安装后 `html-minifier-terser [options]`，或 `npx html-minifier-terser --help` 看选项；输入可为文件或 stdin。

---

## 常用选项一览

**重要**：下面除特别说明外，**默认都是 `false`**，要压就得显式开。

| 选项 | 说明 | 默认 |
|------|------|------|
| **collapseWhitespace** | 合并/删除文本节点中的多余空白 | false |
| **collapseBooleanAttributes** | 布尔属性省略值，如 `disabled="disabled"` → `disabled` | false |
| **removeComments** | 删除 HTML 注释 | false |
| **removeAttributeQuotes** | 在安全前提下去掉属性引号，如 `id="moo"` → `id=moo` | false |
| **removeEmptyAttributes** | 删除值为空或仅空格的属性 | false |
| **removeEmptyElements** | 删除内容为空的元素 | false |
| **removeOptionalTags** | 删除可选标签（如 `</body>` 前可省略的 `</p>` 等） | false |
| **removeRedundantAttributes** | 删除与默认值相同的属性（如 `type="text"` 的 input） | false |
| **removeScriptTypeAttributes** | 删除 `script` 上的 `type="text/javascript"` | false |
| **removeStyleLinkTypeAttributes** | 删除 `style`/`link` 上的 `type="text/css"` | false |
| **useShortDoctype** | 用短 doctype，如 `<!DOCTYPE html>` | false |
| **minifyJS** | 用 Terser 压内联 JS（`<script>`、事件属性） | false |
| **minifyCSS** | 用 clean-css 压内联 CSS（`<style>`、`style=""`） | false |
| **minifyURLs** | 用 relateurl 压属性中的 URL（可传 base URL） | false |
| **conservativeCollapse** | 与 collapseWhitespace 同用时，空白压成 1 个空格，不删光 | false |
| **preserveLineBreaks** | 与 collapseWhitespace 同用时，保留一处换行 | false |
| **continueOnParseError** | 遇到解析错误继续处理而不是抛错 | false |
| **ignoreCustomFragments** | 正则数组，匹配到的片段不参与压缩（如 `/\{\{[\s\S]*?\}\}/`） | 见文档 |
| **ignoreCustomComments** | 正则数组，匹配到的注释不删（如 `[/^!/]` 保留 `<!--!`） | 见文档 |
| **sortAttributes** / **sortClassName** | 按出现频率排序属性/类名，利于 gzip | false |

完整列表与细节见 [perfectionkills 的选项说明](http://perfectionkills.com/experimenting-with-html-minifier#options) 与 npm 包 README。

---

## CLI 与 Node API

### CLI

```bash
# 查看所有选项
html-minifier-terser --help

# 示例：压空白、去注释、压内联 JS
html-minifier-terser --collapse-whitespace --remove-comments --minify-js true -o out.html input.html
```

选项名多为「短横线」形式，如 `--collapse-whitespace`、`--remove-comments`、`--minify-js`、`--minify-css`。

### Node API（async）

```js
import { minify } from "html-minifier-terser";

const html = `
  <p title="blah" id="moo">  foo  </p>
  <!-- comment -->
`;

const result = await minify(html, {
  collapseWhitespace: true,
  removeComments: true,
  removeAttributeQuotes: true,
});
// 例如: '<p title=blah id=moo>foo</p>'
```

- **第一个参数**：HTML 字符串。
- **第二个参数**：选项对象；未传的选项保持默认（多数为 false）。
- **返回值**：压缩后的 HTML 字符串（Promise）。

若 HTML 不合法或选项导致异常，会抛错；可开 `continueOnParseError: true` 尽量继续。

---

## 内联 CSS/JS 与自定义片段

### minifyJS / minifyCSS

- **minifyJS**：`true` 时，内联 `<script>` 和 `on*` 等事件属性里的 JS 会交给 Terser 压；可传 Terser 的 options 对象，或 `function(text, inline) { return compressed; }` 自定义。
- **minifyCSS**：`true` 时，`<style>` 和 `style=""` 里的 CSS 会交给 clean-css 压；可传 clean-css 的 options，或 `function(text, type) { return compressed; }` 自定义。

模板/服务端语法若写在 `<script>` 或 `style` 里，可能被当 JS/CSS 压坏，可用 **ignoreCustomFragments** 或 **processScripts** 控制（例如只压 `text/javascript`，不压 `text/x-handlebars-template`）。

### ignoreCustomFragments

用于保护「不能当普通 HTML 压」的片段，例如模板变量：

```js
await minify(html, {
  ignoreCustomFragments: [/\{\{[\s\S]*?\}\}/, /<%[\s\S]*?%>/],
});
```

匹配到的内容会保留不压（内部仍可能被当文本处理，但不做标签/属性级的改写）。

### processScripts

默认只压「脚本」类型的 `<script>`；若有些是模板（如 `text/ng-template`），可指定只压哪些 type：

```js
processScripts: ["text/javascript"],
```

这样其他 type 的 script 内容不会被 minifyJS 处理。

---

## 特殊场景：忽略块、JSON-LD、SVG、非法标记

### 保留某块不压：htmlmin:ignore

在 HTML 里包一层注释即可：

```html
<!-- htmlmin:ignore -->
<div>这里整块不压</div>
<!-- htmlmin:ignore -->
```

### 压 JSON-LD

```js
await minify(html, { processScripts: ["application/ld+json"] });
```

会去掉 JSON-LD 里的换行和多余空白，不做真正 JSON 压缩；若需要更强压缩可自己先压 JSON 再塞回 HTML。

### SVG

SVG 标签会被自动识别：压的时候会**保留大小写和自闭合斜杠**，不受全局 `caseSensitive`、`keepClosingSlash` 等影响，避免 SVG 坏掉。

### 非法/不完整标记

**不能处理非法或「半截」的 HTML**：因为先解析成树再改再输出，输入必须是可解析的完整文档（或至少能补全成树）；半截标签、严重非法结构可能解析失败或结果不符合预期。建议先保证 HTML 合法再压。

---

## 常见坑与最佳实践

1. **选项默认关**：记得显式开 `collapseWhitespace`、`removeComments` 等，否则几乎不会变短。
2. **模板语法**：有 `{{ }}`、`<% %>`、`${}` 等时，用 **ignoreCustomFragments** 保护，或先渲染再压。
3. **内联 JS 报错**：若内联脚本依赖特殊格式（如保留某些注释），可关掉 `minifyJS` 或传自定义 function 只做空白压缩。
4. **构建管线**：通常放在「HTML 已生成」之后（如 Vite/Webpack 的 HTML 插件、或单独脚本读构建产物再写回），不要对未渲染的模板直接压。
5. **gzip 配合**：`sortAttributes`、`sortClassName` 不减少明文体积，但能提高 gzip 压缩率；传输时建议开 gzip/brotli。

---

## 参考与延伸阅读

- [html-minifier-terser npm](https://www.npmjs.com/package/html-minifier-terser)
- [GitHub](https://github.com/terser/html-minifier-terser)
- [perfectionkills - Experimenting with HTML minifier](http://perfectionkills.com/experimenting-with-html-minifier)（原理与选项详解）
- [Terser](https://github.com/terser/terser)、[clean-css](https://github.com/jakubpawlowicz/clean-css)（内联 JS/CSS 的底层）

---

**小结**：html-minifier-terser 用「解析成树 + 按选项变换 + 序列化」安全压 HTML，选项多且默认关；常用开 `collapseWhitespace`、`removeComments`、`removeAttributeQuotes`，需要时开 `minifyJS`/`minifyCSS`；模板语法用 ignoreCustomFragments 保护，非法/半截 HTML 无法可靠处理。
