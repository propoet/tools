# jsonc-eslint-parser 学习文档

> 供 ESLint 使用的 JSON / JSONC / JSON5 解析器；让 .json、.jsonc、.json5 能被 ESLint 检查与自动修复，常与 eslint-plugin-jsonc 搭配

## 📚 目录

1. [用大白话说：jsonc-eslint-parser 是啥](#用大白话说jsonc-eslint-parser-是啥)
2. [原理：ESLint 怎么「读懂」JSON](#原理eslint-怎么读懂-json)
3. [与 eslint-plugin-jsonc 的关系](#与-eslint-plugin-jsonc-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [Flat Config 与 Legacy Config](#flat-config-与-legacy-config)
6. [parserOptions.jsonSyntax](#parseroptionsjsonsyntax)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：jsonc-eslint-parser 是啥

### 你遇到的问题（想用 ESLint 检查 JSON 时）

- **ESLint 默认只认 JS/TS**：不加配置时，ESLint 不会把 .json 当「可解析文件」，无法对其做规则检查。
- **JSON 里也有格式/风格问题**：尾逗号、缩进、重复 key、注释（JSONC）、trailing comma（JSON5）等，希望像 JS 一样有规则和自动修复。
- **配置/数据文件是 .json / .jsonc**：tsconfig、package.json、vscode settings 等，希望统一风格、避免错误。

也就是说：**在「让 ESLint 能解析并检查 JSON/JSONC/JSON5」这件事上，提供一个专用 parser**，就是 jsonc-eslint-parser 要解决的问题。

### jsonc-eslint-parser 帮你做啥

**jsonc-eslint-parser** 是一个 **给 ESLint 用的 JSON/JSONC/JSON5 解析器**：

1. **解析多种 JSON 语法**：支持 **JSON**（标准）、**JSONC**（带注释，如 VS Code 配置）、**JSON5**（注释、尾逗号、单引号等）。
2. **产出 ESLint AST**：把 JSON 文本解析成 AST，供 ESLint 规则和 **eslint-plugin-jsonc** 使用，可报错、定位、自动修复。
3. **可选语法严格度**：通过 **parserOptions.jsonSyntax** 指定只接受 `"JSON"` / `"JSONC"` / `"JSON5"`，或默认接受「能表达静态值」的写法。
4. **与插件配套**：解析器只负责「解析」；**eslint-plugin-jsonc** 提供具体规则（重复 key、缩进、引号、排序等）和自动修复。

一句话：**jsonc-eslint-parser = 让 ESLint 能「读懂」JSON/JSONC/JSON5 的 parser**，配合 eslint-plugin-jsonc 做格式与错误检查。

---

## 原理：ESLint 怎么「读懂」JSON

### 1. ESLint 的 parser 作用

- ESLint 默认用 **Espree** 等 parser 把 **JS/TS** 源码转成 **AST**，规则再基于 AST 和源码位置报错、修复。
- 对 **非 JS 文件**（如 .json），需要指定 **自定义 parser**，把该格式解析成 ESLint 能用的 AST（含节点类型、位置、父子关系等）。

### 2. jsonc-eslint-parser 做的事

- **输入**：JSON/JSONC/JSON5 字符串（即文件内容）。
- **输出**：符合 ESLint 约定的 AST，节点类型为 JSON 专用（如 JSONObjectExpression、JSONProperty、JSONLiteral 等），带 loc、range 等位置信息。
- **规则**：eslint-plugin-jsonc 等基于这套 AST 写规则（如「禁止重复 key」「缩进 2 空格」「键名排序」），并可做 **fix**。

可以简单记：**parser 把 JSON 文本 → AST → 规则在 AST 上检查/修复**。

---

## 与 eslint-plugin-jsonc 的关系

| 角色 | 作用 |
|------|------|
| **jsonc-eslint-parser** | 只负责「解析」：把 .json/.jsonc/.json5 转成 ESLint AST，不提供规则。 |
| **eslint-plugin-jsonc** | 提供「规则」：重复 key、缩进、引号、键排序、`jsonc/auto` 等，以及自动修复；依赖本 parser。 |

- **只装 parser**：ESLint 能解析 JSON，但若没有规则，通常不会报任何问题；需要规则时需装 **eslint-plugin-jsonc**。
- **推荐**：**jsonc-eslint-parser + eslint-plugin-jsonc** 一起装、一起配，解析和规则都具备。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D jsonc-eslint-parser
# 推荐同时安装规则插件
pnpm add -D eslint-plugin-jsonc
```

### 使用方式概览

- 在 **ESLint 配置**里，对 `**/*.json`、`**/*.jsonc`、`**/*.json5` 等文件设置 **parser: jsonc-eslint-parser**（或 `jsoncParser`），并可选配置 **parserOptions.jsonSyntax**。
- 若用 **eslint-plugin-jsonc**，在对应配置里启用其规则（如 `jsonc/auto`、`jsonc/sort-keys` 等）。

---

## Flat Config 与 Legacy Config

### Flat Config（ESLint 9+ / eslint.config.js）

```js
import * as jsoncParser from "jsonc-eslint-parser";

export default [
  {
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
    languageOptions: {
      parser: jsoncParser,
      parserOptions: {
        jsonSyntax: "JSONC", // 可选: "JSON" | "JSONC" | "JSON5"
      },
    },
    plugins: {
      jsonc: require("eslint-plugin-jsonc"),
    },
    rules: {
      "jsonc/auto": "error", // 示例：用插件提供的规则
    },
  },
];
```

- **files**：要按 JSON 解析的文件匹配模式。
- **languageOptions.parser**：设为 **jsonc-eslint-parser**（或 import 后的变量）。
- **parserOptions.jsonSyntax**：可选，见下节。
- **plugins** / **rules**：若用 eslint-plugin-jsonc，在此挂插件并开规则。

### Legacy Config（.eslintrc.*）

```json
{
  "overrides": [
    {
      "files": ["*.json", "*.jsonc", "*.json5"],
      "parser": "jsonc-eslint-parser",
      "parserOptions": {
        "jsonSyntax": "JSON5"
      }
    }
  ]
}
```

- **overrides**：对匹配的 JSON 文件单独指定 **parser** 和 **parserOptions**。

---

## parserOptions.jsonSyntax

| 值 | 说明 |
|----|------|
| **"JSON"** | 只接受标准 JSON（无注释、无尾逗号、双引号等）。 |
| **"JSONC"** | JSON with Comments（如 VS Code 的 settings.json），允许 `//`、`/* */`。 |
| **"JSON5"** | [JSON5](https://json5.org/)：注释、尾逗号、单引号、无引号 key 等。 |
| **不指定** | 接受「能表达静态值」的写法（较宽松），例如无插值的模板字面量。 |

- **建议**：若希望严格按某种语法检查，设成 `"JSON"` / `"JSONC"` / `"JSON5"`；文档推荐「parser 放宽语法检查，用 eslint-plugin-jsonc 的规则来做校验与自动修复」。

---

## 常见场景与最佳实践

### 1. 只检查 .json / .jsonc

- **files** 设为 `["**/*.json", "**/*.jsonc"]`，**parser** 设为 jsonc-eslint-parser，**parserOptions.jsonSyntax** 按项目选 `"JSON"` 或 `"JSONC"`。

### 2. package.json、tsconfig.json 等统一风格

- 装 **eslint-plugin-jsonc**，对 JSON 启用 `jsonc/auto` 或 `jsonc/sort-keys` 等，用规则约束格式并自动修复。

### 3. 禁止重复 key、非法语法

- 由 parser 解析失败或由插件规则（如重复 key）报错；**parserOptions.jsonSyntax** 收紧可减少非法语法被放过。

### 4. 自定义规则 / 插件

- 解析器产出的是 JSON 专用 AST，可写自定义规则或插件；见 [AST.md](https://github.com/ota-meshi/jsonc-eslint-parser/blob/HEAD/docs/AST.md)、[Plugins.md](https://github.com/ota-meshi/jsonc-eslint-parser/blob/HEAD/docs/Plugins.md)。

---

## 参考与延伸阅读

- [jsonc-eslint-parser npm](https://www.npmjs.com/package/jsonc-eslint-parser)
- [jsonc-eslint-parser GitHub](https://github.com/ota-meshi/jsonc-eslint-parser)
- [eslint-plugin-jsonc](https://www.npmjs.com/package/eslint-plugin-jsonc)（规则与用法）
- [AST 说明](https://github.com/ota-meshi/jsonc-eslint-parser/blob/HEAD/docs/AST.md)、[Plugins 说明](https://github.com/ota-meshi/jsonc-eslint-parser/blob/HEAD/docs/Plugins.md)
- [Online DEMO](https://ota-meshi.github.io/jsonc-eslint-parser/)

---

**小结**：jsonc-eslint-parser 让 ESLint 能解析 JSON/JSONC/JSON5 并产出 AST；在 flat 或 legacy 配置里对 JSON 文件指定该 parser 和可选的 parserOptions.jsonSyntax，再配合 eslint-plugin-jsonc 做规则检查与自动修复。
