# cspell（Code Spell Checker）从零开始学习指南

> 面向代码与文档的拼写检查工具：CLI 扫文件、配置词典与忽略、支持多语言与 VS Code 扩展，适合项目内统一拼写与 CI 检查

## 📚 目录

1. [什么是 cspell](#什么是-cspell)
2. [原理：如何做拼写检查](#原理如何做拼写检查)
3. [安装与使用方式](#安装与使用方式)
4. [配置文件与查找顺序](#配置文件与查找顺序)
5. [核心配置：words、ignorePaths、dictionaries](#核心配置wordsignorepathsdictionaries)
6. [自定义词典与 project-words](#自定义词典与-project-words)
7. [CLI 命令与常用选项](#cli-命令与常用选项)
8. [overrides、flagWords、ignoreRegExpList](#overridesflagwordsignoreregexplist)
9. [与 VS Code、CI 集成](#与-vs-codeci-集成)
10. [最佳实践与参考](#最佳实践与参考)

---

## 什么是 cspell

**cspell**（Code Spell Checker）是**面向代码和文档的拼写检查工具**，既提供 **CLI**（`cspell` / `cspell lint`）对指定文件或目录做拼写检查，也提供 **VS Code 扩展** 在编辑时实时标错。支持多语言词典、项目自定义词典、按 glob 忽略文件、按正则忽略片段，并可配置「禁止词」「建议替换」等，适合在仓库内统一拼写并在 CI 中卡住错误。

### 为什么选择 cspell？

- ✅ **面向代码**：默认会忽略代码中的常见模式（如变量名、URL、十六进制），可针对不同文件类型配置
- ✅ **配置灵活**：JSON / YAML / JS 配置，支持 `words`、`ignorePaths`、`dictionaries`、`overrides`、`flagWords` 等
- ✅ **自定义词典**：项目级词典文件（如 `project-words.txt`），支持 `addWords: true` 让工具自动追加新词
- ✅ **多语言**：`language` 可配 `en`、`en-GB`、`en,nl` 等，内置多种语言词典
- ✅ **CLI + 编辑器**：同一套配置可在命令行和 VS Code 扩展中共用
- ✅ **CI 友好**：`failFast`、非零退出码，便于在流水线中阻断拼写错误

### 典型场景

- 文档站、README、注释中的英文拼写检查
- 项目专有名词、产品名、技术术语统一加入词典
- 在 pre-commit 或 CI 中运行 `cspell "**/*.md"` 防止错误合入
- VS Code 中安装 Code Spell Checker 扩展，实时看到拼写问题

---

## 原理：如何做拼写检查

**核心思路**：cspell 对**每个文件**按配置决定是否检查、使用哪些词典；读取文件内容后，按**语言/文件类型**做分词（或按正则匹配「需要检查的片段」），把得到的「词」与启用的词典比对，不在词典中且未被 ignore 的即报错；可结合编辑距离给出建议替换。

- **词典**：内置与可选词典都是「词表」或 trie 结构；`words`、`dictionaries` 定义的词表合并后作为「正确词」集合；`flagWords` 为「一定算错」并可带建议替换。
- **忽略**：`ignorePaths` 用 glob 排除文件；`ignoreRegExpList` 用正则排除片段（如 URL、代码块）；`ignoreWords` 对某些词不报错。
- **overrides**：按 `filename` glob 对部分文件应用不同配置（如某目录用另一语言、或关闭检查），与主配置合并后再执行检查。

---

## 安装与使用方式

### 1. 安装依赖

```bash
pnpm add -D cspell
# 或
npm i -D cspell
```

### 2. CLI 使用

cspell 是 **CLI 工具**，在命令行或 `package.json` 的 scripts 里调用：

```bash
# 检查指定 glob 下的文件
cspell "src/**/*.js"
# 或
cspell lint "src/**/*.js"

# 检查当前目录下所有文件
cspell .
# 或
cspell "**"
```

### 3. 在 package.json 中加脚本

```json
{
  "scripts": {
    "spellcheck": "cspell \"**/*.{md,ts,tsx,json}\"",
    "spellcheck:fix": "cspell \"**/*.{md,ts,tsx}\" --no-progress --words-only --unique | sort --ignore-case >> project-words.txt"
  }
}
```

---

## 配置文件与查找顺序

CSpell 会自动在项目根及子目录中查找配置文件，常见文件名（任选其一即可）：

| 格式 | 文件名示例 |
|------|------------|
| JSON | `.cspell.json`、`cspell.json`、`.cspell.jsonc`、`cspell.jsonc` |
| YAML | `.cspell.yaml`、`cspell.yaml`、`.cspell.yml`、`cspell.yml` |
| 配置目录 | `.config/cspell.json`、`.config/cspell.yaml` 等 |
| 包内 | `package.json` 的 `"cspell"` 字段 |
| JS/TS | `.cspell.config.js`、`cspell.config.mjs`、`cspell.config.cjs` 等 |

查找顺序：当前工作目录向上找，找到即用；也可在 `.vscode/.cspell.json` 下放配置。推荐在项目根使用 **`.cspell.json`** 或 **`cspell.json`**，便于版本管理。

---

## 核心配置：words、ignorePaths、dictionaries

### 最简配置示例（.cspell.json）

```json
{
  "$schema": "https://raw.githubusercontent.com/streetsidesoftware/cspell/main/cspell.schema.json",
  "version": "0.2",
  "language": "en",
  "words": ["vitepress", "VitePress", "tailwindcss"],
  "ignorePaths": ["node_modules", "dist", "*.min.js", "project-words.txt"],
  "dictionaries": ["project-words"],
  "dictionaryDefinitions": [
    {
      "name": "project-words",
      "path": "./project-words.txt",
      "addWords": true
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| **words** | 视为正确的词列表（内联在配置里） |
| **ignorePaths** | glob 列表，匹配到的文件/目录不检查 |
| **dictionaries** | 启用的词典名列表，需在 dictionaryDefinitions 中有定义 |
| **dictionaryDefinitions** | 定义词典：name、path（文件路径或 URL）、addWords 等 |
| **language** | 主语言，如 `"en"`、`"en-GB"`、`"en,nl"` |

- **addWords: true**：表示该词典文件可被工具或扩展「追加新词」（如从 VS Code 里「添加到项目词典」时写入该文件）。
- **ignorePaths** 中的路径相对于配置所在目录或 `globRoot`；常用 `"node_modules"`、`"dist"`、`"**/*.min.js"`。

---

## 自定义词典与 project-words

### 1. 创建词典文件

```bash
touch project-words.txt
```

### 2. 在配置中引用

如上例，`dictionaryDefinitions` 里 `name: "project-words"`、`path: "./project-words.txt"`，再在 `dictionaries` 里写 `["project-words"]`。

### 3. 用 CLI 收集「未知词」并追加

先跑一遍检查，把当前被标错的词（仅词、去重、排序）追加到词典文件，再人工审查删除真正的拼写错误：

```bash
echo "# New Words" >> project-words.txt
cspell --words-only --unique "**/*.md" | sort --ignore-case >> project-words.txt
```

之后在 `project-words.txt` 里删掉不应加入的词，保留专有名词、缩写等。

---

## CLI 命令与常用选项

### 命令

| 命令 | 说明 |
|------|------|
| **cspell** \<paths...\> | 对指定文件/目录做拼写检查（等价于 lint） |
| **cspell lint** \<paths...\> | 同上，显式指定 lint |

### 常用选项

| 选项 | 说明 |
|------|------|
| **--no-progress** | 不显示进度条，适合管道或 CI |
| **--words-only** | 只输出「未知词」一行一个，便于收集到词典 |
| **--unique** | 与 --words-only 配合，去重 |
| **--show-suggestions** | 输出时带建议替换 |
| **--show-context** | 输出时带上下文行 |
| **--config** \<path\> | 指定配置文件路径 |
| **--fail-fast** | 遇到第一个错误就退出（可在配置里设 `failFast: true`） |

示例：

```bash
cspell --no-progress --show-suggestions --show-context "**/*.md"
```

---

## overrides、flagWords、ignoreRegExpList

### overrides

按文件 glob 应用不同配置（如某类文件用不同语言或忽略某些规则）：

```json
{
  "overrides": [
    {
      "filename": "**/dutch/**/*.txt",
      "language": "nl"
    },
    {
      "filename": "**/*.hrr",
      "languageId": "cpp"
    }
  ]
}
```

### flagWords

始终视为错误的词，并可带建议替换（`word:suggestion` 或 `word->suggestion`）：

```json
{
  "flagWords": [
    "color: colour",
    "canot->cannot",
    "cancelled->canceled"
  ]
}
```

### ignoreRegExpList

用正则排除一段内容不检查（如 URL、ALL-CAPS 标识符）：

```json
{
  "ignoreRegExpList": [
    "/https?:\\/\\/[^\\s]+/g",
    "/\\b[A-Z][A-Z0-9_]+\\b/g"
  ]
}
```

---

## 与 VS Code、CI 集成

### VS Code 扩展

安装官方扩展 **Code Spell Checker**（streetsidesoftware.code-spell-checker），扩展会读取项目中的 cspell 配置；可在设置里指定配置文件路径。右键「将 xxx 添加到项目词典」会写入 `dictionaryDefinitions` 里 `addWords: true` 的词典文件。

### CI 中失败即停

在配置中开启 `failFast`，或在脚本里使用 `--fail-fast`（若 CLI 支持），使发现拼写错误时进程退出码非 0，CI 即可失败：

```json
{
  "failFast": true
}
```

```json
// package.json scripts
"spellcheck": "cspell \"**/*.{md,ts,tsx}\" --no-progress"
```

---

## 最佳实践与参考

### 最佳实践

- **根目录一份配置**：用 `.cspell.json` 或 `cspell.json`，便于团队和 CI 统一。
- **ignorePaths 必配**：至少忽略 `node_modules`、`dist`、构建产物和词典文件本身。
- **项目专有词进 project-words**：产品名、库名、缩写等写入 `project-words.txt` 并纳入版本控制。
- **CI 只检查需要的扩展名**：如 `"**/*.{md,ts,tsx}"` 减少噪音与耗时。
- **先 --words-only 收集再人工审**：新项目可先跑一遍把「未知词」导出，审完再决定加入词典或改文案。

### 参考链接

- [CSpell 官方文档](https://cspell.org/docs/)
- [Getting Started](https://cspell.org/docs/getting-started)
- [Configuration 属性](https://cspell.org/docs/Configuration/properties)
- [GitHub: streetsidesoftware/cspell](https://github.com/streetsidesoftware/cspell)
- [npm: cspell](https://www.npmjs.com/package/cspell)
- [VS Code: Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
