# Cosmiconfig 从零开始学习指南

## 📚 目录
1. [什么是 Cosmiconfig](#什么是-cosmiconfig)
2. [原理：如何查找并解析配置](#原理如何查找并解析配置)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 Cosmiconfig

Cosmiconfig 是 Node.js 里常用的**“找并解析配置文件”**的库，按约定在项目根、上级目录等位置查找多种格式（如 `.foorc`、`fooconfig.js`、`package.json` 的 `foo` 字段），并解析成对象，被 ESLint、Prettier、Babel、PostCSS 等大量工具使用。

### 为什么选择 Cosmiconfig？
- ✅ 一套 API 支持多种文件名、多种格式（JSON、YAML、JS、CJS）
- ✅ 自动按“当前目录向上”搜索，找到第一个有效配置即停止
- ✅ 可自定义 searchPlaces、loaders、cache 等，适合做“工具专用配置加载器”

### 典型场景
- 开发 CLI 或构建工具时，需要“像 ESLint 一样”从项目里找 `.xxrc`、`xx.config.js` 等
- 支持多种格式（JSON/YAML/JS）和多种放置位置（根目录、子目录、package.json 字段）
- 不想手写“先找文件再根据扩展名选解析器”的逻辑时，用 cosmiconfig 统一处理

---

## 原理：如何查找并解析配置

Cosmiconfig 的核心是：**按「搜索路径列表」从某目录向上逐级查找约定文件名（如 `.foorc`、`fooconfig.js`、`package.json` 的 `foo` 字段），找到第一个存在且可读的文件后，根据扩展名选对应 loader（JSON/JS/YAML 等）解析成对象**。

1. **搜索路径**：给定 moduleName（如 `eslint`），构造一组候选路径（如 `./.eslintrc.js`、`./.eslintrc.json`、`./package.json` 的 eslint 字段等）；从 `startDir` 开始，依次在该目录、父目录、再父目录…下检查这些路径是否存在。
2. **找到即停**：一旦某个路径存在且可读，即停止向上搜索，返回该文件路径；若到根目录仍无，返回 null。
3. **加载与解析**：根据文件扩展名选择 loader（`.json` → JSON.parse，`.js` → require/import，`.yaml` → YAML 解析等）；对 package.json 则读文件后取指定字段；解析失败则视为无效，可继续尝试其他候选或返回 null。
4. **缓存**：可选地对「文件路径 → 解析结果」做缓存，同一路径多次 search 时直接返回缓存，避免重复读盘。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add cosmiconfig
# 或 npm install cosmiconfig
```

### 2. ESM 引入

```javascript
import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig';
```

---

## 基础用法

### 1. 异步查找并解析（cosmiconfig）

`cosmiconfig(moduleName)` 返回一个 explorer；`explorer.search([startDir])` 从某目录向上找配置，返回 `{ config, filepath }` 或 `null`。

```javascript
import { cosmiconfig } from 'cosmiconfig';

const explorer = cosmiconfig('myapp');
const result = await explorer.search();
if (result) {
  console.log('配置', result.config);
  console.log('文件', result.filepath);
} else {
  console.log('未找到配置');
}
```

### 2. 同步查找（cosmiconfigSync）

```javascript
import { cosmiconfigSync } from 'cosmiconfig';

const explorer = cosmiconfigSync('myapp');
const result = explorer.search();
if (result) {
  console.log(result.config, result.filepath);
}
```

### 3. 指定搜索起点

```javascript
const result = await explorer.search('/path/to/project');
```

---

## 示例与组合

### 1. moduleName 与默认搜索位置

`cosmiconfig('myapp')` 会按约定找例如：  
- `.myapprc`、`.myapprc.json`、`.myapprc.yaml`、`.myapprc.yml`、`.myapprc.js`、`.myapprc.cjs`  
- `myapp.config.js`、`myapp.config.cjs`  
- `package.json` 里的 `myapp` 字段  

具体列表以 cosmiconfig 文档为准，一般包含上述形式。

### 2. 与 Commander 结合

```javascript
import { cosmiconfigSync } from 'cosmiconfig';
import { Command } from 'commander';

const program = new Command();
program.option('-c, --config <path>', 'config file');

program.parse();
const opts = program.opts();
const explorer = cosmiconfigSync('mycli');
const result = opts.config
  ? explorer.load(opts.config)
  : explorer.search();
const config = result?.config ?? {};
```

### 3. 自定义 searchPlaces 与 loaders

需要“只认某几种文件名或格式”时，可传入 `searchPlaces`、`loaders` 等，详见 cosmiconfig 文档。

---

## 高级特性

### 1. 常用 API

| API | 说明 |
|-----|------|
| `cosmiconfig(moduleName)` | 创建异步 explorer |
| `cosmiconfigSync(moduleName)` | 创建同步 explorer |
| `explorer.search([dir])` | 从某目录向上搜索，返回 `{ config, filepath }` 或 null |
| `explorer.load(path)` | 直接加载指定路径的配置文件 |
| `explorer.clearLoadCache()` / `clearSearchCache()` | 清缓存 |

### 2. 缓存

默认会缓存已解析结果；在 watch 或测试中需要“总是重新读”时，可调 `clearLoadCache` / `clearSearchCache`，或构造 explorer 时关掉 cache。

### 3. 与 package.json 的字段

若在 package.json 里写 `"myapp": { "key": "value" }`，cosmiconfig 会把该对象当作 `config`，`filepath` 为该 package.json 的路径。

---

## 最佳实践

- 工具名（moduleName）用简短、唯一的名字，对应 `.xxrc`、`xx.config.js` 等约定。
- 在 CLI 里支持 `-c/--config` 覆盖路径时，有传就用 `load(path)`，没传再用 `search()`。
- 文档里写清楚“会在哪些位置、以何种优先级查找配置”，方便使用者排查。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 异步查找 | `const r = await cosmiconfig('myapp').search()` |
| 同步查找 | `cosmiconfigSync('myapp').search()` |
| 指定起点 | `explorer.search('/path/to/dir')` |
| 直接加载 | `explorer.load('/path/to/config.js')` |
| 取配置 | `result?.config ?? {}` |

---

## 参考与延伸

- [Cosmiconfig GitHub](https://github.com/cosmiconfig/cosmiconfig)
- [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files) - 新版 ESLint 的配置方式
- [Prettier 配置](https://prettier.io/docs/en/configuration.html) - 使用 cosmiconfig 的典型例子
