# PostCSS 系列学习文档（合一）

> 核心引擎 + 常用插件（postcss-import、postcss-preset-env、postcss-scss、postcss-html、postcss-antd-fixes）的原理、用法与示例

## 📚 目录

### 第一部分：PostCSS 核心

1. [用大白话说：PostCSS 是啥](#一用大白话说postcss-是啥)
2. [原理：AST 与插件管线](#二原理ast-与插件管线)
3. [与 Sass、Less、构建工具的关系](#三与-sassless构建工具-的关系)
4. [安装与使用方式](#四安装与使用方式)
5. [核心 API：process、parse、插件](#五核心-apiprocessparse插件)
6. [插件写法与 AST 节点](#六插件写法与-ast-节点)
7. [配置文件与链式插件](#七配置文件与链式插件)

### 第二部分：postcss-import

8. [postcss-import：内联 @import](#八postcss-import内联-import)
9. [postcss-import 配置与顺序](#九postcss-import-配置与顺序)

### 第三部分：postcss-preset-env

10. [postcss-preset-env：现代/未来 CSS 转译](#十postcss-preset-env现代未来-css-转译)
11. [postcss-preset-env Stage 与配置](#十一postcss-preset-env-stage-与配置)

### 第四部分：postcss-scss

12. [postcss-scss：解析 SCSS 语法](#十二postcss-scss解析-scss-语法)
13. [postcss-scss 使用场景](#十三postcss-scss-使用场景)

### 第五部分：postcss-html

14. [postcss-html：解析 HTML 内嵌样式](#十四postcss-html解析-html-内嵌样式)
15. [postcss-html 支持的文件与 Stylelint](#十五postcss-html-支持的文件与-stylelint)

### 第六部分：postcss-antd-fixes

16. [postcss-antd-fixes：antd + Tailwind 修复](#十六postcss-antd-fixesantd--tailwind-修复)

### 收尾

17. [管线顺序与最佳实践](#十七管线顺序与最佳实践)
18. [参考与延伸阅读](#十八参考与延伸阅读)

---

## 本系列包一览

| 包 | 类型 | 作用 |
|------|------|------|
| **postcss** | 核心 | 解析 CSS → 插件链改 AST → 序列化 CSS |
| **postcss-import** | 插件 | 内联 `@import`，应放管线最前 |
| **postcss-preset-env** | 预设 | 按 browserslist 转译现代/未来 CSS（嵌套、颜色函数等） |
| **postcss-scss** | 语法 | 让 PostCSS 能解析 SCSS（不编译） |
| **postcss-html** | 语法 | 让 PostCSS 能解析 HTML/类 HTML 中的 `<style>` 块 |
| **postcss-antd-fixes** | 插件 | 修复 antd 与 Tailwind Preflight 的样式冲突 |

### 本目录示例文件

| 文件 | 说明 |
|------|------|
| `1.base.js` | PostCSS 核心：解析、简单插件、process 输出 |
| `postcss-import.example.js` | postcss-import：内联 @import（依赖同目录 `vars.css`、`block.css`） |
| `postcss-html.example.js` | postcss-html：解析 HTML 内联 `<style>` |
| `postcss-scss.example.js` | postcss-scss：解析 SCSS（不编译） |
| `postcss-antd-fixes.config.example.js` | antd + Tailwind 的 PostCSS 配置示例 |
| `postcss-preset-env.config.example.js` | postcss-preset-env + import + autoprefixer 配置示例 |

运行示例前请先 `pnpm install`，再在项目根目录执行：  
`node src/75_postcss/1.base.js`、`node src/75_postcss/postcss-import.example.js` 等。

---

# 第一部分：PostCSS 核心

## 一、用大白话说：PostCSS 是啥

### 你遇到的问题（CSS 要自动处理时）

- **加厂商前缀**：手写 `-webkit-`、`-moz-` 麻烦且易过时，希望按目标浏览器自动加。
- **用未来语法**：想写 `color: oklch(...)`、嵌套、自定义属性等，要转成当前浏览器能跑的。
- **压缩、检查、模块化**：希望一套管线里完成压缩、lint、`@import` 内联等。
- **框架需求**：Tailwind、CSS Modules 等都要在构建阶段改 CSS，需要统一入口。

也就是说：**在「解析 → 按规则改 CSS → 再输出」这件事上，提供可插拔的引擎**，就是 PostCSS 要解决的问题。

### PostCSS 帮你做啥

**PostCSS** 是一个 **用 JavaScript 转换 CSS 的工具**：

1. **解析**：把 CSS 字符串解析成 **AST（抽象语法树）**，节点有 Rule、Declaration、AtRule、Comment 等。
2. **插件管线**：按顺序执行一系列插件，每个插件遍历/修改 AST，前一个插件的输出是下一个的输入。
3. **输出**：把处理后的 AST 转回 CSS 字符串（可带 source map），供构建工具写文件。
4. **不绑死语法**：默认解析标准 CSS；配合 **postcss-scss**、**postcss-html** 等可解析 SCSS、HTML 内联样式等。

一句话：**PostCSS = 解析 CSS → 插件链改 AST → 序列化 CSS**，具体「加前缀、压缩、未来语法」由插件完成。

---

## 二、原理：AST 与插件管线

**核心思路**：不拿正则去瞎替换整块 CSS，而是：

1. **解析**：把 CSS 源码解析成 AST，每个选择器、每条声明、每个 @规则都是节点，可精确定位。
2. **遍历**：插件对 Root 做 `walk`（如 `root.walkDecls()`、`root.walkRules()`），在节点上增删改。
3. **序列化**：把 AST 转回 CSS 字符串；可选生成 source map。

这样做的**好处**：安全、可组合（只解析一次）、可扩展。

---

## 三、与 Sass、Less、构建工具的关系

| 角色 | 作用 |
|------|------|
| **PostCSS** | 解析与转换 CSS 的引擎，不负责「语法扩展」本身，由插件提供（如 postcss-preset-env、postcss-nested）。 |
| **Sass / Less** | 预处理器：自家语法（变量、嵌套、mixin）→ 编译成 CSS；通常先跑 Sass/Less，再跑 PostCSS（前缀、压缩等）。 |
| **postcss-scss** | 让 PostCSS **能解析** SCSS 语法；不替代 Sass 编译器。 |
| **Vite / Webpack** | 构建工具：调 PostCSS（postcss-load-config），把 PostCSS 集成进 CSS 处理管线。 |

---

## 四、安装与使用方式

### 安装（核心 + 本系列插件）

```bash
pnpm add -D postcss postcss-import postcss-preset-env postcss-scss postcss-html postcss-antd-fixes
```

### 使用方式

- **编程式**：`postcss(plugins).process(css, { from, to })`，在 Node 脚本里直接处理 CSS 字符串。
- **配置文件**：在项目根建 `postcss.config.js`，用 `plugins` 数组或对象列出插件；Vite、Webpack、Tailwind 等会通过 **postcss-load-config** 自动读取。

---

## 五、核心 API：process、parse、插件

### 基本用法

```javascript
import postcss from 'postcss';

const css = `.box { display: flex; user-select: none; }`;
const result = await postcss([]).process(css, { from: undefined });
console.log(result.css);
```

- **postcss(plugins)**：创建处理器。
- **result = await processor.process(css, options)**：处理 CSS；`result.css` 为输出，`result.map` 为 source map。
- **postcss.parse(css)**：只解析，返回 Root 节点。

### 插件形式

插件是一个函数，接收 **opts**，返回另一个函数，该函数接收 **root**（AST）、**result**，可遍历并修改 root：

```javascript
const myPlugin = (opts = {}) => (root, result) => {
  root.walkDecls('color', (decl) => {
    decl.value = decl.value.toUpperCase();
  });
};
postcss([myPlugin]).process(css).then((r) => console.log(r.css));
```

---

## 六、插件写法与 AST 节点

### 常用节点类型

| 类型 | 说明 |
|------|------|
| **Root** | 根节点，对应整份 CSS |
| **Rule** | 规则，如 `.a { }` |
| **Declaration** | 声明，如 `color: red` |
| **AtRule** | @规则，如 `@media`、`@import` |
| **Comment** | 注释 |

### 遍历方法（在 Root 或 Rule 上）

- **root.walkRules(callback)**、**root.walkDecls(callback)**、**root.walkAtRules(callback)**、**root.walkComments(callback)**、**root.walk(callback)**。  
在 callback 里可 `node.remove()`、`decl.after(anotherDecl)`、`rule.append(decl)` 等修改 AST。

---

## 七、配置文件与链式插件

### postcss.config.js 示例（含本系列）

```javascript
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-preset-env')({ stage: 2 }),
    require('autoprefixer'),
    require('cssnano'),
  ],
};
```

插件**顺序**很重要：一般先 **postcss-import**（内联 @import），再语法/前缀类，最后压缩。

---

# 第二部分：postcss-import

## 八、postcss-import：内联 @import

### 你遇到的问题（CSS 里写 @import 时）

- **原生 @import**：浏览器会发多次请求，且阻塞渲染；构建时希望把 `@import "a.css"` 内联成一份 CSS。
- **顺序**：后续插件需要对「完整的一份 CSS」工作，若 @import 不先内联，每个文件单独跑插件，会丢失上下文。
- **路径**：希望支持相对路径、node_modules（如 `@import "normalize.css"`）。

### postcss-import 帮你做啥

**postcss-import** 是一个 **PostCSS 插件**：

1. **内联 @import**：遇到 `@import "file.css"` 或 `@import url("file.css")`，按路径读取文件内容，替换成该文件内容（递归处理其中的 @import）。
2. **路径解析**：支持相对路径、绝对路径；可配置 **resolve** 支持 `node_modules`。
3. **顺序**：应放在管线**最前面**，这样后续插件拿到的是「已合并」的 CSS。

一句话：**postcss-import = 在 PostCSS 里把 @import 展开成一份完整 CSS**。

### 原理：为什么要在管线最前

- 若先跑 autoprefixer 再跑 postcss-import，autoprefixer 只看到「主文件」，看不到被 @import 的文件。
- 正确顺序：先 postcss-import（合并）→ 再 autoprefixer、postcss-preset-env、cssnano 等。

---

## 九、postcss-import 配置与顺序

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import')({
      path: ['src/styles'],
      resolve: (id, basedir) => { /* 自定义解析，返回路径 */ },
      skipDuplicates: true,
    }),
    require('autoprefixer'),
  ],
};
```

- **path**：解析时的额外目录。
- **resolve**：自定义如何把 `@import` 的 id 解析成文件路径。
- **skipDuplicates**：同一文件被多次 @import 时只内联一次。

---

# 第三部分：postcss-preset-env

## 十、postcss-preset-env：现代/未来 CSS 转译

### 你遇到的问题（想写现代 CSS 时）

- **嵌套、自定义属性、color-mix、oklch**：这些语法老浏览器不支持，希望构建时自动转成兼容写法。
- **不想手写多套**：希望写一份「现代 CSS」，由工具按目标浏览器转译。
- **目标浏览器可配置**：和 Babel、autoprefixer 一样，用 browserslist 指定「要兼容到哪」。

### postcss-preset-env 帮你做啥

**postcss-preset-env** 是一个 **PostCSS 预设（一组插件的集合）**：

1. **转译现代/未来 CSS**：嵌套、CSS 变量、`color-mix()`、`oklch()`、`@layer`、逻辑属性等，按目标浏览器支持情况转成兼容写法或 polyfill。
2. **Stage**：用 **stage**（0～4）控制「多未来的语法」要转译；stage 越小越激进，默认常用 stage 2。
3. **browserslist**：目标浏览器来自 **browserslist** 配置，和 Babel、autoprefixer 共用一套。

一句话：**postcss-preset-env = 读你的现代 CSS + 读 browserslist → 按需转译成兼容 CSS**。

### 与 autoprefixer、Babel 的关系

- **postcss-preset-env**：转译「现代/未来 CSS 语法」；目标浏览器来自 browserslist。
- **autoprefixer**：只做「加/删厂商前缀」；两者可同时用。
- **Babel**：转译 JS；browserslist 共用。

---

## 十一、postcss-preset-env Stage 与配置

- **stage 0**：实验性。**stage 1**：草案。**stage 2**：较稳定，**常用默认**。**stage 3**：基本稳定。**stage 4**：已稳定。
- 可单独开/关某类特性：`features: { 'nesting-rules': true }` 等。

```javascript
require('postcss-preset-env')({
  stage: 2,
  features: { 'nesting-rules': true, 'custom-properties': true },
  browsers: 'last 2 versions',
}),
```

---

# 第四部分：postcss-scss

## 十二、postcss-scss：解析 SCSS 语法

### 你遇到的问题（要在 SCSS 上跑 PostCSS 时）

- **PostCSS 默认只认纯 CSS**：遇到 `$var`、`&`、`@mixin`、`//` 等 SCSS 语法会报错。
- **Stylelint 想检查 .scss 文件**：需要一种「能解析 SCSS」的语法。

### postcss-scss 帮你做啥

**postcss-scss** 是一个 **PostCSS 的 syntax（语法）包**：

1. **解析 SCSS**：把 SCSS 源码解析成 PostCSS 能接受的 AST；支持变量、嵌套、`@mixin`/`@include`、`//` 注释等，**不编译**它们，只做「能往下传」的解析。
2. **不替代 Sass**：不负责把 SCSS 编译成 CSS；若你要最终 CSS，仍需 **sass** 先编译，再对编译结果跑 PostCSS。
3. **典型用法**：在 PostCSS 里 `process(scssContent, { syntax: require('postcss-scss') })`，或在 Stylelint 里对 `.scss` 设置 `customSyntax: 'postcss-scss'`。

一句话：**postcss-scss = 让 PostCSS「能读 SCSS」**，不负责把 SCSS 编译成 CSS。

### 原理：语法解析 vs 编译

- **解析**：把源码变成 AST，识别选择器、声明、mixin；postcss-scss 只做这一步，`@mixin`、`$var` 会作为「可识别的节点」保留。
- **编译**：把 SCSS 转成等价 CSS，这是 **sass** 的工作。多数项目是「先 Sass 编译 → 再 PostCSS 处理生成的 CSS」，此时不需要 postcss-scss；只有「直接对 SCSS 源码做 PostCSS/Stylelint」时才需要。

---

## 十三、postcss-scss 使用场景

1. **Stylelint 检查 .scss**：对 Vue/Svelte 里 `<style lang="scss">` 或独立 .scss 文件做 lint，需 postcss-scss（或 postcss-html + postcss-scss）。
2. **在 SCSS 上跑「不依赖完整编译」的 PostCSS 插件**：可用 postcss-scss 解析后跑插件；若插件需要「已展开的 CSS」，仍应先 Sass 编译再 PostCSS。
3. **PostCSS**：`process(scss, { from: 'file.scss', syntax: require('postcss-scss') })`。
4. **Stylelint**：`overrides: [{ files: ['**/*.scss'], customSyntax: 'postcss-scss' }]`。

---

# 第五部分：postcss-html

## 十四、postcss-html：解析 HTML 内嵌样式

### 你遇到的问题（要 lint/处理 HTML 里的 CSS 时）

- **PostCSS 默认只认「纯 CSS」**：遇到 `<style>`、Vue 单文件、Svelte 等里的样式块，要么先自己抠出来再传，要么解析报错。
- **Stylelint 想检查 Vue/Svelte 里的 style**：需要一种「能解析 HTML 和 `<style>` 块」的语法。

### postcss-html 帮你做啥

**postcss-html** 是一个 **PostCSS 的 syntax（语法）包**：

1. **解析 HTML 与类 HTML**：能解析 `.html`、Vue 单文件（`.vue`）、Svelte（`.svelte`）、Astro（`.astro`）、PHP、Quick App、XSLT 等。
2. **提取样式块**：识别 `<style>`、`<style lang="scss">` 等，把块内内容当作 CSS（或 SCSS 等）交给 PostCSS 处理。
3. **可选配合其它语法**：块内若是 SCSS，可配合 **postcss-scss**，先由 postcss-html 拆出块，再按对应语法解析块内容。

一句话：**postcss-html = 让 PostCSS 能「读 HTML/类 HTML 文件并解析其中的样式块」**，常用于 Stylelint、构建管线里对 Vue/Svelte 等做 CSS 处理。

### 原理：语法 vs 插件

- PostCSS 支持传入 **syntax** 选项，用自定义解析器把「非纯 CSS」源码解析成 PostCSS 能接受的 AST；postcss-html 就是这类解析器。

---

## 十五、postcss-html 支持的文件与 Stylelint

- **支持的文件类型**：.html、.vue、.svelte、.astro、.php 等（以 [postcss-html](https://github.com/gucong3000/postcss-html) 文档为准）。
- **在 PostCSS 里**：`postcss(plugins).process(htmlContent, { syntax: require('postcss-html') })`。
- **在 Stylelint 里**：为 `.vue`、`.svelte` 等指定 `customSyntax: 'postcss-html'`：

```javascript
export default {
  overrides: [
    { files: ['**/*.vue', '**/*.html'], customSyntax: 'postcss-html' },
  ],
};
```

---

# 第六部分：postcss-antd-fixes

## 十六、postcss-antd-fixes：antd + Tailwind 修复

### 你遇到的问题（Ant Design + Tailwind 时）

- **Ant Design（antd）**：组件库自带一套全局样式和 reset，依赖 `* { box-sizing: border-box; }`、列表样式等。
- **Tailwind Preflight**：Tailwind 的 base 层会做「全局重置」，如 `margin: 0`、列表 `list-style: none`、`padding: 0` 等。
- **一起用时**：Preflight 会覆盖或干扰 antd 组件依赖的默认样式，导致 antd 的表格、列表、表单等错位、错样。

### postcss-antd-fixes 帮你做啥

**postcss-antd-fixes** 是一个 **PostCSS 插件**：

1. **识别 antd 相关选择器**：针对 antd 组件用到的类名、标签（如 `.ant-*`）做处理。
2. **修复冲突**：通过增加选择器权重或插入覆盖规则，让 antd 组件在「有 Preflight」的环境下仍能按设计显示。
3. **可配置**：可按需开启/关闭某些修复（以官方文档/源码为准）。

一句话：**postcss-antd-fixes = 在 PostCSS 管线里对 antd 相关样式做「兼容 Preflight/全局 reset」的修补**。

### 使用方式

在 **PostCSS 配置**里加入插件，一般放在 **Tailwind 之后**、其它样式处理之前或之后：

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    'postcss-antd-fixes': {},
    autoprefixer: {},
  },
};
```

- **不用 Tailwind**：若没有 Preflight 等全局 reset，通常不需要本插件。

---

# 十七、管线顺序与最佳实践

1. **管线顺序**：**postcss-import**（最前）→ **postcss-preset-env** → **autoprefixer** → **cssnano**（最后）；antd + Tailwind 时在 tailwindcss 后加 **postcss-antd-fixes**。
2. **前缀**：用 **autoprefixer**，目标浏览器交给 **browserslist**。
3. **未来语法**：用 **postcss-preset-env**，按 stage 转译现代 CSS。
4. **压缩**：用 **cssnano**，放管线末尾。
5. **解析非标准 CSS**：在 `process` 里用 **syntax** 选项（postcss-scss、postcss-html）。
6. **Lint**：对 .scss、.vue 等用 Stylelint + **postcss-scss** / **postcss-html** 的 customSyntax。
7. **自己写插件**：只改关心的节点，用 `node.clone()` 避免误改共享引用。

---

# 十八、参考与延伸阅读

- [PostCSS 官方文档](https://postcss.org/docs/) · [API](https://postcss.org/api/) · [插件列表](https://www.postcss.parts/) · [编写插件](https://postcss.org/docs/writing-a-postcss-plugin)
- [postcss-import](https://github.com/postcss/postcss-import) · [postcss-preset-env](https://github.com/csstools/postcss-preset-env) · [PostCSS Preset Env 文档](https://preset-env.cssdb.org/)
- [postcss-scss](https://github.com/postcss/postcss-scss) · [postcss-html](https://github.com/gucong3000/postcss-html) · [postcss-antd-fixes](https://github.com/yunsii/postcss-antd-fixes)
- [PostCSS Syntax](https://postcss.org/docs/syntax) · [Stylelint 自定义语法](https://stylelint.io/user-guide/usage/options#customsyntax) · [browserslist](https://github.com/browserslist/browserslist)
