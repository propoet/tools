# @stylistic/stylelint-plugin 学习与集成指南

## 📚 目录

1. [什么是 @stylistic/stylelint-plugin](#什么是-stylisticstylelint-plugin)
2. [原理：Stylelint 插件与 AST 规则](#原理stylelint-插件与-ast-规则)
3. [背景：Stylelint 16 移除的规则](#背景stylelint-16-移除的规则)
3. [安装与基础配置](#安装与基础配置)
4. [配置方式详解](#配置方式详解)
5. [规则分类与速查](#规则分类与速查)
6. [常用规则示例](#常用规则示例)
7. [@stylistic/stylelint-config 共享配置](#stylisticstylelint-config-共享配置)
8. [与 Prettier 的配合](#与-prettier-的配合)
9. [CI / 编辑器集成](#ci--编辑器集成)
10. [常见问题与最佳实践](#常见问题与最佳实践)
11. [参考链接](#参考链接)

---

## 什么是 @stylistic/stylelint-plugin

**@stylistic/stylelint-plugin** 是一个以 **插件形式** 提供的、**可维护的 Stylelint 风格规则集合**，用于统一 CSS/SCSS/Less 等样式代码的书写风格（大小写、空格、换行、缩进等）。

### 为什么需要它？

- **Stylelint 16.0** 移除了 76 条「风格类」规则，只保留「可发现错误」的规则；若仍想统一代码风格，需要单独引入风格规则。
- **@stylistic/stylelint-plugin** 把这 76 条规则以插件形式提供，规则名统一带 `@stylistic/` 前缀，避免与未来 Stylelint 内置规则冲突。
- 多数规则支持 **自动修复**（`stylelint --fix`），便于快速统一现有代码库。

### 核心要点

| 项目 | 说明 |
|------|------|
| **规则数量** | 76 条风格规则 |
| **规则前缀** | 必须使用 `@stylistic/` 命名空间 |
| **自动修复** | 大部分规则支持 `--fix` |
| **适用语法** | CSS、SCSS、Less、SugarSS 等 Stylelint 支持的语法 |

---

## 原理：Stylelint 插件与 AST 规则

**核心思路**：Stylelint 先把 CSS 解析成 **AST**（抽象语法树），再让每条规则在 AST 上做检查或修复；插件就是「一组规则的集合」，每条规则声明自己关心哪些节点、在什么条件下报错或自动修复。

- **解析与遍历**：Stylelint 用 PostCSS 解析 CSS（含 SCSS/Less 等需对应语法插件），得到 PostCSS AST；规则通过 `postcss.plugin` 或 Stylelint 的 rule 接口注册，在遍历节点时检查属性值、空格、换行等是否符合约定。
- **风格规则**：@stylistic 的规则多为「可发现风格问题并可自动修复」：如颜色大小写、引号类型、缩进、分号有无等；规则内部访问 AST 节点，对比预期格式，若不匹配则 report 并可选 fix。
- **与 Prettier 的关系**：风格类规则与 Prettier 有重叠；若已用 Prettier 格式化，可关闭部分 Stylelint 风格规则避免冲突；若不用 Prettier，用本插件可在 lint 阶段统一风格并 --fix。

---

## 背景：Stylelint 16 移除的规则

Stylelint 官方在 [迁移指南](https://stylelint.io/migration-guide/to-16#removed-deprecated-stylistic-rules) 中说明：**风格类规则**（如颜色大小写、缩进、引号等）从 16.0 起不再内置，建议：

- 要么用 **Prettier** 等格式化工具统一风格；
- 要么使用 **@stylistic/stylelint-plugin** 继续用 Stylelint 做风格约束。

本插件即为此而生，并可持续更新、增加新规则。

---

## 安装与基础配置

### 1. 安装依赖

```bash
pnpm add -D stylelint @stylistic/stylelint-plugin
# 或
npm install -D stylelint @stylistic/stylelint-plugin
```

### 2. 创建配置文件

支持多种格式，以下以 `.stylelintrc.json` 和 `stylelint.config.js` 为例。

**方式 A：`.stylelintrc.json`**

```json
{
  "plugins": ["@stylistic/stylelint-plugin"],
  "rules": {
    "@stylistic/color-hex-case": "lower",
    "@stylistic/number-leading-zero": "always",
    "@stylistic/unit-case": "lower",
    "@stylistic/indentation": 2
  }
}
```

**方式 B：`stylelint.config.js`（推荐，便于与其它 config 合并）**

```javascript
export default {
  plugins: ['@stylistic/stylelint-plugin'],
  rules: {
    '@stylistic/color-hex-case': 'lower',
    '@stylistic/number-leading-zero': 'always',
    '@stylistic/unit-case': 'lower',
    '@stylistic/indentation': 2,
  },
};
```

### 3. 与 stylelint-config-standard 等一起使用

若项目已使用 `stylelint-config-standard` 或 `stylelint-config-recommended`，只需增加 `plugins` 和需要的 `@stylistic/` 规则：

```json
{
  "extends": ["stylelint-config-standard"],
  "plugins": ["@stylistic/stylelint-plugin"],
  "rules": {
    "@stylistic/color-hex-case": "lower",
    "@stylistic/indentation": 2
  }
}
```

### 4. 运行检查与自动修复

```bash
# 检查
npx stylelint "src/**/*.css"

# 自动修复
npx stylelint "src/**/*.css" --fix
```

---

## 配置方式详解

### 插件与规则命名

- **plugins** 中只写 `"@stylistic/stylelint-plugin"`。
- **rules** 里每条规则名必须以 `@stylistic/` 开头，例如：
  - `@stylistic/color-hex-case`
  - `@stylistic/indentation`
  - `@stylistic/declaration-block-trailing-semicolon`

### 规则值类型

- **字符串**：如 `"lower"`、`"always"`、`"single"`。
- **数字**：如缩进空格数 `2`、最大空行数 `1`。
- **数组**：主选项 + 次要选项，如 `[2, { "baseIndentLevel": 1 }]`。
- **null**：在 extend 的配置上关闭某条规则，如 `"@stylistic/max-line-length": null`。

---

## 规则分类与速查

以下按「约束对象」分类，便于按需选用。规则列表以 [官方 rules 文档](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/docs/user-guide/rules.md) 为准。

### Color（颜色）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/color-hex-case` | 十六进制颜色大小写（lower/upper） | ✅ |

### Function（函数）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/function-comma-newline-after` / `-before` | 函数参数逗号后/前换行或空格 | ✅ |
| `@stylistic/function-comma-space-after` / `-before` | 函数参数逗号后/前单空格 | ✅ |
| `@stylistic/function-max-empty-lines` | 函数内连续空行数限制 | ✅ |
| `@stylistic/function-parentheses-newline-inside` / `-space-inside` | 函数括号内换行/空格 | ✅ |
| `@stylistic/function-whitespace-after` | 函数名后空格 | ✅ |

### Number（数字）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/number-leading-zero` | 小数前导零（如 0.5） | ✅ |
| `@stylistic/number-no-trailing-zeros` | 禁止尾随零（如 1.00） | ✅ |

### String / Unit / Property

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/string-quotes` | 字符串引号 single/double | ✅ |
| `@stylistic/unit-case` | 单位大小写（px/em） | ✅ |
| `@stylistic/property-case` | 属性名大小写 | ✅ |

### Value list（值列表）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/value-list-comma-newline-after` / `-before` | 值列表逗号后/前换行 | ✅/部分 |
| `@stylistic/value-list-comma-space-after` / `-before` | 值列表逗号后/前空格 | ✅ |
| `@stylistic/value-list-max-empty-lines` | 值列表内连续空行 | ✅ |

### Declaration（声明）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/declaration-bang-space-after` / `-before` | ! 后/前空格 | ✅ |
| `@stylistic/declaration-colon-newline-after` | 冒号后换行 | ✅ |
| `@stylistic/declaration-colon-space-after` / `-before` | 冒号后/前空格 | ✅ |

### Declaration block（声明块）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/declaration-block-semicolon-newline-after` / `-before` | 分号后/前换行 | ✅/部分 |
| `@stylistic/declaration-block-semicolon-space-after` / `-before` | 分号后/前空格 | ✅ |
| `@stylistic/declaration-block-trailing-semicolon` | 尾部分号要求 | ✅ |

### Block（块）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/block-closing-brace-*` | 块闭合括号换行/空格 | ✅/部分 |
| `@stylistic/block-opening-brace-*` | 块开括号换行/空格 | ✅ |

### Selector / Selector list

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/selector-attribute-brackets-space-inside` | 属性选择器括号内空格 | ✅ |
| `@stylistic/selector-attribute-operator-space-after` / `-before` | 属性选择器运算符空格 | ✅ |
| `@stylistic/selector-combinator-space-after` / `-before` | 组合器空格 | ✅ |
| `@stylistic/selector-pseudo-class-case` / `selector-pseudo-element-case` | 伪类/伪元素大小写（均需 @stylistic/ 前缀） | ✅ |
| `@stylistic/selector-list-comma-newline-after` / `-before` | 选择器列表逗号换行 | ✅/部分 |
| `@stylistic/selector-list-comma-space-after` / `-before` | 选择器列表逗号空格 | ✅ |

### Media feature / Media query list

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/media-feature-colon-space-after` / `-before` | 媒体特性冒号空格 | ✅ |
| `@stylistic/media-feature-name-case` | 媒体特性名大小写 | ✅ |
| `@stylistic/media-feature-parentheses-space-inside` | 媒体特性括号内空格 | ✅ |
| `@stylistic/media-query-list-comma-newline-*` / `-space-*` | 媒体查询列表逗号换行/空格 | ✅/部分 |

### At-rule

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/at-rule-name-case` | at 规则名大小写 | ✅ |
| `@stylistic/at-rule-name-space-after` | at 规则名后空格 | ✅ |
| `@stylistic/at-rule-semicolon-newline-after` | at 规则分号后换行 | ✅ |

### General / Sheet（通用）

| 规则名 | 说明 | 可修复 |
|--------|------|--------|
| `@stylistic/indentation` | 缩进（空格数或 tab） | ✅ |
| `@stylistic/linebreaks` | 换行符 unix/windows | ✅ |
| `@stylistic/max-empty-lines` | 连续空行上限 | ✅ |
| `@stylistic/max-line-length` | 单行最大长度 | ❌ |
| `@stylistic/no-empty-first-line` | 禁止首行空行 | ✅ |
| `@stylistic/no-eol-whitespace` | 禁止行尾空格 | ✅ |
| `@stylistic/no-extra-semicolons` | 禁止多余分号 | ✅ |
| `@stylistic/no-missing-end-of-source-newline` | 文件末尾保留换行 | ✅ |
| `@stylistic/unicode-bom` | 是否要求 BOM | 视配置 |

---

## 常用规则示例

### color-hex-case

统一十六进制颜色为小写或大写。

```json
"@stylistic/color-hex-case": "lower"
```

```css
/* ❌ lower 时 */
a { color: #FFF; }

/* ✅ */
a { color: #fff; }
a { color: #000; }
```

### number-leading-zero

小数是否保留前导零。

```json
"@stylistic/number-leading-zero": "always"
```

```css
/* ❌ */
a { opacity: .5; }

/* ✅ */
a { opacity: 0.5; }
```

### indentation

缩进（数字为空格数，或 `"tab"`）。

```json
"@stylistic/indentation": 2
```

```css
/* ❌ */
@media print {
a {
color: pink;
}
}

/* ✅ */
@media print {
  a {
    color: pink;
  }
}
```

带次要选项（如缩进闭合括号、括号内缩进）：

```json
"@stylistic/indentation": [2, {
  "indentClosingBrace": true,
  "indentInsideParens": "twice"
}]
```

### declaration-block-trailing-semicolon

声明块末尾是否保留分号。

```json
"@stylistic/declaration-block-trailing-semicolon": "always"
```

```css
/* ❌ always 时 */
a { color: pink }

/* ✅ */
a { color: pink; }
```

### string-quotes

字符串引号风格。

```json
"@stylistic/string-quotes": "single"
```

```css
/* ❌ single 时 */
a { font-family: "Microsoft YaHei"; }

/* ✅ */
a { font-family: 'Microsoft YaHei'; }
```

### unit-case

单位大小写。

```json
"@stylistic/unit-case": "lower"
```

```css
/* ❌ */
a { width: 10PX; }

/* ✅ */
a { width: 10px; }
```

---

## @stylistic/stylelint-config 共享配置

若不想逐条写 76 条规则，可使用 **@stylistic/stylelint-config**，它预置了从 `stylelint-config-standard` / `stylelint-config-recommended` 中移除的那批风格规则。

### 安装

```bash
pnpm add -D @stylistic/stylelint-config stylelint
```

### 配置

```json
{
  "extends": ["stylelint-config-standard", "@stylistic/stylelint-config"]
}
```

或仅风格：

```json
{
  "extends": ["@stylistic/stylelint-config"]
}
```

### 覆盖与关闭规则

```json
{
  "extends": ["@stylistic/stylelint-config"],
  "rules": {
    "@stylistic/indentation": "tab",
    "@stylistic/max-line-length": null
  }
}
```

需要更多规则时（config 未包含的），可直接加 `@stylistic/` 规则名，例如：

```json
{
  "extends": ["@stylistic/stylelint-config"],
  "rules": {
    "@stylistic/at-rule-name-newline-after": "always-multi-line"
  }
}
```

---

## 与 Prettier 的配合

- **Prettier** 负责「格式化」（缩进、引号、分号、换行等）。
- **@stylistic/stylelint-plugin** 也是风格规则，若两者同时启用且规则不一致，容易冲突。

常见做法：

1. **只用 Prettier 做格式**  
   - Stylelint 只做「错误/可访问性/最佳实践」类规则（如 `stylelint-config-recommended`、`stylelint-config-standard`），不启用或尽量少用 @stylistic 规则。

2. **不用 Prettier，只用 Stylelint 做风格**  
   - 使用 `@stylistic/stylelint-plugin` 或 `@stylistic/stylelint-config`，并统一团队配置。

3. **两者都用**  
   - 使用 [stylelint-config-prettier](https://github.com/prettier/stylelint-config-prettier) 关闭与 Prettier 冲突的规则；或只开不重叠的 @stylistic 规则（如 `color-hex-case`、`unit-case`），避免与 Prettier 的缩进/分号/引号冲突。

---

## CI / 编辑器集成

### 命令行

```bash
npx stylelint "src/**/*.{css,scss,vue}" --fix
```

### package.json scripts

```json
{
  "scripts": {
    "lint:style": "stylelint \"src/**/*.{css,scss,vue}\"",
    "lint:style:fix": "stylelint \"src/**/*.{css,scss,vue}\" --fix"
  }
}
```

### VS Code

安装 [Stylelint 扩展](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)，在项目根目录有 `.stylelintrc*` 或 `stylelint.config.js` 即可自动校验；保存时若开启 “Fix on Save”，可配合 `--fix` 自动修复。

### CI 示例（GitHub Actions）

```yaml
- name: Lint styles
  run: pnpm run lint:style
```

---

## 常见问题与最佳实践

### 1. 规则不生效？

- 确认 **plugins** 中已写 `"@stylistic/stylelint-plugin"`。
- 规则名必须是 **`@stylistic/`** 前缀，例如 `@stylistic/indentation` 而不是 `indentation`。

### 2. 与 Prettier 冲突？

- 用 Prettier 做格式时，建议用 `stylelint-config-prettier` 关掉冲突规则，或只开与 Prettier 不重叠的 @stylistic 规则。

### 3. 只想要部分规则？

- 不用 `@stylistic/stylelint-config`，只装 `@stylistic/stylelint-plugin`，在 **rules** 里按需添加需要的 `@stylistic/*` 规则。

### 4. 自动修复不生效？

- 查看该规则在官方文档是否标注 “Autofixable”；支持修复的可用 `stylelint --fix`。
- 确认配置文件被正确加载（路径、extends 顺序等）。

### 5. Vue / SFC 中的样式

- Stylelint 支持 `*.vue` 中的 `<style>`；需使用支持 Vue 的语法（如 postcss-html、postcss-styled 等，视 Stylelint 版本与插件而定）。规则配置方式与普通 CSS 一致，同样使用 `@stylistic/` 规则名。

---

## 参考链接

- [@stylistic/stylelint-plugin (npm)](https://www.npmjs.com/package/@stylistic/stylelint-plugin)
- [stylelint-stylistic 规则列表 (GitHub)](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/docs/user-guide/rules.md)
- [@stylistic/stylelint-config (npm)](https://www.npmjs.com/package/@stylistic/stylelint-config)
- [Stylelint 官方文档](https://stylelint.io/)
- [Stylelint 16 迁移指南（移除的风格规则）](https://stylelint.io/migration-guide/to-16#removed-deprecated-stylistic-rules)
