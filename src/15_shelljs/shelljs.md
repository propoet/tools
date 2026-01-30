# ShellJS 从零开始学习指南

## 📚 目录
1. [什么是 ShellJS](#什么是-shelljs)
2. [原理：如何用 JS 模拟 Shell 命令](#原理如何用-js-模拟-shell-命令)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 ShellJS

ShellJS 是 Node.js 里**用 JS 写“类 Shell”命令**的库，提供 `cd`、`ls`、`cp`、`rm`、`mkdir`、`cat`、`exec` 等，在脚本里像在终端里一样操作文件和执行命令，适合“跨平台构建/部署脚本、工具脚本”。

### 为什么选择 ShellJS？
- ✅ 一套 API，在 Windows / macOS / Linux 上表现一致（在 Node 能做的范围内）
- ✅ 同步写法为主，适合“顺序执行一堆命令”的脚本
- ✅ 内置 cd、ls、cp、rm、mkdir、cat、exec、echo、pwd、which 等，不必手写 fs/child_process

### 典型场景
- 构建/部署脚本里复制、删除、打包、执行外部命令
- 工具或脚手架里“在指定目录下执行一系列命令”
- 需要跨平台又不想写一堆 path、spawn 的脚本

### 与 execa 的区别
- **ShellJS**：偏向“在 JS 里写一串类 Shell 操作”，同步、内置很多文件/目录命令。
- **execa**：偏向“执行外部命令”，Promise、管道、本地二进制支持更好，更现代。  
复杂脚本可混用：文件操作用 ShellJS 或 fs-extra，调外部命令用 execa。

---

## 原理：如何用 JS 模拟 Shell 命令

ShellJS 的核心是：**在 Node 里用 `fs`、`path`、`child_process` 等 API 实现「类 Shell」的语义，对外暴露 cd、ls、cp、rm 等同步方法，并维护当前工作目录等状态**。

1. **状态**：内部维护「当前工作目录」等状态；`cd(path)` 相当于 `process.chdir(path)`，后续命令（如 `ls()`）在該目录下执行。
2. **文件/目录命令**：`cp`、`rm`、`mkdir`、`cat` 等用 Node 的 `fs`、`path` 实现；跨平台时用 path 处理分隔符、用 fs 的递归选项实现 `-r` 等，保证 Windows/Unix 行为一致。
3. **exec**：`shell.exec(cmd)` 内部用 `child_process.execSync`（或 exec）执行整句命令，经 shell 解释；返回值包含 stdout、stderr、code，便于脚本里判断成功与否。
4. **同步为主**：多数方法为同步，便于「顺序执行一串操作」的脚本写法；异步或大量 I/O 时仍可能阻塞事件循环，需注意使用场景。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add shelljs
# 或 npm install shelljs / yarn add shelljs
```

### 2. 引入方式

```javascript
const shell = require('shelljs');
// 或 ESM
import shell from 'shelljs';
```

---

## 基础用法

### 1. cd / pwd

```javascript
import shell from 'shelljs';

shell.cd('dist');
console.log(shell.pwd()); // 当前目录
shell.cd('..');
```

### 2. ls / find

```javascript
shell.ls('src/*.js').forEach(f => console.log(f));
const files = shell.find('src').filter(f => f.endsWith('.js'));
```

### 3. cp / rm / mv / mkdir

```javascript
shell.mkdir('-p', 'dist/assets');
shell.cp('-r', 'public/*', 'dist/');
shell.rm('-rf', 'dist/cache');
shell.mv('old.txt', 'new.txt');
```

### 4. cat / echo

```javascript
const content = shell.cat('package.json').stdout;
shell.echo('hello').to('out.txt');
```

### 5. exec(command)

执行一条 shell 命令，返回对象含 `code`、`stdout`、`stderr`；默认同步。

```javascript
const result = shell.exec('git status');
if (result.code !== 0) {
  shell.echo('Error: ' + result.stderr);
  shell.exit(1);
}
console.log(result.stdout);
```

---

## 示例与组合

### 1. 构建脚本示例

```javascript
import shell from 'shelljs';

shell.cd('project-root');
shell.rm('-rf', 'dist');
shell.mkdir('-p', 'dist');
shell.cp('-r', 'public/*', 'dist/');
const r = shell.exec('pnpm run build');
if (r.code !== 0) shell.exit(1);
```

### 2. 与 Commander 结合

```javascript
import shell from 'shelljs';
import { Command } from 'commander';

const program = new Command();
program.command('build').action(() => {
  shell.cd('packages/app');
  const r = shell.exec('pnpm build');
  if (r.code !== 0) process.exit(1);
});
program.parse();
```

### 3. 跨平台注意

- `ls`、`cp`、`rm` 等已做跨平台处理，但复杂命令用 `exec()` 时仍依赖当前环境的 shell（Windows 上可能是 cmd/powershell）。
- 路径尽量用 `path.join` 或相对路径，少写硬编码 `/`。

---

## 高级特性

### 1. 常用命令与参数

| 命令 | 说明 |
|------|------|
| `cd(path)` | 切换工作目录 |
| `pwd()` | 当前目录 |
| `ls(path)` | 文件列表，支持通配符 |
| `find(path)` | 递归列出文件 |
| `cp([-r], src, dest)` | 复制，-r 递归 |
| `rm([-rf], path)` | 删除，-r 递归 -f 强制 |
| `mv(src, dest)` | 移动 |
| `mkdir([-p], path)` | 建目录，-p 递归 |
| `cat(file)` | 读文件内容，通过 .stdout 取 |
| `echo(msg).to(file)` | 写入文件 |
| `exec(cmd)` | 执行 shell 命令 |
| `exit(code)` | 退出进程 |

### 2. config

```javascript
shell.config.silent = true;  // exec 不把输出打到终端
shell.config.fatal = true;   // 命令失败时抛错并 exit
```

### 3. 链式写法

部分命令返回对象带 `.to()`、`.stdout` 等，可链式或再取值。

---

## 最佳实践

- 只做“一串简单文件/目录操作 + 少量 exec”时用 ShellJS 即可；复杂异步、管道、多进程用 execa 更合适。
- 在脚本里用 `shell.config.fatal = true` 可在命令失败时立刻退出，便于 CI。
- 路径与命令字符串避免拼接用户输入，防止注入；必要时用 execa 的数组参数形式更安全。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 切目录 | `shell.cd('dir')` |
| 列文件 | `shell.ls('src/*.js')` |
| 递归复制 | `shell.cp('-r', 'src', 'dist')` |
| 递归删除 | `shell.rm('-rf', 'dist')` |
| 建目录 | `shell.mkdir('-p', 'a/b')` |
| 执行命令 | `shell.exec('git status')` |
| 读文件 | `shell.cat('f.txt').stdout` |
| 写文件 | `shell.echo('x').to('f.txt')` |

---

## 参考与延伸

- [ShellJS GitHub](https://github.com/shelljs/shelljs)
- [execa](https://github.com/sindresorhus/execa) - 现代子进程/命令执行
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - 文件系统扩展
