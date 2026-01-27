# Execa 从零开始学习指南

## 📚 目录
1. [什么是 Execa](#什么是-execa)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 Execa

Execa 是 Node.js 中流行的**子进程执行库**，在 `child_process` 之上提供 Promise、模板字符串、管道、本地二进制等能力，适合在脚本或工具里“调外部命令”。

### 为什么选择 Execa？
- ✅ Promise/async-await 原生支持，无需手动包 callback
- ✅ 支持 `$` 模板字符串写法，命令与参数更直观
- ✅ 默认不经过 shell，参数数组化，降低注入风险
- ✅ 可直接执行本地 `node_modules/.bin` 中的命令，不必写 npx
- ✅ 支持管道、获取中间输出、大 buffer（约 100MB）
- ✅ 跨平台（Windows/macOS/Linux）表现一致

### 典型场景
- 在 CLI/脚本里执行 `git`、`npm`、`pnpm`、构建命令等
- 管道串联多个命令（如 `git log | head`）
- 读取命令的 stdout/stderr，做解析或打日志
- 替代 `child_process.exec`/`spawn`，写法更简洁

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add execa
# 或 npm install execa / yarn add execa
```

### 2. ESM 引入

```javascript
import { execa, execaSync } from 'execa';
// 或使用 $ 模板字符串接口
import { $ } from 'execa';
```

---

## 基础用法

### 1. execa(command, arguments?)

执行命令，返回 Promise，resolve 为 `{ stdout, stderr, exitCode }` 等。

```javascript
import { execa } from 'execa';

const { stdout } = await execa('echo', ['hello']);
console.log(stdout); // 'hello'

const { stdout: out } = await execa('node', ['--version']);
console.log(out); // 'v20.x.x'
```

### 2. $ 模板字符串（推荐）

参数通过模板字符串传入，自动转义，避免手写数组。

```javascript
import { $ } from 'execa';

const branch = await $`git branch --show-current`;
console.log(branch.stdout.trim());

await $`npm run build`;
const out = await $`ls -la`;
```

### 3. 获取退出码与错误

默认情况下，进程退出码非 0 会 **reject**；可通过 `reject: false` 让 Promise 总是 resolve，再根据 `exitCode` 判断。

```javascript
const result = await execa('false', [], { reject: false });
console.log(result.exitCode); // 1
```

---

## 示例与组合

### 1. 传环境变量与 cwd

```javascript
await execa('npm', ['run', 'build'], {
  cwd: '/path/to/project',
  env: { NODE_ENV: 'production' },
});
```

### 2. 管道

```javascript
import { $ } from 'execa';

await $`git log --oneline | head -5`;
// 或使用 pipe 显式串联
const p = await execa('echo', ['a\nb\nc']).pipe(execa('wc', ['-l']));
console.log(p.stdout);
```

### 3. 继承 stdio（实时输出）

```javascript
await execa('npm', ['run', 'dev'], {
  stdio: 'inherit', // 直接打到当前终端
});
```

### 4. 与 Commander 结合

```javascript
import { execa } from 'execa';
import { Command } from 'commander';

const program = new Command();
program.command('build').action(async () => {
  await execa('pnpm', ['run', 'build'], { stdio: 'inherit' });
});
program.parse();
```

---

## 高级特性

### 1. 常用选项

| 选项 | 说明 |
|------|------|
| `cwd` | 工作目录 |
| `env` | 环境变量（可覆盖 `process.env`） |
| `stdio` | 'pipe' / 'inherit' / 'ignore' 等 |
| `reject: false` | 非 0 退出码不 reject，由调用方判断 |
| `shell: true` | 经 shell 执行（如需要 `|`、`$VAR` 等） |
| `input` | 作为 stdin 传入子进程 |

### 2. execaSync

同步执行，返回 `{ stdout, stderr, exitCode }`，失败抛错。

```javascript
import { execaSync } from 'execa';
const r = execaSync('node', ['--version']);
```

### 3. 本地二进制

当前项目 `node_modules/.bin` 下的命令可直接写命令名，execa 会按 npm 约定解析。

```javascript
await execa('eslint', ['src/']);
```

---

## 最佳实践

- 优先用 `$` 模板字符串，参数清晰且自动转义。
- 需要“实时看到输出”时用 `stdio: 'inherit'`。
- 在脚本里调外部命令优先用 execa，少用 `child_process.exec` 的字符串形式以降低注入风险。
- 管道或复杂 shell 语法可设 `shell: true`，或拆成多步 execa + 手动传数据。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 执行命令 | `await execa('cmd', ['arg'])` |
| 模板字符串 | `await $`cmd arg`` |
| 不抛错 | `execa('cmd', [], { reject: false })` |
| 指定目录 | `execa('cmd', [], { cwd: './dir' })` |
| 实时输出 | `execa('cmd', [], { stdio: 'inherit' })` |
| 同步 | `execaSync('cmd', ['arg'])` |

---

## 参考与延伸

- [execa GitHub](https://github.com/sindresorhus/execa)
- [Node.js child_process](https://nodejs.org/api/child_process.html)
- [zx](https://github.com/google/zx) - Shell 脚本风格，与 `$` 类似
