# ESLint 综合学习文档

> 涵盖：eslint、@eslint/js、@types/eslint、TypeScript 生态、Turbo 配置、常用插件与解析器

## 📚 目录

1. [用大白话说：ESLint 是啥](#用大白话说eslint-是啥)
2. [原理：AST 与规则引擎](#原理ast-与规则引擎)
3. [统一预设：少装包、少写配置](#统一预设少装包少写配置)（推荐先看）
3. [核心包：eslint、@eslint/js、@types/eslint](#核心包eslint-eslintjs-typeseslint)
4. [配置方式：从 .eslintrc 到扁平配置](#配置方式从-eslintrc-到扁平配置)
5. [Parser 与 Plugin 概念解释](#parser-与-plugin-概念解释)
6. [TypeScript 生态：parser 与 plugin](#typescript-生态parser-与-plugin)
7. [解析器：JSON、Vue、YAML](#解析器jsonvueyaml)
8. [插件详解（按用途分类）](#插件详解按用途分类)
9. [Turbo 与 Monorepo：eslint-config-turbo](#turbo-与-monorepoeslint-config-turbo)
10. [一份综合配置示例](#一份综合配置示例)
11. [常见坑与最佳实践](#常见坑与最佳实践)
12. [包速查表（你提到的全部包）](#包速查表你提到的全部包)
13. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：ESLint 是啥

### 你遇到的问题（没有 ESLint 时）

- **风格不统一**：有人写 `const x = 1`，有人写 `var x=1`，有人加分号有人不加。
- **低级错误难发现**：未使用的变量、拼错的导入路径、`==` 误用等，要等到运行时或 Code Review 才发现。
- **规范难落地**：定了「禁止只用 `any`」「必须写 JSDoc」等规则，靠人记不住，靠 Review 成本高。

也就是说：**静态检查 + 可自动修复 + 可扩展规则**，如果都自己写工具，会很累。

### ESLint 帮你做啥

ESLint 是一个 **「可插拔的 JavaScript/TS 代码检查工具」**：

1. **读你的代码**（通过解析器变成 AST）。
2. **按规则检查**（内置规则 + 插件规则）。
3. **报错/警告**（并可在编辑器中实时显示）。
4. **部分规则支持 `--fix`**（保存时或命令行自动改代码）。

一句话：**ESLint = 解析器 + 规则引擎 + 插件体系**。你选的「解析器」决定能解析什么语法，「插件」决定检查什么内容。

---

## 原理：AST 与规则引擎

**核心思路**：ESLint 不直接「读字符串找模式」，而是先把代码**解析成 AST（抽象语法树）**，再让每条规则在 AST 上做检查或修复；解析器负责「源码 → AST」，插件提供「规则 + 可选修复」，引擎负责遍历、调度和输出。

- **解析流程**：读入源码 → 根据配置选用解析器（默认 Espree、TS 用 @typescript-eslint/parser、Vue 用 vue-eslint-parser 等）→ 得到 AST；若解析失败则报错并终止。
- **规则执行**：每条规则声明自己关心哪些 AST 节点类型（如 `VariableDeclaration`、`ImportDeclaration`）；引擎遍历 AST，在对应节点上调用规则的 `create(context)` 回调，规则可 report 问题并可提供 fix 函数。
- **插件与配置**：插件是一组「规则 + 环境 + 配置」的集合；扁平配置里通过 `plugins` 挂载、`rules` 开启，同一份 AST 可被多插件、多规则依次检查；`--fix` 时按顺序应用各规则的 fix，避免冲突需约定好顺序或范围。

---

### 和 Prettier 的区别（一句话）

- **ESLint**：侧重「对不对」（逻辑、引用、命名、最佳实践）。
- **Prettier**：侧重「好看不好看」（缩进、引号、换行等格式）。  
两者常一起用：Prettier 管格式，ESLint 管质量；用 `eslint-plugin-prettier` 时，可以把 Prettier 当一条 ESLint 规则来跑，避免冲突。

### 如何选包（按项目类型）

- **纯 JS/TS 项目**：`eslint` + `@eslint/js` + `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`（TS 时）。
- **Vue 项目**：再加 `vue-eslint-parser` + `eslint-plugin-vue`。
- **有 JSON/YAML 配置要检查**：加 `jsonc-eslint-parser` + `eslint-plugin-jsonc`，或 `yaml-eslint-parser` + `eslint-plugin-yml`。
- **Monorepo（Turborepo）**：加 `eslint-config-turbo`。
- **要格式统一**：加 `eslint-plugin-prettier` + `prettier`（可选 `eslint-config-prettier`）。
- **要 import 规范、未使用变量**：加 `eslint-plugin-import-x`、`eslint-plugin-unused-imports`。
- **要测试规范**：加 `eslint-plugin-vitest`、`eslint-plugin-no-only-tests`。
- **写 TS 配置**：加 `@types/eslint`。

**嫌插件太多、配置太复杂？** 可以直接用下面的 **[统一预设](#统一预设少装包少写配置)**：只装一个包，配置文件一两行搞定。

### 安装一锅端（全部装齐）

若你想把文档里提到的包一次性装齐（按需删减）：

```bash
pnpm add -D \
  eslint @eslint/js @types/eslint \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-config-turbo \
  eslint-plugin-command eslint-plugin-eslint-comments eslint-plugin-import-x \
  eslint-plugin-jsdoc eslint-plugin-jsonc eslint-plugin-n \
  eslint-plugin-no-only-tests eslint-plugin-perfectionist eslint-plugin-pnpm \
  eslint-plugin-prettier eslint-plugin-regexp eslint-plugin-unicorn \
  eslint-plugin-unused-imports eslint-plugin-vitest eslint-plugin-vue eslint-plugin-yml \
  jsonc-eslint-parser vue-eslint-parser yaml-eslint-parser
```

建议再装：`prettier`、`eslint-config-prettier`（若用 Prettier）。

---

## 统一预设：少装包、少写配置

插件一多，依赖和配置都会变复杂：要装十几个包、写一堆 `plugins`/`rules`/`parser`，维护成本高。**统一预设**就是把「解析器 + 常用插件 + 推荐规则」打成一个包，你只装这一个（或少数几个），配置里「扩展」一下就行。

**说明**：本节是**可选**的简化方案。文档后面的 **核心包、配置方式、解析器、插件详解、综合配置示例、包速查表** 等均为**原方案**（手写各插件、按需安装、逐项配置），全部保留，适合需要逐条控制规则或系统学习的场景。两种方案并存，可按需选择。

### 推荐：@antfu/eslint-config

**[@antfu/eslint-config](https://github.com/antfu/eslint-config)**（Anthony Fu 维护）是当前最流行的 **一体化扁平配置预设**，和你前面列出的很多插件是同一套生态：

- **一个包**：内部已经包含 TypeScript、Vue、JSON/YAML、import、unicorn、perfectionist、格式化（用 ESLint Stylistic，不依赖 Prettier）等，你不用再单独装那二十多个插件。
- **配置极简**：`eslint.config.js` 里通常只需几行，甚至一行。
- **扁平配置**：原生 ESLint 9 flat config，无历史包袱。
- **按需启用**：通过选项开启 Vue、React、Markdown、测试规则等，没用到的不会生效。

**安装与最简配置：**

```bash
pnpm add -D @antfu/eslint-config
```

```javascript
// eslint.config.mjs（或 eslint.config.js）
import antfu from "@antfu/eslint-config";

export default antfu();
```

就这两步，已经具备：JS/TS 检查、Vue 支持、JSON/YAML、import 排序、未使用变量、风格统一等。需要 **Vue** 时，传选项即可：

```javascript
export default antfu({
  vue: true,           // 启用 Vue 规则
  typescript: true,   // 默认就是 true
  formatter: true,    // 内置格式化（可替代 Prettier）
});
```

**和「手写一堆插件」的对比：**

| 方式 | 安装 | 配置 | 维护 |
|------|------|------|------|
| 手写各插件 | 装 20+ 个包 | 自己写 parser/plugins/rules，几十行起 | 升级时要逐个兼容 |
| @antfu/eslint-config | 装 1 个包（它会把依赖装齐） | 一行 `antfu()` 或加少量选项 | 跟着预设升级即可 |

**何时用统一预设、何时自己搭：**

- **用统一预设**：想少操心、团队统一风格、Vue/TS 项目、接受「约定优于配置」。
- **自己搭**：有非常定制化的规则组合、不能接受某预设的规则选择、公司强规范必须逐条控制。

### 其他可选预设（简要）

- **eslint-config-turbo**：只做 Turborepo 的 lint 约定，不包含 TS/Vue/格式化等，适合「在 Turbo 里只想统一 lint 命令」的场景；若还要 TS+Vue+一堆规则，仍可和 `@antfu/eslint-config` 一起用（先 `antfu()` 再 `turbo()` 或反之，按需合并）。
- **eslint-config-standard**、**XO**：偏「标准风格」或「零配置」的另一套选择，和 antfu 的规则哲学不同，可按团队口味选。

### 小结

- **有**统一集合：**@antfu/eslint-config** 把大量常用插件和解析器打包成「一个预设」，显著降低复杂度和依赖数量。
- 使用方式：安装 `@antfu/eslint-config`，在 `eslint.config.mjs` 里 `export default antfu(...)`，按需传 `vue`、`formatter` 等选项即可。
- **原方案不删**：若你选择手写各插件，请继续看下文「核心包」「解析器」「插件详解」「一份综合配置示例」等章节，安装与配置方式均完整保留。

---

## 核心包：eslint、@eslint/js、@types/eslint

### 1. `eslint`（主程序）

- **作用**：提供 CLI（`eslint .`）、Node API、默认规则和配置加载逻辑。
- **安装**：`pnpm add -D eslint`
- **使用**：
  - 命令行：`pnpm eslint .` 或 `npx eslint src/`
  - 脚本：`"lint": "eslint ."`、`"lint:fix": "eslint . --fix"`

### 2. `@eslint/js`（官方 JS 推荐规则集）

- **作用**：ESLint 官方维护的「推荐 JavaScript 规则」配置，常用于 `flat config` 里作为基础。
- **典型用法**（扁平配置）：

```javascript
import js from "@eslint/js";

export default [
  js.configs.recommended,  // 推荐规则
  {
    rules: {
      // 在推荐基础上覆盖或追加
    },
  },
];
```

- **注意**：ESLint 9+ 默认用扁平配置（`eslint.config.js`），`@eslint/js` 就是为这种配置准备的；老项目用 `.eslintrc.*` 时通常用 `extends: ["eslint:recommended"]`，不需要直接装 `@eslint/js`。

### 3. `@types/eslint`（TypeScript 类型）

- **作用**：为 ESLint 的 API 提供 TypeScript 类型定义（写配置、写插件、写自定义规则时用）。
- **安装**：`pnpm add -D @types/eslint`（若用 TS 写 `eslint.config.ts` 或插件再装）。
- **使用**：无需在配置里引用，装了之后 IDE 和 `tsc` 会自动识别 `eslint` 的类型。

---

## 配置方式：从 .eslintrc 到扁平配置

### 旧版：`.eslintrc.*`（ESLint 8 及以前默认）

- 文件可以是：`.eslintrc`、`.eslintrc.js`、`.eslintrc.json`、`.eslintrc.yml`。
- 通过 `extends`、`plugins`（字符串名）、`parser`、`parserOptions` 等组织。
- 插件/解析器常以字符串形式写，例如 `"plugin:vue/recommended"`。

### 新版：扁平配置（ESLint 9+ 默认）

- 默认找根目录的 **`eslint.config.js`**（或 `eslint.config.mjs` / `eslint.config.cjs`）。
- 配置是一个**数组**，每个元素是一个配置对象；后面的会与前面的合并，同项后者覆盖前者。
- 插件和解析器都是 **直接 import 进来的对象**，不再用字符串名。

```javascript
// eslint.config.mjs 示例
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    rules: { "no-unused-vars": "warn" },
  },
];
```

- 若你仍用 ESLint 8，想用扁平配置，可设环境变量：`ESLINT_USE_FLAT_CONFIG=true`。

---

## Parser 与 Plugin 概念解释

ESLint 检查代码分两步：**先把源码变成「结构树」→ 再按规则在树上检查**。Parser 干第一步，Plugin 干第二步（提供规则）。

### Parser（解析器）是什么？

- **一句话**：Parser 把**源代码字符串**转成 **AST（抽象语法树）**，让 ESLint 能「读懂」这段代码的结构（哪是变量、哪是函数、哪是 import 等）。
- **为啥需要**：ESLint 默认只「懂」标准 JavaScript。你的文件若是 TypeScript、Vue、JSON、YAML，直接当 JS 解析会报错或乱套，所以要换用**能解析该语法的 Parser**。
- **谁提供**：通常一个「非 JS 语言/格式」对应一个 Parser 包，例如：
  - `@typescript-eslint/parser` → 解析 `.ts` / `.tsx`
  - `vue-eslint-parser` → 解析 `.vue`
  - `jsonc-eslint-parser` → 解析 `.json` / `.jsonc`
  - `yaml-eslint-parser` → 解析 `.yml` / `.yaml`
- **在配置里**：写在 `languageOptions.parser`，且通常要配合 `files`（只对匹配到的文件用这个 parser）。

```text
源码 "const x: number = 1"  →  [Parser]  →  AST（节点树）  →  交给规则检查
```

### Plugin（插件）是什么？

- **一句话**：Plugin 是一个**规则包**，里面有多条 **rule**（规则）。每条规则会看 AST 的某类节点，发现「不符合约定」就报错或警告（有的还支持 `--fix` 自动改代码）。
- **为啥需要**：ESLint 自带的规则主要管 JS 语法和少量最佳实践。想检查「TypeScript 别用 any」「import 要排序」「Vue 组件名必须多词」等，就要装**提供这些规则的 Plugin**。
- **谁提供**：一个功能领域往往对应一个 Plugin，例如：
  - `@typescript-eslint/eslint-plugin` → TS 相关规则（no-explicit-any、consistent-type-imports 等）
  - `eslint-plugin-vue` → Vue 模板与脚本规则
  - `eslint-plugin-import-x` → import/export 相关规则
- **在配置里**：用 `plugins: { 名字: plugin 对象 }` 引入，规则写成 `"插件名/规则名": "error" | "warn" | "off"`。

```text
AST  →  [Plugin 的规则]  →  发现违规  →  报告 error/warn（或 --fix 修复）
```

### 二者关系（一句话）

| 角色 | 做的事 | 类比 |
|------|--------|------|
| **Parser** | 把「源码」变成「AST」 | 翻译：把外文翻成 ESLint 能读的「内部语言」 |
| **Plugin** | 提供「规则」，在 AST 上检查 | 审稿：按规则一条条看，标出问题 |

- **Parser 不管规则**：只负责解析，不报「别用 any」这种事；那种规则来自 Plugin。
- **Plugin 依赖 Parser**：若没给 Vue 文件配 `vue-eslint-parser`，AST 都不对，Vue 的规则也跑不好。所以通常是「某种文件 → 对应 Parser + 对应 Plugin」一起配。
- **可以多个 Plugin**：同一份 AST 可以同时被多个插件检查（例如既用 TS 插件又用 import 插件）。

### 配置里怎么写（扁平配置）

```javascript
// 对 .ts 文件：用 TS 的 parser，用 TS 的 plugin 的规则
{
  files: ["**/*.ts", "**/*.tsx"],
  languageOptions: {
    parser: tsParser,              // Parser：谁把源码变成 AST
    parserOptions: { /* ... */ },
  },
  plugins: { "@typescript-eslint": tsPlugin },   // Plugin：谁提供规则
  rules: {
    "@typescript-eslint/no-explicit-any": "warn", // 具体规则
  },
}
```

---

## TypeScript 生态：parser 与 plugin

### 1. `@typescript-eslint/parser`

- **作用**：解析 **TypeScript** 源码，生成 ESLint 能理解的 AST，使 ESLint 能检查 `.ts`/`.tsx`。
- **注意**：只负责「解析」，不负责「规则」；规则由下面的 plugin 提供。

### 2. `@typescript-eslint/eslint-plugin`

- **作用**：提供 TypeScript 相关规则，例如：
  - `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/strict-boolean-expressions`
  - `@typescript-eslint/consistent-type-imports`
- **推荐用法**：用官方推荐预设，再按需开启/关闭规则。

**扁平配置示例：**

```javascript
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { /* ... */ },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // 按需覆盖
    },
  },
];
```

---

## 解析器：JSON、Vue、YAML

ESLint 默认只「懂」JavaScript；要检查 JSON、Vue、YAML 等，需要**对应解析器**，并配合**插件规则**（有的解析器会带配套插件）。

| 解析器 | 作用 | 常见配合插件 |
|--------|------|----------------|
| **jsonc-eslint-parser** | 解析 JSON / JSONC（带注释的 JSON） | eslint-plugin-jsonc |
| **vue-eslint-parser** | 解析 Vue SFC（`<template>` + `<script>` + `<style>`） | eslint-plugin-vue |
| **yaml-eslint-parser** | 解析 YAML 文件 | eslint-plugin-yml |

### 1. `jsonc-eslint-parser` + `eslint-plugin-jsonc`

- **jsonc-eslint-parser**：让 ESLint 能解析 `.json` / `.jsonc`。
- **eslint-plugin-jsonc**：提供 JSON/JSONC 的规则（如格式、重复 key 等）。

```javascript
import jsoncParser from "jsonc-eslint-parser";
import jsoncPlugin from "eslint-plugin-jsonc";

export default [
  {
    files: ["**/*.json", "**/*.jsonc"],
    languageOptions: { parser: jsoncParser },
    plugins: { jsonc: jsoncPlugin },
    rules: { ...jsoncPlugin.configs.recommended.rules },
  },
];
```

### 2. `vue-eslint-parser` + `eslint-plugin-vue`

- **vue-eslint-parser**：解析 `.vue` 单文件组件；可指定「脚本部分」用哪个解析器（如 `@typescript-eslint/parser`）。
- **eslint-plugin-vue**：Vue 2/3 的模板与脚本规则（如组件命名、属性顺序等）。

```javascript
import vueParser from "vue-eslint-parser";
import vuePlugin from "eslint-plugin-vue";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,  // Vue 里的 <script> 用 TS 解析
        extraFileExtensions: [".vue"],
      },
    },
    plugins: { vue: vuePlugin },
    rules: { ...vuePlugin.configs["vue3-recommended"].rules },
  },
];
```

### 3. `yaml-eslint-parser` + `eslint-plugin-yml`

- **yaml-eslint-parser**：解析 `.yml` / `.yaml`。
- **eslint-plugin-yml**：YAML 的缩进、键名、重复等规则。

```javascript
import yamlParser from "yaml-eslint-parser";
import ymlPlugin from "eslint-plugin-yml";

export default [
  {
    files: ["**/*.yml", "**/*.yaml"],
    languageOptions: { parser: yamlParser },
    plugins: { yml: ymlPlugin },
    rules: { ...ymlPlugin.configs.recommended.rules },
  },
];
```

---

## 插件详解（按用途分类）

下面按「用途」把你要的插件过一遍，并说明在扁平配置里怎么接；每个都给出**安装命令**和**扁平配置示例**，方便直接抄。

### 一、代码质量与风格

#### eslint-plugin-unicorn

- **作用**：提供大量「更好写法」的规则，如 prefer-module、prefer-node-protocol、no-null、prefer-array-flat 等。
- **安装**：`pnpm add -D eslint-plugin-unicorn`
- **扁平配置示例**：

```javascript
import unicorn from "eslint-plugin-unicorn";

export default [
  {
    plugins: { unicorn: unicorn },
    rules: {
      ...unicorn.configs.recommended.rules,
      // 按需关闭：如 "unicorn/no-null": "off"
    },
  },
];
```

#### eslint-plugin-perfectionist

- **作用**：对 import、对象 key、类成员、接口属性等做「排序」，让代码顺序一致。
- **安装**：`pnpm add -D eslint-plugin-perfectionist`
- **扁平配置示例**：

```javascript
import perfectionist from "eslint-plugin-perfectionist";

export default [
  {
    plugins: { perfectionist: perfectionist },
    rules: {
      "perfectionist/sort-imports": "warn",
      "perfectionist/sort-objects": "warn",
    },
  },
];
```

#### eslint-plugin-unused-imports

- **作用**：发现未使用的 import，并可配合 `--fix` 自动删除。
- **安装**：`pnpm add -D eslint-plugin-unused-imports`
- **扁平配置示例**：

```javascript
import unusedImports from "eslint-plugin-unused-imports";

export default [
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": ["warn", { varsIgnorePattern: "^_" }],
    },
  },
];
```

### 二、Import/模块

#### eslint-plugin-import-x

- **作用**：检查 import/export 路径、顺序、循环依赖、命名等；是 eslint-plugin-import 的社区 fork，依赖更轻、对 TS 更友好。
- **安装**：`pnpm add -D eslint-plugin-import-x`
- **扁平配置示例**：

```javascript
import importX from "eslint-plugin-import-x";

export default [
  {
    plugins: { "import-x": importX },
    rules: {
      "import-x/no-unresolved": "error",
      "import-x/no-duplicates": "warn",
      "import-x/order": ["warn", { alphabetize: { order: "asc" } }],
    },
  },
];
```

### 三、注释与文档

#### eslint-plugin-jsdoc

- **作用**：检查 JSDoc 是否完整、参数名是否一致、类型是否合法等（require-jsdoc、check-param-names、valid-types 等）。
- **安装**：`pnpm add -D eslint-plugin-jsdoc`
- **扁平配置示例**：

```javascript
import jsdoc from "eslint-plugin-jsdoc";

export default [
  {
    plugins: { jsdoc: jsdoc },
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/check-param-names": "warn",
      "jsdoc/valid-types": "warn",
    },
  },
];
```

#### eslint-plugin-eslint-comments

- **作用**：规范代码里的 ESLint 注释，如 `// eslint-disable-next-line`，避免滥用或漏配对。
- **安装**：`pnpm add -D eslint-plugin-eslint-comments`
- **扁平配置示例**：

```javascript
import eslintComments from "eslint-plugin-eslint-comments";

export default [
  {
    plugins: { "eslint-comments": eslintComments },
    rules: {
      ...eslintComments.configs.recommended.rules,
      "eslint-comments/no-unlimited-disable": "warn",
    },
  },
];
```

### 四、格式与 Prettier

#### eslint-plugin-prettier

- **作用**：把 Prettier 当成一条 ESLint 规则跑，保存时用 `eslint --fix` 就能同时修格式，避免 ESLint 和 Prettier 冲突。需要同时安装 `prettier`。
- **安装**：`pnpm add -D eslint-plugin-prettier prettier`
- **扁平配置示例**：

```javascript
import prettier from "eslint-plugin-prettier";

export default [
  {
    plugins: { prettier: prettier },
    rules: {
      "prettier/prettier": "error",
    },
  },
];
```

建议同时使用 `eslint-config-prettier` 关掉和 Prettier 冲突的 ESLint 规则：

```javascript
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // ... 其他配置
  eslintConfigPrettier,
];
```

### 五、测试

#### eslint-plugin-vitest

- **作用**：Vitest 专用规则，如禁止 focus（no-focused-tests）、禁止重复标题（no-identical-title）等。
- **安装**：`pnpm add -D eslint-plugin-vitest`
- **扁平配置示例**：

```javascript
import vitest from "eslint-plugin-vitest";

export default [
  {
    files: ["**/*.test.{ts,js}", "**/*.spec.{ts,js}"],
    plugins: { vitest: vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/no-focused-tests": "error",
    },
  },
];
```

#### eslint-plugin-no-only-tests

- **作用**：禁止提交带 `.only` 的测试（describe.only、it.only、test.only 等），防止误提交只跑单测。
- **安装**：`pnpm add -D eslint-plugin-no-only-tests`
- **扁平配置示例**：

```javascript
import noOnlyTests from "eslint-plugin-no-only-tests";

export default [
  {
    files: ["**/*.test.{ts,js}", "**/*.spec.{ts,js}"],
    plugins: { "no-only-tests": noOnlyTests },
    rules: { "no-only-tests/no-only-tests": "error" },
  },
];
```

### 六、工程/环境

#### eslint-config-turbo

- **作用**：Turborepo 官方 ESLint 预设，适合 monorepo 根目录统一 lint。详见下一节。

#### eslint-plugin-pnpm

- **作用**：pnpm 相关规范，如 workspace 协议、禁止依赖不在 package.json 里的包等。
- **安装**：`pnpm add -D eslint-plugin-pnpm`
- **扁平配置示例**：

```javascript
import pnpm from "eslint-plugin-pnpm";

export default [
  {
    plugins: { pnpm: pnpm },
    rules: {
      "pnpm/no-overwritten-binaries": "error",
      "pnpm/no-optional-deps": "off",
    },
  },
];
```

#### eslint-plugin-n

- **作用**：Node 版本与 API 规范，如推荐最低 Node 版本、禁止使用已废弃的 API。
- **安装**：`pnpm add -D eslint-plugin-n`
- **扁平配置示例**：

```javascript
import n from "eslint-plugin-n";

export default [
  {
    plugins: { n: n },
    rules: {
      "n/no-deprecated-api": "warn",
      "n/prefer-global/process-env": "error",
    },
  },
];
```

### 七、代码转换（类 codemod）

#### eslint-plugin-command

- **作用**：通过特殊注释触发代码转换，如 `/// to-function`（箭头函数转普通函数）、`/// to-promise-all`（多 await 转 Promise.all）；运行 `eslint --fix` 时执行并删除注释。
- **安装**：`pnpm add -D eslint-plugin-command`
- **扁平配置示例**：

```javascript
import command from "eslint-plugin-command/config";

export default [command()];
```

在代码里写注释即可触发：

```javascript
/// to-function
const add = (a, b) => a + b;
// --fix 后变成 function add(a, b) { return a + b; }
```

### 八、其他专项

#### eslint-plugin-regexp

- **作用**：正则表达式写法与性能规则，避免容易出错或低效的正则。
- **安装**：`pnpm add -D eslint-plugin-regexp`
- **扁平配置示例**：

```javascript
import regexp from "eslint-plugin-regexp";

export default [
  {
    plugins: { regexp: regexp },
    rules: {
      "regexp/no-super-linear-backtracking": "warn",
      "regexp/prefer-regexp-test": "warn",
    },
  },
];
```

#### eslint-plugin-vue / eslint-plugin-jsonc / eslint-plugin-yml

- 前面「解析器」一节已写，分别配合 **vue-eslint-parser**、**jsonc-eslint-parser**、**yaml-eslint-parser** 使用。

---

## Turbo 与 Monorepo：eslint-config-turbo

### 作用

- **eslint-config-turbo**：Turborepo 官方提供的 ESLint 预设，适合在 **Turborepo monorepo** 里统一 lint 配置。
- 会带上一些和 Turbo 使用方式相符的规则（例如脚本、任务命名等），并可与现有规则合并。

### 安装与使用（扁平配置）

```bash
pnpm add -D eslint-config-turbo
```

```javascript
// eslint.config.mjs
import turbo from "eslint-config-turbo";

export default [
  turbo(),
  // 你的其他配置...
];
```

在 monorepo 里，通常**根目录**放一份 `eslint.config.js`，用 Turbo 的 `lint` 任务在各包执行 `eslint .`，这样既符合 Turbo 的缓存与依赖图，又共用同一套规则。

---

## 一份综合配置示例

下面是一份**扁平配置**示例，把前面提到的多数包串起来（仅作结构参考，规则可按项目删减）。

```javascript
// eslint.config.mjs
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import vueParser from "vue-eslint-parser";
import vuePlugin from "eslint-plugin-vue";
import importX from "eslint-plugin-import-x";
import unicorn from "eslint-plugin-unicorn";
import perfectionist from "eslint-plugin-perfectionist";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-plugin-prettier";
import vitest from "eslint-plugin-vitest";
import noOnlyTests from "eslint-plugin-no-only-tests";
import jsoncParser from "jsonc-eslint-parser";
import jsoncPlugin from "eslint-plugin-jsonc";
import yamlParser from "yaml-eslint-parser";
import ymlPlugin from "eslint-plugin-yml";

export default [
  js.configs.recommended,

  // TypeScript
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...unusedImports.configs.recommended.rules,
      "unused-imports/no-unused-imports": "warn",
    },
  },

  // Vue
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser, extraFileExtensions: [".vue"] },
    },
    plugins: { vue: vuePlugin },
    rules: { ...vuePlugin.configs["vue3-recommended"].rules },
  },

  // JSON
  {
    files: ["**/*.json", "**/*.jsonc"],
    languageOptions: { parser: jsoncParser },
    plugins: { jsonc: jsoncPlugin },
    rules: { ...jsoncPlugin.configs.recommended.rules },
  },

  // YAML
  {
    files: ["**/*.yml", "**/*.yaml"],
    languageOptions: { parser: yamlParser },
    plugins: { yml: ymlPlugin },
    rules: { ...ymlPlugin.configs.recommended.rules },
  },

  // 通用规则（可选）
  {
    files: ["**/*.{js,ts,tsx,vue}"],
    plugins: {
      "import-x": importX,
      unicorn: unicorn,
      perfectionist: perfectionist,
      prettier: prettier,
      vitest: vitest,
      "no-only-tests": noOnlyTests,
    },
    rules: {
      "prettier/prettier": "error",
      "no-only-tests/no-only-tests": "error",
      // 其他按需开启
    },
  },
];
```

---

## 常见坑与最佳实践

### 1. 解析器与 `files` 要对上

- 给 `**/*.ts` 用的块里，`languageOptions.parser` 要用 `@typescript-eslint/parser`。
- 给 `**/*.vue` 用 `vue-eslint-parser`，且用 `parserOptions.parser` 指定 script 的解析器（如 TS）。
- 给 `**/*.json` 用 `jsonc-eslint-parser`，否则 ESLint 会按 JS 解析，报错一堆。

### 2. 扁平配置里插件是「对象」

- 不能写 `plugins: ["vue"]`，要 `plugins: { vue: vuePlugin }`，规则里用 `"vue/rule-name"`。

### 3. Prettier 与 ESLint 冲突

- 要么用 `eslint-plugin-prettier` 把 Prettier 当规则跑，并关掉和格式冲突的 ESLint 规则；要么用 `eslint-config-prettier` 只关冲突规则、单独跑 Prettier。二选一，避免重复格式化。

### 4. Monorepo 里怎么放配置

- 常见做法：**根目录一个 `eslint.config.js`**，所有包共用；用 Turbo 的 `lint` 在每个包下执行 `eslint .`，这样缓存和依赖都清晰。

### 5. 性能

- 用 `ignorePatterns` 或等价方式排除 `node_modules`、build 产物、大文件。
- 需要 import 解析时，用 `eslint-plugin-import-x` 比老版 `eslint-plugin-import` 通常更轻。

---

## 包速查表（你提到的全部包）

| 包名 | 类型 | 一句话说明 |
|------|------|------------|
| **eslint** | 核心 | ESLint 主程序，提供 CLI 与 API |
| **@eslint/js** | 核心 | 官方 JS 推荐规则集，用于扁平配置 |
| **@types/eslint** | 类型 | ESLint API 的 TypeScript 类型定义 |
| **@typescript-eslint/parser** | 解析器 | 解析 TypeScript 源码 |
| **@typescript-eslint/eslint-plugin** | 插件 | TypeScript 相关规则 |
| **eslint-config-turbo** | 预设 | Turborepo 官方 ESLint 预设 |
| **eslint-plugin-command** | 插件 | 通过注释触发代码转换（类 codemod） |
| **eslint-plugin-eslint-comments** | 插件 | 规范 ESLint 注释（disable 等） |
| **eslint-plugin-import-x** | 插件 | Import/export 规范（import 的轻量 fork） |
| **eslint-plugin-jsdoc** | 插件 | JSDoc 注释检查 |
| **eslint-plugin-jsonc** | 插件 | JSON/JSONC 规则（配合 jsonc 解析器） |
| **eslint-plugin-n** | 插件 | Node 版本与 API 规范 |
| **eslint-plugin-no-only-tests** | 插件 | 禁止测试里的 .only |
| **eslint-plugin-perfectionist** | 插件 | import/对象/类成员等排序 |
| **eslint-plugin-pnpm** | 插件 | pnpm workspace 与依赖规范 |
| **eslint-plugin-prettier** | 插件 | 把 Prettier 当 ESLint 规则跑 |
| **eslint-plugin-regexp** | 插件 | 正则表达式写法与性能 |
| **eslint-plugin-unicorn** | 插件 | 大量「更好写法」规则 |
| **eslint-plugin-unused-imports** | 插件 | 未使用 import 检测与自动删除 |
| **eslint-plugin-vitest** | 插件 | Vitest 专用规则 |
| **eslint-plugin-vue** | 插件 | Vue 组件与模板规则 |
| **eslint-plugin-yml** | 插件 | YAML 规则（配合 yaml 解析器） |
| **jsonc-eslint-parser** | 解析器 | 解析 JSON/JSONC |
| **vue-eslint-parser** | 解析器 | 解析 Vue 单文件组件 |
| **yaml-eslint-parser** | 解析器 | 解析 YAML |

---

## 参考与延伸阅读

- [ESLint 官方文档](https://eslint.org/docs/latest/)
- [ESLint 扁平配置迁移](https://eslint.org/docs/latest/use/configure/migration-guide)
- [@eslint/js](https://www.npmjs.com/package/@eslint/js)
- [typescript-eslint](https://typescript-eslint.io/)
- [eslint-plugin-vue](https://eslint.vuejs.org/)
- [eslint-plugin-import-x](https://github.com/un-ts/eslint-plugin-import-x)
- [Turborepo 文档](https://turbo.build/repo/docs)（含 lint 任务与 eslint-config-turbo）

---

**文档版本**：针对 ESLint 9+ 扁平配置与常见 2024–2025 生态整理；具体规则与包版本以各 npm 包文档为准。
