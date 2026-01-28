# @clack/prompts 从零开始学习指南

## 📚 目录
1. [什么是 @clack/prompts](#什么是-clackprompts)
2. [安装与引入](#安装与引入)
3. [会话起止与取消](#会话起止与取消)
4. [输入类组件](#输入类组件)
5. [选择类组件](#选择类组件)
6. [确认与加载](#确认与加载)
7. [分组与任务](#分组与任务)
8. [展示与日志](#展示与日志)
9. [通用选项与进阶](#通用选项与进阶)
10. [与 @inquirer/prompts 的区别](#与-inquirerprompts-的区别)
11. [最佳实践与参考](#最佳实践与参考)

---

## 什么是 @clack/prompts

**@clack/prompts** 是用于在终端里做**交互式提问**的库，基于 [@clack/core](https://www.npmjs.com/package/@clack/core)，提供一套开箱即用的「提问 UI」：文本框、单选、多选、确认、加载圈、进度条等，风格统一、体积小。

### 为什么选择 @clack/prompts？
- ✅ 体积小（相比其他方案约小 80%）
- ✅ 开箱即用的美观 UI，带边框/引导线
- ✅ API 简单：`text()`、`select()`、`confirm()` 等，返回 Promise
- ✅ 内置 TypeScript 类型
- ✅ 支持 Ctrl+C 取消，用 `isCancel()` 统一处理
- ✅ 提供 `intro`/`outro`、`spinner`、`group`、`tasks`、`log` 等，适合做完整 CLI 流程

### 典型场景
- 脚手架、创建项目时的「项目名 / 框架 / 依赖」交互
- 配置向导、安装后「下一步」提示
- 需要是/否、单选、多选、文本输入的命令行工具

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add @clack/prompts
# 或 npm install @clack/prompts
```

### 2. ESM 引入

```javascript
import {
  intro,
  outro,
  text,
  confirm,
  select,
  multiselect,
  isCancel,
  cancel,
  spinner,
} from '@clack/prompts';
```

### 3. 项目结构示例

```
tools/
├── package.json
├── src/
│   ├── 25_clack_prompts/
│   │   ├── clack-prompts.md   # 本学习文档
│   │   └── 1.base.js          # 示例脚本
│   └── index.js
└── ...
```

---

## 会话起止与取消

### intro / outro

- **intro(title?)**：在交互开始前打出「开头框」，可传标题字符串（支持 ANSI 颜色）。
- **outro(message?)**：在交互结束时打出「结尾框」，可传结束语。

```javascript
import { intro, outro } from '@clack/prompts';

intro('create-my-app');
// … 中间各种 prompt …
outro('You\'re all set!');
```

### isCancel / cancel

用户按 **Ctrl+C** 或取消操作时，多数 prompt 会返回一个 **Symbol**，而不是正常值。用 **isCancel(value)** 判断，并用 **cancel(message?)** 打出取消提示并结束流程。

```javascript
import { isCancel, cancel, text } from '@clack/prompts';

const value = await text({ message: 'Your name?' });
if (isCancel(value)) {
  cancel('Operation cancelled.');
  process.exit(0);
}
console.log('Name:', value);
```

**建议**：每个会返回「可能被取消」的 prompt 后都做一次 `isCancel` 判断，在取消时调用 `cancel()` 并 `process.exit(0)`（或你希望的退出码）。

---

## 输入类组件

### text — 单行文本

```javascript
import { text } from '@clack/prompts';

const name = await text({
  message: 'What is your name?',
  placeholder: 'John Doe',
  initialValue: 'dev',
  validate(value) {
    if (!value || value.length < 2) return 'Name must be at least 2 characters';
  },
});
```

常用选项：

| 选项 | 类型 | 说明 |
|------|------|------|
| `message` | string | 必填，提示文案 |
| `placeholder` | string | 占位符 |
| `initialValue` | string | 初始内容 |
| `validate` | (value) => string \| undefined | 校验，返回字符串即报错 |

### password — 密码（遮罩）

```javascript
import { password } from '@clack/prompts';

const secret = await password({
  message: 'What is your password?',
  mask: '*',
  validate(value) {
    if (!value || value.length < 8) return 'At least 8 characters';
  },
});
```

常用选项：`message`、`mask`（默认 `'▪'`）、`validate`、`clearOnError`（校验失败时是否清空输入）。

---

## 选择类组件

### select — 单选

```javascript
import { select } from '@clack/prompts';

const framework = await select({
  message: 'Pick a framework',
  options: [
    { value: 'next', label: 'Next.js', hint: 'React framework' },
    { value: 'astro', label: 'Astro', hint: 'Content-focused' },
    { value: 'svelte', label: 'SvelteKit', hint: 'Compile-time' },
  ],
});
```

每个选项：**value**（必填，选中时得到）、**label**（展示，默认用 value）、**hint**（可选）、**disabled**（不可选时设为 true）。

### multiselect — 多选

```javascript
import { multiselect } from '@clack/prompts';

const tools = await multiselect({
  message: 'Select tools',
  options: [
    { value: 'eslint', label: 'ESLint', hint: 'recommended' },
    { value: 'prettier', label: 'Prettier' },
  ],
  required: false, // 是否至少选一项
});
// tools 为 value 数组，如 ['eslint', 'prettier']
```

### autocomplete — 可搜索单选

选项较多时，用户边输入边筛选项。

```javascript
import { autocomplete } from '@clack/prompts';

const fw = await autocomplete({
  message: 'Search for a framework',
  options: [
    { value: 'next', label: 'Next.js' },
    { value: 'astro', label: 'Astro' },
    { value: 'svelte', label: 'SvelteKit' },
  ],
  placeholder: 'Type to search...',
});
```

### path — 路径选择

在给定根目录下自动补全文件/目录路径；`directory: true` 时只选目录。

```javascript
import { path } from '@clack/prompts';

const selected = await path({
  message: 'Select a file:',
  root: process.cwd(),
  directory: false,
});
```

---

## 确认与加载

### confirm — 是/否

```javascript
import { confirm } from '@clack/prompts';

const ok = await confirm({
  message: 'Do you want to continue?',
});
// ok 为 true | false 或取消时的 Symbol
```

### spinner — 加载圈

```javascript
import { spinner } from '@clack/prompts';

const s = spinner();
s.start('Installing...');
// 异步操作…
s.stop('Installed.');
// 或 s.cancel('Cancelled.'); 或 s.error('Failed.');
```

常用方法：`start(msg?)`、`message(msg)`、`stop(msg?)`、`cancel(msg?)`、`error(msg?)`、`clear()`。

### progress — 进度条

```javascript
import { progress } from '@clack/prompts';

const p = progress({ style: 'heavy', max: 100, size: 40 });
p.start('Processing');
p.advance(10);
p.advance(25, 'Processing images...');
p.stop('Done');
```

`style` 可选 `'light'`、`'heavy'`、`'block'`。

---

## 分组与任务

### group — 一组 prompt，结果是一个对象

按顺序问多个问题，后面的问题可以用前面答案（如 `results.name`），最终返回 `{ name, age, ... }`。

```javascript
import { group, text, select } from '@clack/prompts';

const result = await group({
  name: () => text({ message: 'Project name?' }),
  framework: ({ results }) =>
    select({
      message: 'Framework?',
      options: [
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
      ],
    }),
}, {
  onCancel: () => { cancel('Cancelled.'); process.exit(0); },
});
// result.name, result.framework
```

### tasks — 多步异步任务，每步一个 spinner

```javascript
import { tasks } from '@clack/prompts';

await tasks([
  {
    title: 'Downloading',
    task: async (message) => {
      // 可调用 message('...') 更新当前步说明
      await doDownload();
      return 'Downloaded';
    },
  },
  {
    title: 'Installing',
    task: async () => {
      await doInstall();
      return 'Installed';
    },
  },
]);
```

---

## 展示与日志

### note — 提示框

```javascript
import { note } from '@clack/prompts';

note('You can edit src/index.jsx', 'Next steps.');
```

### box — 自定义边框的盒子

```javascript
import { box } from '@clack/prompts';

box('Content here', 'Title', {
  contentAlign: 'center',
  titleAlign: 'center',
  width: 'auto',
  rounded: true,
});
```

### log — 语义化日志

```javascript
import { log } from '@clack/prompts';

log.message('Entering src');
log.info('No files to update');
log.success('Done');
log.warn('Directory empty');
log.error('Permission denied');
log.step('Check files');
```

---

## 通用选项与进阶

### 通用选项（多数 prompt 支持）

| 选项 | 说明 |
|------|------|
| `withGuide` | 是否显示默认边框/引导线，可全局用 `updateSettings({ withGuide: false })` 或单次传 |
| `signal` | AbortSignal，便于超时或程序里取消，例如 `AbortSignal.timeout(10000)` |
| `input` / `output` | Node 的 Readable/Writable，用于自定义 stdin/stdout（如测试） |

### updateSettings — 全局配置

```javascript
import { updateSettings } from '@clack/prompts';

updateSettings({
  withGuide: false,
  messages: {
    cancel: 'Operación cancelada',
    error: 'Algo falló',
  },
});
```

### 取消处理模板

```javascript
import { isCancel, cancel } from '@clack/prompts';

function handleCancel(value) {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
}

const name = await text({ message: 'Name?' });
handleCancel(name);
```

---

## 与 @inquirer/prompts 的区别

两者都是终端里的**交互式提问**库，都能做输入、单选、多选、确认等，但出身、API、风格和适用场景不同。项目里已用 [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts)（如 `src/01_commands/4.interactiveCommand.js`），可对照下表决定何时用谁。

### 对照总览

| 维度 | @clack/prompts | @inquirer/prompts |
|------|----------------|-------------------|
| **出身** | [Bombshell/clack](https://github.com/bombshell-dev/clack)，较新，偏「好看 + 小」 | Inquirer 生态的现代重写，兼容 [inquirer](https://www.npmjs.com/package/inquirer) 用法 |
| **体积** | 更小（官方称约比其他方案小 80%） | 相对更大，按需装各子包可减一些 |
| **UI 风格** | 统一边框/引导线、卡片式，偏「现代 CLI」 | 经典终端列表/箭头，偏「传统问答」 |
| **API 风格** | 每个组件一个函数：`text()`、`select()`、`multiselect()`，选项用 `options`、`value`/`label`/`hint` | 每个组件一个函数：`input()`、`select()`、`checkbox()`，选项用 `choices`、`name`/`value` |
| **取消** | 返回 Symbol，需 `isCancel(value)` 判断，再 `cancel()` + 退出 | 多为抛错或通过配置处理，无统一的「取消 Symbol」 |
| **会话包装** | 提供 `intro()` / `outro()` 包住整段交互 | 无内置「起/止」框，需自己打文案 |

### 组件对应关系

| 能力 | @clack/prompts | @inquirer/prompts |
|------|----------------|-------------------|
| 单行文本 | `text()` | `input()` |
| 密码 | `password()` | `password()`（需单独引入或通过 inquirer 用 type: 'password'） |
| 是/否 | `confirm()` | `confirm()` |
| 单选 | `select()` | `select()` |
| 多选 | `multiselect()` | `checkbox()` |
| 可搜索单选 | `autocomplete()` | `search()` 等 |
| 路径选择 | `path()` | 无内置，需自己写或配合其它包 |
| 加载/进度 | `spinner()`、`progress()`、`tasks()` | 无内置，需配合 ora 等 |
| 起/止/说明 | `intro()`、`outro()`、`note()`、`box()`、`log.*` | 无内置 |
| 分组提问 | `group()` | 自己串多个 prompt 或写循环 |
| 打开编辑器 | 无 | `editor()` |

### 各自独有或更强的一点

- **@clack/prompts**：`path()` 选文件/目录、`group()` 一组问题返对象、`tasks()` 多步 spinner、`intro`/`outro`/`note`/`log` 做整段流程的「包装」与说明，整体风格统一、体积小。
- **@inquirer/prompts**：有 `editor()` 打开外部编辑器、`expand()` 简写选择、`rawlist()` 数字选等；和旧版 inquirer 的 `prompt([...])` 思路接近，生态与教程多，若你要兼容既有 inquirer 项目或范例，更容易对齐。

### 选型建议（通俗版）

- **优先考虑 @clack/prompts**：新项目、追求「小 + 好看」、想要 intro/outro/spinner/group/tasks/note 一套配齐、或需要 `path()` 时。
- **优先考虑 @inquirer/prompts**：必须用 `editor()`、要跟现有 inquirer 用法或教程一致、或已有大量基于 inquirer 的脚本时。
- **混用**：一般不必在同一流程里混用，容易风格分裂；若一个项目里既有「老命令」又有「新命令」，可以老命令继续用 inquirer、新命令用 clack。

### 同一流程的写法对比（感受一下 API 差异）

**@inquirer/prompts**（与本仓库 `4.interactiveCommand.js` 一致）：

```javascript
import { input, select, checkbox, confirm } from '@inquirer/prompts';

const name = await input({ message: '模块名称' });
const templates = await checkbox({
  message: '选择模板:',
  choices: [{ name: 'Form', value: 'Form' }, { name: 'Table', value: 'Table' }],
  required: true,
});
const install = await confirm({ message: '是否安装依赖?', default: true });
```

**@clack/prompts**：

```javascript
import { text, multiselect, confirm, isCancel, cancel, intro, outro } from '@clack/prompts';

intro('初始化');
const name = await text({ message: '模块名称' });
if (isCancel(name)) { cancel('已取消'); process.exit(0); }
const templates = await multiselect({
  message: '选择模板:',
  options: [{ value: 'Form', label: 'Form' }, { value: 'Table', label: 'Table' }],
  required: true,
});
if (isCancel(templates)) { cancel('已取消'); process.exit(0); }
const install = await confirm({ message: '是否安装依赖?' });
if (isCancel(install)) { cancel('已取消'); process.exit(0); }
outro('完成');
```

能看到：clack 用 `options` + `value`/`label`、多选叫 `multiselect`，且每个结果都要 `isCancel`；inquirer 用 `choices` + `name`/`value`、多选叫 `checkbox`，取消方式不同。

---

## 最佳实践与参考

### 实践建议

1. **统一处理取消**：对每个可能被取消的 prompt 使用 `isCancel`，取消时 `cancel()` + `process.exit(0)`。
2. **用 intro/outro 包住流程**：让用户明确「开始」和「结束」。
3. **选项多时用 autocomplete**：提升可搜索、可筛选体验。
4. **长耗时用 spinner 或 tasks**：避免「静默等待」。
5. **校验用 validate**：在 `text`/`password` 里做好格式、长度校验。

### 速查表

| 需求 | 组件 / 方法 |
|------|-------------|
| 单行输入 | `text({ message, placeholder, validate })` |
| 密码 | `password({ message, mask, validate })` |
| 是/否 | `confirm({ message })` |
| 单选 | `select({ message, options })` |
| 多选 | `multiselect({ message, options, required })` |
| 可搜索单选 | `autocomplete({ message, options })` |
| 路径 | `path({ message, root, directory })` |
| 加载中 | `spinner()` → `start` / `stop` / `message` |
| 进度条 | `progress({ max, style })` → `start` / `advance` / `stop` |
| 一组问题 | `group({ key: fn }, { onCancel })` |
| 多步任务 | `tasks([{ title, task }])` |
| 起/止/取消 | `intro` / `outro` / `isCancel` / `cancel` |
| 说明与日志 | `note` / `box` / `log.*` |

### 参考链接

- [npm @clack/prompts](https://www.npmjs.com/package/@clack/prompts)
- [Bombshell Clack 文档（Prompts）](https://bomb.sh/docs/clack/packages/prompts/)
- [Getting Started](https://bomb.sh/docs/clack/basics/getting-started/)
- [GitHub bombshell-dev/clack](https://github.com/bombshell-dev/clack)
- 本目录 **1.base.js** — 可直接运行的入门示例
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts) — 对比与选型见上文「与 @inquirer/prompts 的区别」
- 本仓库 [4.interactiveCommand.js](../01_commands/4.interactiveCommand.js) — 使用 @inquirer/prompts 的交互示例
