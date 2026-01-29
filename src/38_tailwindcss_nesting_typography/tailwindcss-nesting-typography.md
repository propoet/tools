# @tailwindcss/nesting 与 @tailwindcss/typography 学习文档

## 📚 目录

1. [概述](#概述)
2. [@tailwindcss/nesting](#tailwindcssnesting)
3. [@tailwindcss/typography](#tailwindcsstypography)
4. [Tailwind v3 与 v4 差异速查](#tailwind-v3-与-v4-差异速查)
5. [参考链接](#参考链接)

---

## 概述

| 包 | 作用 |
|----|------|
| **@tailwindcss/nesting** | PostCSS 插件，在 Tailwind 之前处理 CSS 嵌套，并正确理解 `@apply`、`@screen` 等 Tailwind 语法 |
| **@tailwindcss/typography** | 官方 Tailwind 插件，提供 `prose` 等排版类，用于「不可控 HTML」（Markdown 渲染、CMS 内容等）的默认样式 |

两者独立：nesting 解决「写嵌套 CSS + Tailwind」的兼容问题；typography 解决「正文/文章内容」的排版样式。

---

## @tailwindcss/nesting

### 是什么

- **PostCSS 插件**，包装 [postcss-nested](https://github.com/postcss/postcss-nested) 或 [postcss-nesting](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting)，作为**兼容层**。
- 保证嵌套插件在 Tailwind 之前运行，且能正确理解 Tailwind 的自定义语法（如 `@apply`、`@screen`、`@tailwind` 等），不会误解析或报错。
- **默认**使用 Sass 风格嵌套（postcss-nested）；可选改用**标准 CSS Nesting 规范**（postcss-nesting）。

### 何时需要

- 你在 **PostCSS + Tailwind** 管线里写 **嵌套 CSS**（如把 `.card { .title { } }` 写在 CSS 里），而不是只用 Tailwind 工具类。
- 若使用 **Sass/Less/Stylus** 做嵌套，由预处理器先跑，一般不需要本插件；若**不用预处理器、只用 PostCSS**，推荐用 `@tailwindcss/nesting`（或 Tailwind 自带的 `tailwindcss/nesting`）做嵌套。

### 安装与配置

#### 方式 A：独立包 @tailwindcss/nesting

```bash
pnpm add -D @tailwindcss/nesting
# 或
npm install -D @tailwindcss/nesting
```

**postcss.config.js**（必须放在 **tailwindcss 之前**，通常也在 postcss-import 之后）：

```javascript
module.exports = {
  plugins: [
    require('postcss-import'),
    require('@tailwindcss/nesting'),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
```

**默认行为**：内部使用 **postcss-nested**，Sass 风格嵌套，例如：

```css
.card {
  padding: 1rem;
  .title {
    font-size: 1.25rem;
  }
  @apply rounded-lg;
}
```

#### 方式 B：使用标准 CSS Nesting（postcss-nesting）

若希望遵循 [CSS Nesting 规范](https://drafts.csswg.org/css-nesting-1/)（如嵌套选择器需用 `&` 等），先安装：

```bash
pnpm add -D @tailwindcss/nesting postcss-nesting
```

配置中把 **postcss-nesting** 作为参数传入：

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('@tailwindcss/nesting')(require('postcss-nesting')),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
```

#### 方式 C：Tailwind 自带的 tailwindcss/nesting（无需单独装包）

Tailwind CSS v3 起内置了嵌套支持，可直接在 PostCSS 配置里写 `tailwindcss/nesting`，**无需安装 @tailwindcss/nesting**：

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},   // 默认 postcss-nested
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

使用标准 CSS Nesting 时（需先安装 postcss-nesting）：

```bash
pnpm add -D postcss-nesting
```

```javascript
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Next.js 等框架若限制 `require()`，可用对象写法：

```javascript
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 与 postcss-preset-env 同时用时

若项目里用了 **postcss-preset-env**，建议关闭其内置的 nesting，交给 `tailwindcss/nesting` 处理，避免重复或冲突：

```javascript
module.exports = {
  plugins: [
    require('postcss-import'),
    require('@tailwindcss/nesting')(require('postcss-nesting')),
    require('tailwindcss'),
    require('postcss-preset-env')({
      features: { 'nesting-rules': false },
    }),
    require('autoprefixer'),
  ],
};
```

### 小结

| 需求 | 做法 |
|------|------|
| 用 Tailwind 且要写嵌套 CSS | 在 PostCSS 里加 `@tailwindcss/nesting` 或 `tailwindcss/nesting`，且排在 tailwindcss 之前 |
| Sass 风格嵌套（默认） | 不传参，用 postcss-nested |
| 标准 CSS Nesting | 安装 postcss-nesting，并传入：`require('@tailwindcss/nesting')(require('postcss-nesting'))` 或 `'tailwindcss/nesting': 'postcss-nesting'` |

---

## @tailwindcss/typography

### 是什么

- 官方插件，为**不可控的 HTML**（Markdown 转的、CMS 来的、富文本等）提供一套排版样式。
- 通过 **`prose`** 等类名，一次性给文章容器内的 `h1`、`p`、`ul`、`blockquote`、`code`、`table` 等元素应用协调的字体、间距、颜色，无需手写大量 CSS 或关掉 Tailwind 的 base。

### 安装

```bash
pnpm add -D @tailwindcss/typography
# 或
npm install -D @tailwindcss/typography
```

### 启用插件

**Tailwind v4**（CSS 中）：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

**Tailwind v3**（JS 配置）：

```javascript
// tailwind.config.js
module.exports = {
  theme: { /* ... */ },
  plugins: [
    require('@tailwindcss/typography'),
    // ...
  ],
};
```

### 基础用法

在包裹正文的容器上加 **`prose`**（建议用语义化标签如 `<article>`）：

```html
<article class="prose">
  <h1>标题</h1>
  <p>段落内容……</p>
  <ul><li>列表</li></ul>
</article>
```

可与响应式、暗色一起用：

```html
<article class="prose md:prose-lg lg:prose-xl dark:prose-invert">
  {{ markdown }}
</article>
```

### 灰度主题（Gray scale）

与 Tailwind 默认灰阶对应，需与 **`prose`** 同时使用：

| 类名 | 灰阶 |
|------|------|
| `prose-gray` | 默认 Gray |
| `prose-slate` | Slate |
| `prose-zinc` | Zinc |
| `prose-neutral` | Neutral |
| `prose-stone` | Stone |

```html
<article class="prose prose-slate">{{ content }}</article>
```

### 字号（Size modifiers）

| 类名 | 正文字号 |
|------|----------|
| `prose-sm` | 0.875rem (14px) |
| `prose-base` | 1rem (16px，默认) |
| `prose-lg` | 1.125rem (18px) |
| `prose-xl` | 1.25rem (20px) |
| `prose-2xl` | 1.5rem (24px) |

```html
<article class="prose prose-lg">...</article>
<article class="prose md:prose-lg lg:prose-xl">...</article>
```

注意：**必须同时保留 `prose`**，例如 `prose prose-lg`。

### 暗色模式

使用 **`prose-invert`**（通常配合 `dark:`）：

```html
<article class="prose dark:prose-invert">{{ content }}</article>
```

### 元素修饰（Element modifiers）

在保留 `prose` 的前提下，用 **`prose-{元素}:{工具类}`** 单独改某个元素的样式：

```html
<article class="prose prose-img:rounded-xl prose-headings:underline prose-a:text-blue-600">
  {{ content }}
</article>
```

常用元素修饰示例：

| 修饰符 | 作用对象 |
|--------|----------|
| `prose-headings:{utility}` | h1, h2, h3, h4, th |
| `prose-lead:{utility}` | `[class~="lead"]` |
| `prose-h1:` / `prose-h2:` / `prose-h3:` / `prose-h4:` | 对应标题 |
| `prose-p:` | p |
| `prose-a:` | a |
| `prose-blockquote:` | blockquote |
| `prose-code:` | code |
| `prose-pre:` | pre |
| `prose-ul:` / `prose-ol:` / `prose-li:` | 列表 |
| `prose-img:` | img |
| `prose-table:` / `prose-th:` / `prose-td:` 等 | 表格 |
| `prose-hr:` | hr |

与状态类叠加时，**Tailwind v4** 一般把状态放最后，例如：

```html
<article class="prose prose-a:text-blue-600 prose-a:hover:text-blue-500">
```

**Tailwind v3** 中顺序相反：

```html
<article class="prose prose-a:text-blue-600 hover:prose-a:text-blue-500">
```

### 取消 max-width

各 size 自带可读性 max-width，若希望内容撑满容器，可覆盖：

```html
<article class="prose max-w-none">{{ content }}</article>
```

### 排除某块不应用 prose：not-prose

正文里嵌入的组件/示例若不需要 prose 样式，用 **`not-prose`** 包一层：

```html
<article class="prose">
  <h1>标题</h1>
  <p>段落</p>
  <div class="not-prose">
    <!-- 这里的样式不受 prose 影响 -->
  </div>
  <p>段落</p>
</article>
```

注意：当前不能在 `not-prose` 内部再嵌套新的 `prose`。

### 自定义主类名（Tailwind v4）

若不想用 `prose` 这个名字，可在注册插件时指定 **className**：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography" {
  className: wysiwyg;
}
```

使用方式变为：`wysiwyg`、`wysiwyg-slate`、`lg:wysiwyg-xl`、`not-wysiwyg` 等。

### 自定义主题（高级）

- **Tailwind v4**：可用 `@utility prose-{name}` 定义新的主题（如 `prose-pink`），在 CSS 里设 `--tw-prose-*` 等变量。
- **Tailwind v3**：在 `tailwind.config.js` 的 `theme.extend.typography` 里为对应 modifier（如 `pink`、`xl`）提供 `css` 对象，写法与插件 [CSS-in-JS 语法](https://v3.tailwindcss.com/docs/plugins#css-in-js-syntax) 一致。

细节可参考官方 [style definitions](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/src/styles.js)。

---

## Tailwind v3 与 v4 差异速查

| 项目 | Tailwind v3 | Tailwind v4 |
|------|-------------|-------------|
| **Nesting** | 装 `@tailwindcss/nesting` 或在 postcss 里用 `tailwindcss/nesting` | 同上；v4 仍可用 PostCSS 管线中的 nesting |
| **Typography 注册** | `plugins: [require('@tailwindcss/typography')]` | `@plugin "@tailwindcss/typography"`（在 CSS 中） |
| **prose 元素修饰 + 状态** | `hover:prose-a:text-blue-500` | `prose-a:hover:text-blue-500` |
| **自定义 typography** | `tailwind.config.js` → `theme.extend.typography` | `@config` + JS config，或 `@utility prose-*` |

---

## 参考链接

- [Tailwind CSS 官方文档 - Using with Preprocessors（含 Nesting）](https://tailwindcss.com/docs/using-with-preprocessors)
- [@tailwindcss/nesting (npm)](https://www.npmjs.com/package/@tailwindcss/nesting)
- [postcss-nested](https://github.com/postcss/postcss-nested) / [postcss-nesting](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting)
- [@tailwindcss/typography (npm)](https://www.npmjs.com/package/@tailwindcss/typography)
- [Tailwind CSS Typography 插件文档](https://tailwindcss.com/docs/typography-plugin)
- [tailwindcss-typography 仓库](https://github.com/tailwindlabs/tailwindcss-typography)
- [Tailwind Play 排版示例](https://play.tailwindcss.com/uj1vGACRJA?layout=preview)
