# Ora 从零开始学习指南

## 📚 目录
1. [什么是 Ora](#什么是-ora)
2. [原理：Spinner 如何显示](#原理spinner-如何显示)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 Ora

Ora 是 Node.js 中流行的**终端旋转加载指示器（Spinner）**库，用于在命令行中显示“正在加载…”等异步任务的进度反馈。

### 为什么选择 Ora？
- ✅ API 简洁，链式调用直观
- ✅ 支持 `start` / `succeed` / `fail` / `warn` / `info` 等状态
- ✅ 可与 Promise 结合：`oraPromise` 自动根据成功/失败切状态
- ✅ 可配置 spinner 样式、颜色、前缀/后缀文本
- ✅ 自动检测 TTY / CI，无 TTY 时不显示动画
- ✅ 纯 ESM，与 Chalk 组合方便

### 典型场景
- 构建、打包、编译时的“正在构建…”
- 安装依赖、拉取资源时的“正在下载…”
- 接口请求、文件读写时的“正在处理…”

---

## 原理：Spinner 如何显示

Ora 的核心是：**在 TTY 下定时重写同一行，循环显示一组字符帧，形成“旋转”动画；非 TTY 或 CI 下不输出动画**。

1. **同一行重写**：通过终端「回车回到行首 + 覆盖写」或「\r」在同一行不断刷新内容，避免多行刷屏。每次刷新显示当前帧字符（如 `|`、`/`、`-`、`\` 循环）。
2. **帧与定时器**：内置多组 spinner 帧数组（如 `['|', '/', '-', '\\']`），用 `setInterval` 或 `setTimeout` 按固定间隔（如 80ms）切换到下一帧并重绘当前行文本（前缀 + 帧字符 + 后缀）。
3. **TTY 检测**：通过 `process.stdout.isTTY` 判断是否为交互终端；在 CI 或管道中通常为 false，此时不启动定时器、不输出动画，只输出纯文本或静默，避免日志乱码。
4. **状态与清理**：`succeed` / `fail` 等会清除定时器、把当前行改为最终状态（如 ✓ / ✗）并换行，避免与后续输出混在一起。

---

## 安装与引入

### 1. 安装依赖

```bash
npm install ora
# 或
pnpm add ora
# 或
yarn add ora
```

### 2. ESM 引入

```javascript
import ora from 'ora';

const spinner = ora('Loading...').start();
// 异步完成后
spinner.succeed('Done!');
```

### 3. 项目结构示例

```
tools/
├── package.json
├── src/
│   ├── 03_ora/
│   │   ├── ora.md      # 本学习文档
│   │   └── demo.js     # 示例脚本（可选）
│   └── index.js
└── ...
```

---

## 基础用法

### 1. 创建并启动 Spinner

`ora(text)` 或 `ora(options)` 创建实例，`.start(text?)` 开始旋转；不调用 `.start()` 不会动。

```javascript
import ora from 'ora';

// 字符串简写
const spinner = ora('Loading unicorns').start();

// 配置对象
const spinner2 = ora({
  text: '正在加载...',
  color: 'cyan',
}).start();

// 先创建再 start，可省略 start 时的文本
const spinner3 = ora().start('开始任务');
```

### 2. 结束状态：succeed / fail / warn / info

结束时调用对应方法，会停止动画并用不同符号与颜色“定格”最后一行。

| 方法 | 符号 | 含义 |
|------|------|------|
| `.succeed(text?)` | ✔ 绿 | 成功 |
| `.fail(text?)` | ✖ 红 | 失败 |
| `.warn(text?)` | ⚠ 黄 | 警告 |
| `.info(text?)` | ℹ 蓝 | 提示 |

```javascript
const spinner = ora('正在安装依赖').start();

try {
  await doSomething();
  spinner.succeed('安装完成');
} catch (e) {
  spinner.fail('安装失败');
}

// 可传入新文案，不传则沿用当前 text
spinner.succeed('自定义成功文案');
spinner.fail('自定义失败文案');
spinner.warn('自定义警告文案');
spinner.info('自定义提示文案');
```

### 3. 仅停止与清除

```javascript
spinner.stop();   // 停止并清除当前行，不保留 ✔/✖
spinner.clear();  // 只清除显示，不改变内部状态
```

### 4. 动态修改文案与颜色

实例的 `.text`、`.prefixText`、`.color` 等可在运行中修改。

```javascript
const spinner = ora('Loading unicorns').start();

setTimeout(() => {
  spinner.color = 'yellow';
  spinner.text = 'Loading rainbows';
}, 1000);

setTimeout(() => {
  spinner.succeed('All done!');
}, 2000);
```

### 5. 与异步逻辑配合（手动）

```javascript
const spinner = ora('正在构建...').start();

try {
  await build();
  spinner.succeed('构建完成');
} catch (err) {
  spinner.fail('构建失败: ' + err.message);
}
```

---

## 示例与组合

### 1. 封装“带 Spinner 的异步任务”

```javascript
import ora from 'ora';

async function runWithSpinner(fn, options = {}) {
  const { start = '处理中...', success = '完成', fail = '失败' } = options;
  const spinner = ora(start).start();
  try {
    const result = await fn();
    spinner.succeed(success);
    return result;
  } catch (e) {
    spinner.fail(`${fail}: ${e.message}`);
    throw e;
  }
}

// 使用
await runWithSpinner(() => fetchData(), {
  start: '正在拉取数据...',
  success: '拉取完成',
  fail: '拉取失败',
});
```

### 2. 使用 oraPromise 自动 succeed/fail

`oraPromise(action, text)` 或 `oraPromise(action, options)`：根据 Promise 的 resolve/reject 自动调用 succeed/fail。

```javascript
import { oraPromise } from 'ora';

// action 可以是 Promise，或 (spinner) => Promise
const result = await oraPromise(
  fetch('https://api.example.com/data').then(r => r.json()),
  '正在请求接口...'
);
// resolve → ✔ 成功；reject → ✖ 失败

// 自定义成功/失败文案
await oraPromise(someAsyncTask(), {
  text: '正在执行...',
  successText: '执行成功',
  failText: (err) => `执行失败: ${err.message}`,
});
```

### 3. prefixText / suffixText

在 Spinner 前/后固定显示一段文字，适合多步骤时区分“当前步骤”。

```javascript
const spinner = ora({
  text: '正在编译',
  prefixText: '[Step 1/3]',
  suffixText: 'please wait',
}).start();

// 运行中也可改
spinner.prefixText = '[Step 2/3]';
spinner.text = '正在打包';
```

### 4. 与 Chalk 组合给文字上色

Ora 只给 Spinner 符号和默认输出上色；若要给 `text` 里某一段上色，可配合 Chalk。

```javascript
import ora from 'ora';
import chalk from 'chalk';

const spinner = ora(`Loading ${chalk.red('critical')} data...`).start();
spinner.succeed(chalk.green('Done!'));
```

### 5. 运行中输出其他日志

在 Spinner 转的时候，若往同一流（默认 stderr）写内容，Ora 会暂时清掉当前行、输出你的内容、再在下面重新画出 Spinner。因此可直接用 `console.log` / `console.error`，不必用特殊 API。

```javascript
const spinner = ora('Processing...').start();

console.log('Step 1 complete');
console.log('Step 2 complete');

spinner.succeed('Done!');
```

### 6. 自定义“定格”符号：stopAndPersist

不想用 ✔/✖/⚠/ℹ 时，可用 `.stopAndPersist(options?)` 自己指定符号和文案。

```javascript
spinner.stopAndPersist({
  symbol: '📦',
  text: '已生成 dist/',
});
```

---

## 高级特性

### 1. 配置项（options）

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `text` | `string` | - | Spinner 右侧主文案 |
| `prefixText` | `string \| () => string` | - | 前缀文案 |
| `suffixText` | `string \| () => string` | - | 后缀文案 |
| `spinner` | `string \| object` | `'dots'` | 样式名或 `{ frames, interval }` |
| `color` | `string \| boolean` | `'cyan'` | 颜色；`false` 表示不用颜色 |
| `hideCursor` | `boolean` | `true` | 是否隐藏光标 |
| `indent` | `number` | `0` | 左侧缩进空格数 |
| `interval` | `number` | 依 spinner | 每帧间隔（毫秒） |
| `stream` | `stream.Writable` | `process.stderr` | 输出流 |
| `isEnabled` | `boolean` | 自动检测 | 是否启用 Spinner（无 TTY/CI 时多为 false） |
| `isSilent` | `boolean` | `false` | 为 true 时完全不输出 |
| `discardStdin` | `boolean` | `true` | 是否在 TTY 下丢弃 stdin（减少键盘导致抖动） |

```javascript
const spinner = ora({
  text: 'Loading',
  prefixText: '[build]',
  color: 'yellow',
  spinner: 'dots',
  indent: 2,
  stream: process.stderr,
}).start();
```

### 2. 自定义 Spinner 动画

`spinner` 可为对象：`{ frames: string[], interval?: number }`。

```javascript
const spinner = ora({
  text: 'Custom animation',
  spinner: {
    frames: ['-', '+', '-'],
    interval: 80,
  },
}).start();
```

内置样式名来自 [cli-spinners](https://github.com/sindresorhus/cli-spinners)，如 `'dots'`、`'line'`、`'arrow'`、`'clock'` 等；Windows 非 Windows Terminal 下通常会回退到 `line`。

### 3. 无 TTY / CI 时的行为

- 若 `stream` 不在 TTY 环境（或被管道、重定向），或检测到 CI，Ora 默认会**关闭动画**，只保留纯文字输出。
- 可通过 `isEnabled: true` 强制开、`isEnabled: false` 强制关。
- `isSilent: true` 时，连文字都不输出，适合“安静模式”。

```javascript
const spinner = ora({
  text: 'Building...',
  isEnabled: process.stdout.isTTY,
  isSilent: process.env.CI === 'true',
}).start();
```

### 4. 实例属性（可读可写）

| 属性 | 说明 |
|------|------|
| `.text` | 主文案 |
| `.prefixText` | 前缀 |
| `.suffixText` | 后缀 |
| `.color` | 颜色 |
| `.spinner` | 样式名或对象 |
| `.indent` | 缩进 |
| `.isSpinning` | 是否正在转（只读） |
| `.interval` | 帧间隔（只读，通常由 spinner 决定） |

### 5. 手动渲染与取单帧

需要自己控制刷新节奏或把 Spinner 嵌到别的输出里时：

```javascript
spinner.render();  // 立刻按当前状态重绘一帧
const frame = spinner.frame();  // 只拿当前帧字符串，不写屏
```

### 6. oraPromise 的 successText / failText

`successText`、`failText` 可以是字符串或函数，用于在 resolve/reject 时动态生成结束文案。

```javascript
await oraPromise(async () => {
  const res = await fetch(url);
  return res.json();
}, {
  text: '请求中...',
  successText: (result) => `获取到 ${result.count} 条`,
  failText: (err) => `请求失败: ${err.message}`,
});
```

---

## 最佳实践

### 1. 同一时间只用一个 Spinner

不要并发展示多个 Ora 实例，否则输出会乱。需要多个任务进度时，考虑 [listr2](https://github.com/listr2/listr2) 或 [spinnies](https://github.com/jcarpanelli/spinnies)。

### 2. 长时间同步会“冻住”动画

Spinner 靠定时器刷新，若主线程被同步大计算或 `fs.readFileSync` 占满，动画会卡住。尽量在“异步空隙”里做事，或用 Worker 把重活移出主线程。

### 3. Worker 线程中不要直接用 Ora

Worker 里没有“交互式终端”，Ora 不会动。做法是：在主线程起 Spinner，Worker 通过 `postMessage` 把状态（如 text、succeed/fail）发回主线程，由主线程调用 `spinner.text`、`spinner.succeed()` 等。

### 4. 与 Commander 等 CLI 结合

```javascript
import ora from 'ora';
import { Command } from 'commander';

const program = new Command();

program
  .command('build')
  .action(async () => {
    const spinner = ora('Building...').start();
    try {
      await doBuild();
      spinner.succeed('Build done');
    } catch (e) {
      spinner.fail('Build failed');
      process.exit(1);
    }
  });

program.parse();
```

### 5. 区分“仅关动画”与“完全静默”

- 无 TTY 时，Ora 默认仍会输出纯文字，只是没有转动效果。
- 需要“完全不出任何东西”时，用 `isSilent: true` 或在外层根据环境决定是否创建 Spinner。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 最简单 | `ora('Loading...').start()` |
| 成功结束 | `spinner.succeed('Done')` |
| 失败结束 | `spinner.fail('Failed')` |
| 警告/提示 | `spinner.warn('Warn')` / `spinner.info('Info')` |
| 只停不保留符号 | `spinner.stop()` |
| 包一层 Promise | `await oraPromise(promise, 'Loading...')` |
| 自定义成功/失败文案 | `oraPromise(p, { text, successText, failText })` |
| 改颜色/文案 | `spinner.color = 'red'`；`spinner.text = 'New text'` |
| 前缀/后缀 | `prefixText` / `suffixText` |
| 无 TTY 关动画 | 默认自动；或 `isEnabled: false` |

---

## 参考与延伸

- [Ora GitHub](https://github.com/sindresorhus/ora)
- [cli-spinners](https://github.com/sindresorhus/cli-spinners) - Spinner 帧数据
- [Chalk](https://github.com/chalk/chalk) - 与 Ora 组合给文案上色
- [listr2](https://github.com/listr2/listr2) - 多任务列表 + 每行一个 Spinner
- [yocto-spinner](https://github.com/sindresorhus/yocto-spinner) - 更轻量的 Spinner 替代
