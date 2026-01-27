# Progress 从零开始学习指南

## 📚 目录
1. [什么是 Progress](#什么是-progress)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 Progress

Progress（npm 包名 `progress`）是 Node.js 中常用的**终端进度条**库，根据当前值/总值或 tick 数量在终端画出一条进度条，适合“已知总量”的长时间任务（下载、批量处理等）。

### 为什么选择 Progress？
- ✅ API 简单：`new Progress(format, total)`，再 `tick()` 或 `update(current)`
- ✅ 自带多种预设格式（条、百分比、eta 等）
- ✅ 无额外依赖，体积小
- ✅ 与 ora（Spinner）互补：有总量用 progress，不确定进度用 ora

### 典型场景
- 大文件下载、批量文件处理、构建步骤计数
- 已知总条数的大数组/流处理进度展示

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add progress
# 或 npm install progress / yarn add progress
```

### 2. 引入（CommonJS 为主）

```javascript
const ProgressBar = require('progress');
// 若在 ESM 项目： import pkg from 'progress'; const ProgressBar = pkg.default || pkg;
```

---

## 基础用法

### 1. 创建并推进进度条

`format` 里可用 `:bar`、`:percent`、`:current/:total`、`:elapsed`、`:eta` 等占位符。

```javascript
const ProgressBar = require('progress');
const bar = new ProgressBar(':bar :percent :current/:total', {
  total: 100,
  width: 30,
});
const timer = setInterval(() => {
  bar.tick();
  if (bar.complete) {
    clearInterval(timer);
  }
}, 50);
```

### 2. 常用占位符

| 占位符 | 说明 |
|--------|------|
| `:bar` | 进度条本身 |
| `:percent` | 百分比 |
| `:current` | 当前值 |
| `:total` | 总值 |
| `:elapsed` | 已用时间（秒） |
| `:eta` | 预计剩余时间（秒） |

### 3. tick(delta) 与 update(current, total?)

- `bar.tick()`：当前值 +1（或传入 `tick(2)` 等步长）。
- `bar.update(0.5)`：按比例更新，0~1；或 `bar.update({ current, total })`。

```javascript
bar.tick();        // +1
bar.tick(5);       // +5
bar.update(0.75);  // 75%
```

---

## 示例与组合

### 1. 下载/流处理示例

```javascript
const bar = new ProgressBar('  downloading [:bar] :percent :etas', {
  total: 100,
  width: 40,
  complete: '=',
  incomplete: ' ',
});
// 在每收到一块数据时 bar.tick() 或 bar.update(loaded/total)
```

### 2. 无 total 的“不确定进度”

不设 `total` 时只显示“进行中”，适合与 Spinner 类似的场景，但 progress 更偏向“有刻度”的展示。

### 3. 自定义字符

```javascript
new ProgressBar(':bar', {
  total: 50,
  complete: '█',
  incomplete: '░',
});
```

---

## 高级特性

### 1. 选项

| 选项 | 说明 |
|------|------|
| `total` | 总步数或总数值 |
| `width` | 进度条宽度（字符数） |
| `stream` | 输出流，默认 stderr |
| `complete` / `incomplete` | 已完成/未完成字符 |
| `clear` | 完成后是否清行，默认 true |

### 2. 与 ESM 一起用

若项目为 `"type": "module"`，可用：

```javascript
import progress from 'progress';
const Bar = progress.default || progress;
const bar = new Bar(':bar', { total: 10 });
bar.tick();
```

（具体以当前版本导出方式为准，必要时用 `createRequire` 引入。）

---

## 最佳实践

- 有明确“总量”时用 progress；没有时用 ora。
- 在 CI/无 TTY 下可根据 `process.stderr.isTTY` 决定是否创建进度条，避免刷屏。
- 完成后一般会 `clear`，若需保留结果可设 `clear: false`。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 创建 | `new ProgressBar(':bar :percent', { total: 100 })` |
| 推进 | `bar.tick()` / `bar.tick(n)` |
| 按比例 | `bar.update(0.5)` |
| 完成判断 | `bar.complete` |

---

## 参考与延伸

- [progress npm](https://www.npmjs.com/package/progress)
- [cli-progress](https://www.npmjs.com/package/cli-progress) - 另一款进度条，支持多条
- [ora](https://github.com/sindresorhus/ora) - 无总量时的 Spinner
