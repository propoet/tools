# rimraf 学习文档

> 跨平台的「删除目录/文件」实现，相当于 Node 里的 `rm -rf`，支持异步与同步、Glob

## 📚 目录

1. [用大白话说：rimraf 是啥](#用大白话说rimraf-是啥)
2. [原理：为什么需要跨平台 rm](#原理为什么需要跨平台-rm)
3. [与 fs.rm、shell rm 的关系](#与-fsrmshell-rm-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [核心 API：rimraf、rimrafSync](#核心-apirimrafrimrafsync)
6. [CLI 与选项](#cli-与选项)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：rimraf 是啥

### 你遇到的问题（要删目录时）

- **Windows 没有 rm -rf**：在 Windows 下写脚本或 CI 里想「删掉整个目录」，不能直接写 `rm -rf dist`，跨平台脚本会失败。
- **Node fs.rm 行为**：Node 的 `fs.rm(path, { recursive: true })` 在部分版本/场景下行为不一，希望有稳定、跨平台的封装。
- **构建前清空**：`build` 前要清空 `dist`、`out` 等目录，希望一行代码或一个命令搞定。

也就是说：**在「跨平台、稳定地删除目录或文件」这件事上，提供 Node API 和 CLI**，就是 rimraf 要解决的问题。

### rimraf 帮你做啥

**rimraf**（Isaac Z. Schlueter 等维护）是一个 **跨平台删除库**：

1. **rimraf(path[, options])**：异步删除文件或目录（递归），返回 Promise；支持字符串路径或 Glob 数组。
2. **rimrafSync(path[, options])**：同步删除，同上。
3. **CLI**：`rimraf <path> [options]`，可在 package.json 的 scripts 里用，如 `rimraf dist`。
4. **Glob**：v4.2+ 支持 `--glob` 或 options.glob，按模式删除多个路径。
5. **跨平台**：在 Windows、macOS、Linux 上行为一致，不依赖 shell 的 rm。

一句话：**rimraf = Node 里的「rm -rf」**，跨平台、可编程、可 CLI。

---

## 原理：为什么需要跨平台 rm

- **Unix**：`rm -rf path` 递归强制删除；Windows 没有等价命令，需用 `rd /s /q` 或 Node API。
- **Node fs**：`fs.rmSync(path, { recursive: true, force: true })`（Node 14.14+）可递归删；老版本需 `fs.rmdirSync` 递归或借助第三方库；rimraf 封装了递归与边界情况，保证各平台一致。
- **Glob**：要删 `dist/*.js`、`cache/**` 等，rimraf 可配合 glob 选项一次删多路径。

---

## 与 fs.rm、shell rm 的关系

| 角色 | 作用 |
|------|------|
| **rimraf** | 跨平台、递归删除的 Node 库与 CLI；封装递归、符号链接、权限等。 |
| **fs.rm / fs.rmSync** | Node 内置，`recursive: true` 可递归删；rimraf 在其上做封装与兼容。 |
| **shell rm -rf** | Unix 命令；Windows 无；脚本里用 rimraf 可跨平台。 |

**简单记**：脚本/CI 里要「删目录」用 rimraf；要完全用 Node 内置则用 `fs.rm(recursive: true)`（Node 14.14+）。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D rimraf
# 或
npm i -D rimraf
```

### 使用方式

- **编程**：`import { rimraf, rimrafSync } from 'rimraf'`，传路径或路径数组，可选 options。
- **CLI**：`npx rimraf dist` 或 scripts 里 `"clean": "rimraf dist"`。

---

## 核心 API：rimraf、rimrafSync

### rimraf(path[, options])

异步删除，返回 Promise。path 可为字符串或字符串数组。

```javascript
import { rimraf } from 'rimraf';

await rimraf('./dist');
await rimraf(['./dist', './cache']);
```

- **options**：如 `{ glob: true }` 启用 glob；`{ maxRetries, retryDelay }` 重试；详见官方文档。
- **返回值**：Promise，resolve 时表示删除完成（或路径不存在）。

### rimrafSync(path[, options])

同步删除，同上，无返回值（抛错即失败）。

```javascript
import { rimrafSync } from 'rimraf';

rimrafSync('./dist');
```

---

## CLI 与选项

### 基本语法

```bash
rimraf <path> [path ...] [options]
```

- **path**：要删除的路径，可多个；支持 glob（如 `--glob 'dist/*.js'`，以版本为准）。
- **options**：如 `--glob` 启用 glob 模式；见 `rimraf --help`。

### 示例

```bash
rimraf dist
rimraf dist cache
rimraf --glob 'bundles/*.js'
```

在 package.json 里：

```json
"scripts": {
  "clean": "rimraf dist",
  "prebuild": "rimraf dist"
}
```

---

## 常见场景与最佳实践

1. **构建前清空**：`prebuild` 或 `build` 里先 `rimraf dist`，再执行构建。
2. **CI/脚本**：用 `rimraf` 而不是 `rm -rf`，保证 Windows/Linux/macOS 一致。
3. **编程**：需要异步时用 `await rimraf(path)`，需要同步时用 `rimrafSync(path)`。
4. **Glob**：要删多路径或模式时，用数组或 `--glob`，避免多次调用。

---

## 参考与延伸阅读

- [rimraf npm](https://www.npmjs.com/package/rimraf)
- [rimraf GitHub](https://github.com/isaacs/rimraf)
