# Listr2 从零开始学习指南

## 📚 目录
1. [什么是 Listr2](#什么是-listr2)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 Listr2

Listr2 是 Node.js 中常用的**终端任务列表**库，在同一个列表里顺序或并行执行多个子任务，每个任务可带 Spinner、标题、状态（成功/失败/跳过等），适合“多步骤构建/部署/脚本”的可视化。

### 为什么选择 Listr2？
- ✅ 多个任务一行一个，状态清晰（进行中/成功/失败/跳过）
- ✅ 支持顺序、并行、条件跳过、重试
- ✅ 内置 Spinner，风格与 ora 类似
- ✅ 可嵌套子列表（子任务再开 Listr）
- ✅ 与 ora 相比，更适合“多步骤流水线”而非单个 Spinner

### 典型场景
- CLI 多步骤：安装依赖 → 构建 → 打包 → 上传
-  Monorepo 里对多个包执行 build/test
- 部署流水线：拉代码 → 安装 → 构建 → 发布

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add listr2
# 或 npm install listr2 / yarn add listr2
```

### 2. ESM 引入

```javascript
import { Listr } from 'listr2';
```

---

## 基础用法

### 1. 定义任务列表并执行

每个 task 是 `{ title, task }`，`task` 为异步函数；`ctx` 可在任务间共享数据。

```javascript
import { Listr } from 'listr2';

const tasks = new Listr([
  {
    title: '安装依赖',
    task: async (ctx, task) => {
      await someInstall();
      ctx.installed = true;
    },
  },
  {
    title: '构建',
    task: async (ctx, task) => {
      if (!ctx.installed) throw new Error('请先安装依赖');
      await build();
    },
  },
]);

await tasks.run();
```

### 2. 任务中更新标题与状态

```javascript
{
  title: '下载中',
  task: async (ctx, task) => {
    task.title = '下载完成';
    await download();
    // 成功时自动打勾；失败可 task.report({ message, skip: true } 等）
  },
}
```

### 3. 并行任务

```javascript
const tasks = new Listr(
  [
    { title: 'Task A', task: () => doA() },
    { title: 'Task B', task: () => doB() },
  ],
  { concurrent: true }
);
await tasks.run();
```

---

## 示例与组合

### 1. 条件跳过

```javascript
{
  title: '仅在生产执行',
  skip: (ctx) => ctx.env !== 'production',
  task: async () => { /* ... */ },
}
```

### 2. 嵌套子列表

```javascript
{
  title: '构建所有包',
  task: (_, task) =>
    task.newListr([
      { title: 'build pkg-a', task: () => build('pkg-a') },
      { title: 'build pkg-b', task: () => build('pkg-b') },
    ], { concurrent: true }),
}
```

### 3. 重试与超时

```javascript
{
  title: '请求接口',
  task: async () => fetch(url),
  retry: 3,
  // 可在选项里配置 exitOnError、renderer 等
}
```

### 4. 与 Commander 结合

```javascript
import { Listr } from 'listr2';
import { Command } from 'commander';

const program = new Command();
program.command('deploy').action(async () => {
  const listr = new Listr([
    { title: '拉取代码', task: () => gitPull() },
    { title: '安装依赖', task: () => pnpmInstall() },
    { title: '构建', task: () => build() },
  ]);
  await listr.run();
});
program.parse();
```

---

## 高级特性

### 1. 渲染器

默认在 TTY 下为终端列表；可切到 `silent` 或自定义，适配 CI/无 TTY。

```javascript
new Listr(tasks, {
  renderer: 'default', // 或 'silent' 等
  nonTTYRenderer: 'verbose', // 无 TTY 时
});
```

### 2. ctx 传参

`run()` 可传入初始 context，任务里通过 `ctx` 读写。

```javascript
await tasks.run({ env: 'production' });
// 任务内 ctx.env === 'production'
```

### 3. exitOnError

某个任务失败时是否立刻退出（默认 true）；设为 false 可继续执行后续任务再统一处理。

---

## 最佳实践

- 多步骤流水线用 Listr2，单一步骤用 ora 即可。
- 需要共享数据时用 `ctx`，避免全局变量。
- 在 CI 或无 TTY 下使用 `nonTTYRenderer` 或 `silent`，保证日志可读。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 顺序任务 | `new Listr([...]).run()` |
| 并行任务 | `new Listr([...], { concurrent: true })` |
| 跳过 | `skip: (ctx) => !ctx.needRun` |
| 嵌套 | `task: (_, t) => t.newListr([...])` |
| 传初始 ctx | `tasks.run({ env: 'prod' })` |

---

## 参考与延伸

- [Listr2 文档](https://listr2.kilic.dev/)
- [ora](https://github.com/sindresorhus/ora) - 单任务 Spinner
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - 交互式提问
