# cli-progress 从零开始学习指南

## 📚 目录
1. [什么是 cli-progress](#什么是-cli-progress)
2. [原理：进度条如何绘制与多条并存](#原理进度条如何绘制与多条并存)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 cli-progress

cli-progress 是 Node.js 中常用的**终端进度条**库，支持单条、多条、自定义格式和样式，适合脚本或 CLI 里展示“已知总量”的进度（下载、批量处理、构建步骤等）。

### 为什么选择 cli-progress？
- ✅ 单条/多条进度条并存（MultiBar）
- ✅ 预设多种样式（bar、line 等），可自定义字符
- ✅ 支持 ETA、百分比、当前/总值等占位符
- ✅ 与 progress 相比，多条进度、配置方式更灵活

### 典型场景
- 批量下载、批量构建、多任务并发时的多条进度
- 需要“条 + 百分比 + ETA”的脚本输出

---

## 原理：进度条如何绘制与多条并存

cli-progress 的核心是：**单条时在同一行按 format 占位符（bar、percentage、value/total 等）拼出字符串并 \r 刷新；多条时用 MultiBar 管理多行，每行一个 Bar 实例，按顺序刷新避免交错**。

1. **占位符与刷新**：format 中 `{bar}`、`{percentage}`、`{value}`、`{total}`、`{eta}` 等根据当前 value/total 计算并替换；每次 `increment()`/`update()` 后重算字符串并写入对应行，用 `\r` 或光标控制在同一行覆盖。
2. **MultiBar**：多条进度条时，每个 Bar 绑定到 MultiBar 的一个「槽位」；刷新时按槽位顺序逐行输出，避免多个 Bar 同时写 stdout 导致错位。
3. **样式**：bar 的字符、长度、颜色等可配置；与 progress 包类似，依赖 TTY 与 stdout 的「可重写行」能力，非 TTY 下可选只输出纯文本。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add cli-progress
# 或 npm install cli-progress / yarn add cli-progress
```

### 2. ESM 引入

```javascript
import cliProgress from 'cli-progress';
const { SingleBar, MultiBar } = cliProgress;
```

---

## 基础用法

### 1. 单条进度条（SingleBar）

```javascript
import cliProgress from 'cli-progress';

const bar = new cliProgress.SingleBar({
  format: '进度 |{bar}| {percentage}% | {value}/{total}',
  barCompleteChar: '█',
  barIncompleteChar: '░',
  hideCursor: true,
});

bar.start(100, 0);
for (let i = 0; i <= 100; i++) {
  bar.update(i);
  await sleep(20);
}
bar.stop();
```

### 2. 占位符

format 中常用：`{bar}`、`{percentage}`、`{value}`、`{total}`、`{eta}`、`{duration}` 等。

### 3. start(total, value?, payload?) 与 update(value?, payload?)

- `bar.start(total, startValue)`：开始，总数与初始值。
- `bar.update(value, payload)`：更新当前值；`payload` 可替换 format 里的自定义占位符。

```javascript
bar.start(100, 0, { file: 'a.txt' });
bar.update(50, { file: 'a.txt' });
bar.update(100);
bar.stop();
```

---

## 示例与组合

### 1. 多条进度条（MultiBar）

```javascript
import cliProgress from 'cli-progress';

const multibar = new cliProgress.MultiBar({
  format: ' {title} |{bar}| {percentage}%',
  barCompleteChar: '█',
  barIncompleteChar: '░',
  hideCursor: true,
});

const b1 = multibar.create(100, 0, { title: '任务A' });
const b2 = multibar.create(50, 0, { title: '任务B' });
// 分别 b1.update(n); b2.update(n);
multibar.stop();
```

### 2. 与流/下载结合

在每收到一块数据时 `bar.update(loaded)`，`loaded` 与 `total` 一致时完成，再 `bar.stop()`。

### 3. 无 TTY 时禁用

```javascript
const bar = process.stderr.isTTY
  ? new cliProgress.SingleBar(opts)
  : null;
if (bar) {
  bar.start(total, 0);
  bar.update(n);
  bar.stop();
} else {
  console.log(`Progress: ${n}/${total}`);
}
```

---

## 高级特性

### 1. 常用选项

| 选项 | 说明 |
|------|------|
| `format` | 格式字符串，含 {bar}、{percentage}、{value}、{total}、{eta} 等 |
| `barCompleteChar` / `barIncompleteChar` | 已完成/未完成字符 |
| `hideCursor` | 是否隐藏光标，默认 true |
| `stopOnComplete` | 到 100% 是否自动 stop |
| `clearOnComplete` | 完成后是否清行 |

### 2. 自定义 format 与 payload

format 里写 `{name}`，则在 `update(value, { name: 'x' })` 里传入，用于显示文件名、状态等。

---

## 最佳实践

- 有“总量”时用进度条，没有时用 ora。
- 多任务并进时用 MultiBar，单任务用 SingleBar。
- 在 CI/管道下根据 `isTTY` 关闭进度条或改用纯文本输出。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 单条 | `new SingleBar(opts).start(total, 0)` → `update(n)` → `stop()` |
| 多条 | `new MultiBar(opts)` → `create(total, 0, payload)` → 各条 update → `stop()` |
| 格式 | `format: '|{bar}| {percentage}% {value}/{total}'` |

---

## 参考与延伸

- [cli-progress npm](https://www.npmjs.com/package/cli-progress)
- [progress](https://www.npmjs.com/package/progress) - 更轻量的单条进度条
- [ora](https://github.com/sindresorhus/ora) - 无总量时的 Spinner
