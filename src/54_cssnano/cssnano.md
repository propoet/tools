# cssnano 学习文档

> 基于 PostCSS 的 CSS 压缩器，把样式表压到尽可能小，适合生产环境

## 📚 目录

1. [用大白话说：cssnano 是啥](#用大白话说cssnano-是啥)
2. [原理：压缩是什么、怎么压](#原理压缩是什么怎么压)
3. [与 PostCSS、gzip 的关系](#与-postcssgzip-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [Preset 预设系统](#preset-预设系统)
6. [优化项一览（通俗解释）](#优化项一览通俗解释)
7. [配置方式与示例](#配置方式与示例)
8. [常见坑与最佳实践](#常见坑与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：cssnano 是啥

### 你遇到的问题（CSS 太大时）

- **开发时**：为了可读性会写换行、注释、长颜色名、重复规则，文件体积偏大。
- **上线后**：用户下载的 CSS 越大，首屏越慢；移动端和弱网下更明显。
- **只靠 gzip**：gzip 是「无损压缩」，不删东西，只编码；很多冗余（注释、空格、重复）压完还是占地方。

也就是说：**在「看起来一样」的前提下，把 CSS 变小**，就是 cssnano 要解决的问题。

### cssnano 帮你做啥

**cssnano** 是一个 **PostCSS 插件**，专门做 **CSS 压缩（minification）**：

1. **删冗余**：去掉注释、多余空格、无用的空规则，让字节数变少。
2. **改写等价短写法**：颜色 `#ff0000` → `red`，`margin: 10px 20px 10px 20px` → `margin: 10px 20px`，单位、数值能缩短就缩短。
3. **合并与归一化**：相同选择器的规则合并、重复声明去掉、属性顺序统一（有时能帮助 gzip 压得更好）。
4. **可选「激进」优化**：用 advanced 预设时，还会做合并同名 keyframes、删未使用规则等，体积更小但更「有损」，需按项目选择。

一句话：**cssnano = 读你的 CSS → 在 PostCSS 管线里做一堆「变小」的变换 → 输出更小的 CSS**，页面表现不变，文件更小。

---

## 原理：压缩是什么、怎么压

### 压缩（Minification）是什么

- **Minification（压缩/最小化）**：用各种手段**减少文件体积**，会**改内容**（删注释、改写法、合并规则），所以是「有损」的——但保证**浏览器解析后的效果一致**。
- **Gzip/Brotli**：是「无损」压缩，只改编码方式，不删不改逻辑；解压后和原始字节一致。
- **最佳实践**：先做 **cssnano 压缩**，再做 **gzip/brotli** 传输，体积最小。

可以这么记：**cssnano 负责「把废话和冗长写法删掉、缩短」；gzip 负责「把剩下来的字节再编码压一遍」**。

### cssnano 怎么压：基于 PostCSS AST

**核心思路**：cssnano 不拿正则去瞎替换整块 CSS 字符串，而是：

1. **解析**：PostCSS 先把 CSS 解析成 **AST（抽象语法树）**，树上有「规则」「声明」「@规则」等节点，语义清晰。
2. **插件化优化**：cssnano 由 **很多小插件** 组成，每个插件只做一类事（例如只管颜色、只管空格、只管合并规则），在 AST 上**按节点类型、属性名做变换**，安全可控。
3. **序列化**：处理完的 AST 再被 PostCSS 转回 CSS 字符串，写入文件。

这样做的**好处**：

- **不会误伤**：不会因为一串字符长得像颜色就把别的地方改坏；只有「语法上」是颜色/声明/选择器的才会被对应插件动。
- **可组合**：和 autoprefixer、Tailwind 等一起挂在 PostCSS 里，**只解析一次 CSS**，多个插件共用同一棵 AST，速度快。
- **可配置**：通过「预设」和「插件开关」控制做哪些优化、做到多狠。

### 通俗类比

- **正则压缩**：像用「查找替换」在整篇文档里改字——容易误改、难维护。
- **AST + 插件**：像先给文章做「分词 + 标点 + 段落」的结构分析，再按规则只改「数字」「标点」「重复句」等，改哪里一目了然，也安全。

---

## 与 PostCSS、gzip 的关系

| 角色 | 作用 |
|------|------|
| **PostCSS** | 把 CSS 解析成 AST，再按插件顺序依次处理，最后输出 CSS；cssnano 是其中一个插件。 |
| **cssnano** | 在 AST 上做「缩小体积」的各类优化（去空格、缩短颜色、合并规则等）。 |
| **gzip/brotli** | 对**已经 minify 过的** CSS 做传输层压缩；通常由服务器/CDN 做。 |

**简单记**：  
你用 **PostCSS** 跑一堆插件（如 autoprefixer + cssnano）；**cssnano** 只负责「把 CSS 压小」；**gzip** 再对输出做一次编码压缩，两者配合效果最好。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D cssnano postcss
# 或
npm i -D cssnano postcss
```

- cssnano 是 **PostCSS 插件**，所以需要同时安装 **postcss**；构建工具（Vite、Webpack）若已集成 PostCSS，只需加 cssnano 即可。

### 使用方式

**1. 不单独跑**：没有独立 CLI，只在 **PostCSS 管线**里作为插件使用。

**2. 在 PostCSS 配置里加 cssnano**

例如 `postcss.config.js`：

```js
module.exports = {
  plugins: [
    require('cssnano')({ preset: 'default' }),
  ],
};
```

**3. 用 PostCSS CLI 压单文件**

```bash
pnpm add -D postcss-cli
npx postcss input.css -o output.css
```

**4. 在 Webpack 里**

- 用 **postcss-loader** 时，在 PostCSS 插件列表里加 cssnano；或  
- 用 **css-minimizer-webpack-plugin**，内部可配 cssnano。

**5. 在 Vite 里**

- 生产构建默认会做 CSS 压缩，Vite 用的就是 **cssnano**（通过依赖）；也可在 `vite.config.js` 里通过 `build.minify: 'css'` 等与 PostCSS 插件配合。

---

## Preset 预设系统

从 **cssnano 4** 开始，用「预设」决定**做哪些优化、做到多狠**；不同预设包含的插件不同。

### 三种预设（通俗理解）

| 预设 | 通俗理解 | 适用场景 |
|------|----------|----------|
| **default** | 只做「安全、可逆」的变换：去空格/注释、缩短颜色和单位、合并明显重复等 | 绝大多数项目，推荐默认用 |
| **advanced** | 在 default 基础上再加「激进」优化：合并同名 keyframes、删未使用 CSS、改 z-index 等，可能在某些极端写法下影响表现 | 追求极致体积、且能接受少量有损 |
| **lite** | 只做很少几项（如去注释、去空规则、归一化空格），体积减得少，但最保守 | 不想动太多、只求稍微变小 |

### 预设如何生效

- **显式指定**（推荐）：在 PostCSS 配置里写 `preset: 'default'` 或 `preset: ['default', { ... }]`。
- **未指定时**：cssnano 会从当前目录往上看 `package.json` 的 `cssnano` 字段或 `cssnano.config.js`，若都没有则用 **default**。

### 给预设传参（例如关掉某一条优化）

```js
require('cssnano')({
  preset: [
    'default',
    {
      discardComments: { removeAll: true },  // 去掉所有注释
      svgo: false,                           // 关掉 SVGO 内联 SVG 优化
    },
  ],
})
```

---

## 优化项一览（通俗解释）

下面按「在做什么」用大白话归纳；具体是否启用取决于你用的 **preset**（default / advanced / lite）。

| 优化名 | 大白话 | 示例 |
|--------|--------|------|
| **discardComments** | 删注释 | `/* 保留版权 */` → 可配置保留或全删 |
| **discardEmpty** | 删空规则 | ` .a { } ` → 整条规则删掉 |
| **normalizeWhitespace** | 规范空格 | 换行、多余空格 → 能合并的合并、该留一个留一个 |
| **colormin** | 颜色写最短 | `#ff0000` → `red`，`rgba(255,0,0,1)` → `red` |
| **convertValues** | 单位/数值能短就短 | `0.5px` → `.5px`，`500ms` → `.5s`（在安全范围内） |
| **reduceInitial** | 用 initial 代替一长串初始值 | 能用 `initial` 的用 `initial`（若更短） |
| **mergeLonghand** | 把拆开的属性合并成简写 | `margin-top:1px; margin-right:2px;...` → `margin:1px 2px ...`（在等价时） |
| **mergeRules** | 同选择器多规则合并成一条 | `.a{color:red}.a{font-size:12px}` → `.a{color:red;font-size:12px}` |
| **discardDuplicates** | 同规则内重复声明去重 | 只保留最后一条等价的 |
| **discardOverridden** | 前面被后面覆盖的声明删掉 | 前面无效的声明直接删 |
| **minifySelectors** | 选择器缩短 | 在保证等价前提下缩短选择器写法 |
| **minifyParams** | @规则参数缩短 | 如 `@media ( min-width: 400px )` 里空格/括号精简 |
| **minifyFontValues** | font 缩写 | 把 font 相关属性合并成更短形式 |
| **minifyGradients** | 渐变写法缩短 | 渐变语法能短则短 |
| **normalizeDisplayValues** | display 值统一 | 如 `inline flex` 等统一成标准写法 |
| **normalizePositions** | position 值统一 | 如 `left: 0` 与 `right: 0` 等归一化 |
| **normalizeTimingFunctions** | 缓动函数统一 | `ease`、`cubic-bezier(...)` 等统一写法 |
| **normalizeString** | 字符串引号等 | 统一引号、转义等 |
| **normalizeUnicode** | Unicode 写法 | 能缩短的 Unicode 写法缩短 |
| **normalizeUrl** | url() 写法 | 统一、缩短 url() |
| **normalizeRepeatStyle** | background-repeat 等 | 如 `repeat-x` 等统一 |
| **orderedValues** | 属性值内部排序 | 如 border 里 width/style/color 顺序统一，有时利于 gzip |
| **reduceTransforms** | transform 合并/简化 | 多个 transform 能合并的合并 |
| **cssDeclarationSorter** | 声明排序 | 属性按字母等排序，利于 gzip 和 diff |
| **svgo** | 内联 SVG 用 SVGO 压 | 对 CSS 里的 data URI SVG 做一次 SVGO |
| **uniqueSelectors** | 选择器去重 | 同规则内相同选择器合并 |
| **calc** | 化简 calc() | 能算成常数的就变成常数 |
| **normalizeCharset** | charset 规范 | 如保证 `@charset "UTF-8";` 一致 |
| **zindex**（advanced） | 重写 z-index 为更小整数 | 减少 z-index 位数，略激进 |
| **reduceIdents**（advanced） | 缩短 keyframes 等名字 | 如 `animation-name` 的标识符缩短 |
| **mergeIdents**（advanced） | 合并相同 keyframes | 同名同内容的 @keyframes 合并 |
| **discardUnused**（advanced） | 删未使用的 @规则 | 如未用到的 @keyframes，有误删风险需谨慎 |
| **autoprefixer**（advanced） | 可先跑 autoprefixer 再压 | 与独立 autoprefixer 配合使用时的选项 |

- **default**：只包含上面表中「安全」的那一大类。  
- **advanced**：再多出 zindex、reduceIdents、mergeIdents、discardUnused 等。  
- **lite**：只含很少几项（如 discardComments、discardEmpty、normalizeWhitespace）。

---

## 配置方式与示例

### 1. 在 postcss.config.js 里（推荐）

```js
module.exports = {
  plugins: [
    require('cssnano')({
      preset: ['default', {
        discardComments: { removeAll: true },
        svgo: false,
      }],
    }),
  ],
};
```

### 2. 在 package.json 里

```json
{
  "cssnano": {
    "preset": ["default", { "discardComments": { "removeAll": true } }]
  }
}
```

### 3. 使用 cssnano.config.js

```js
const defaultPreset = require('cssnano-preset-default');
module.exports = defaultPreset({
  discardComments: { removeAll: true },
});
```

### 4. 关掉某个优化

- 设为 `false`：该插件不跑。  
- 或设 `exclude: true`（在支持该选项的插件上）：

```js
preset: ['default', { svgo: false }]
// 或
preset: ['default', { svgo: { exclude: true } }]
```

### 5. 选项名与 postcss-xxx 的对应关系

配置里**去掉 `postcss-` 前缀**，剩下部分转成 **camelCase**。例如：

- `postcss-svgo` → 配置里写 `svgo`
- `postcss-discard-comments` → `discardComments`

---

## 常见坑与最佳实践

### 常见坑

1. **advanced 的 discardUnused**：会删「认为未使用」的 @keyframes 等，若你的类名/动画是 JS 动态拼的，可能被误删，建议 advanced 时关掉或慎用。
2. **zindex / reduceIdents**：会改 z-index 和动画名，若 JS 里写死了这些值，可能对不上；用 advanced 时要留意。
3. **只装 cssnano 没装 postcss**：构建报错，记得一起装 `postcss`。
4. **开发环境也开 cssnano**：没必要，且报错时行号会错位；一般只在生产构建里开。

### 最佳实践

- **默认用 default 预设**，够用且安全。  
- **生产构建再开 cssnano**，开发环境可关掉，方便看源码和行号。  
- **先 cssnano 再 gzip**：构建产物用 cssnano 压，部署后用服务器/CDN 开 gzip 或 brotli。  
- **要保留版权注释**：用 `discardComments: { removeAll: false }` 或保留特定注释（视插件支持）。  
- **有内联 SVG 且怕被改坏**：可关掉 `svgo`。  
- 使用 **advanced** 前在 CI 里做一次完整前端测试，避免激进优化导致样式或动画异常。

---

## 参考与延伸阅读

- [cssnano 官网](https://cssnano.github.io/cssnano/)
- [Introduction](https://cssnano.github.io/cssnano/docs/introduction/)：什么是 minification、什么是 cssnano
- [What are optimisations?](https://cssnano.github.io/cssnano/docs/what-are-optimisations/)：各优化项与 preset 对照表
- [Getting started](https://cssnano.github.io/cssnano/docs/getting-started/)：安装、PostCSS CLI、Webpack 等
- [Presets](https://cssnano.github.io/cssnano/docs/presets/)：预设与配置写法
- [PostCSS](https://postcss.org/)：AST 与插件生态

---

**小结**：cssnano 是 PostCSS 生态里的 CSS 压缩插件，通过 **AST + 多插件** 做安全、可配置的 minify；配合 **default/advanced/lite** 预设和 gzip，能在保证效果不变的前提下显著减小 CSS 体积。
