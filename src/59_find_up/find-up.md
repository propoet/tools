# find-up 学习文档

> 从当前目录向上（父目录）或向下（子目录）查找文件/目录，常用于找配置文件、项目根目录

## 📚 目录

1. [用大白话说：find-up 是啥](#用大白话说find-up-是啥)
2. [原理：怎么「向上找」](#原理怎么向上找)
3. [安装与使用方式](#安装与使用方式)
4. [API 一览](#api-一览)
5. [选项说明](#选项说明)
6. [matcher 与 findUpStop](#matcher-与-findupstop)
7. [findDown 向下查找](#finddown-向下查找)
8. [常见场景与示例](#常见场景与示例)
9. [相关包与延伸阅读](#相关包与延伸阅读)

---

## 用大白话说：find-up 是啥

### 你遇到的问题（要找配置文件时）

- **不知道在哪**：`.gitignore`、`package.json`、`.eslintrc` 可能在当前目录，也可能在父目录，手写路径容易错。
- **要「最近的」**：项目在 monorepo 子包里，想找「离当前目录最近」的 `package.json`，而不是根目录的。
- **要通用**：不同工具都要「向上找某个文件」，不想每个都写一遍 `fs.existsSync` + `path.join(dir, '..')` 循环。

也就是说：**从当前目录（或指定目录）开始，一层层往父目录走，找到第一个匹配的文件或目录并返回路径**，就是 find-up 要解决的问题。

### find-up 帮你做啥

**find-up**（Sindre Sorhus 维护）是一个 **「向上/向下查找文件或目录」** 的 Node 库：

1. **向上找（findUp）**：从 `cwd` 开始，依次检查当前目录、父目录、再父目录……直到找到**第一个**匹配项或到达根/`stopAt`，返回**绝对路径**或 `undefined`。
2. **多名字**：可传**单个名字**或**名字数组**（按数组顺序，返回第一个找到的）。
3. **向下找（findDown）**：从 `cwd` 开始向**子目录**查找，可限制深度与搜索策略（广度/深度优先）。
4. **同步/异步**：提供 `findUp` / `findUpSync`、`findUpMultiple` / `findUpMultipleSync`、`findDown` / `findDownSync`。
5. **可定制**：支持 **matcher 函数**（自定义匹配逻辑）、**type**（file/directory/both）、**stopAt**（停止目录）、**limit**（多结果数量上限）等。

一句话：**find-up = 从某目录向上（或向下）逐层查找指定名称/满足条件的文件或目录，返回路径**；常用于找项目根、配置文件、`.git` 等。

---

## 原理：怎么「向上找」

**核心思路**：

1. **起点**：默认 `process.cwd()`，也可通过 `cwd` 指定（支持 `URL` 或字符串）。
2. **逐层**：在当前目录检查是否存在目标**文件名**（或 matcher 返回的路径）；若不存在，则 `path.join(cwd, '..')` 进入父目录，重复直到找到或到达根目录（或 `stopAt`）。
3. **类型**：通过 `type: 'file' | 'directory' | 'both'` 只匹配文件、只匹配目录、或两者都可。
4. **符号链接**：默认 `allowSymlinks: true`，符号链接若指向的目标类型符合也会算匹配；设为 `false` 则只匹配「真实」文件/目录。

**findDown**：从 `cwd` 出发，沿子目录搜索，可用 `depth` 限制层数、`strategy: 'breadth'|'depth'` 控制广度/深度优先。

---

## 安装与使用方式

### 安装

```bash
pnpm add find-up
# 或
npm i find-up
```

要求 **Node 18+**（使用原生 `node:fs` 等）。

### 基础用法

```js
import { findUp, findUpSync } from 'find-up';

// 异步：从当前目录向上找 package.json
const pkgPath = await findUp('package.json');
console.log(pkgPath); // 绝对路径 或 undefined

// 同步
const pkgPathSync = findUpSync('package.json');
```

```js
// 多个名字，返回第一个找到的（按数组顺序）
const path = await findUp(['.env.production', '.env']);
```

---

## API 一览

| API | 说明 | 返回值 |
|-----|------|--------|
| **findUp(name, options?)** | 向上找单个/多个名字，异步 | `Promise<string \| undefined>` |
| **findUpSync(name, options?)** | 同上，同步 | `string \| undefined` |
| **findUpMultiple(name, options?)** | 向上找，返回**所有**匹配路径，异步 | `Promise<string[]>` |
| **findUpMultipleSync(name, options?)** | 同上，同步 | `string[]` |
| **findDown(name, options?)** | 从 cwd 向**下**找，异步 | `Promise<string \| undefined>` |
| **findDownSync(name, options?)** | 同上，同步 | `string \| undefined` |

- **name**：可以是 `string`、`string[]`（多名字时按顺序找第一个），或 **matcher** 函数（见下）。
- **findUpMultiple** 支持选项 **limit**（数字），限制返回数量，默认不限制。

---

## 选项说明

### findUp / findUpMultiple 的 options

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| **cwd** | `URL \| string` | `process.cwd()` | 开始搜索的目录 |
| **type** | `'file' \| 'directory' \| 'both'` | `'file'` | 匹配类型：仅文件、仅目录、或都可 |
| **allowSymlinks** | `boolean` | `true` | 是否把符号链接算作匹配 |
| **stopAt** | `URL \| string` | 根目录 | 搜索到此目录仍未找到则停止（仅 findUp 系） |
| **limit** | `number` | `Infinity` | 最多返回几条结果（仅 findUpMultiple 系） |

### findDown 的 options

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| **cwd** | `URL \| string` | `process.cwd()` | 开始搜索的目录 |
| **depth** | `number` | `1` | 向下遍历的最大层数 |
| **type** | `'file' \| 'directory' \| 'both'` | `'file'` | 同上 |
| **allowSymlinks** | `boolean` | `true` | 同上 |
| **strategy** | `'breadth' \| 'depth'` | `'breadth'` | 广度优先 / 深度优先 |

### 示例：指定起点与类型

```js
import { findUp } from 'find-up';

// 从 /tmp 开始向上找 .git（可能是文件或目录，如 submodule）
const gitPath = await findUp('.git', { cwd: '/tmp', type: 'both' });

// 只找到某层目录就停
const pkg = await findUp('package.json', { stopAt: '/home' });
```

---

## matcher 与 findUpStop

### matcher 函数

第一个参数可以不是名字字符串，而是一个 **matcher(directory)** 函数：对每个被检查的目录调用，可返回：

- **路径字符串**：表示在该目录下找到的匹配路径（相对或绝对，会与 directory 组合）。
- **findUpStop**：立即停止搜索并返回 `undefined`。
- **undefined**：当前目录不匹配，继续往父目录找。

```js
import path from 'node:path';
import { pathExists } from 'path-exists';
import { findUp, findUpStop } from 'find-up';

// 自定义：找到含 unicorn.png 的目录
const dir = await findUp(
  async (directory) => {
    const hasUnicorn = await pathExists(path.join(directory, 'unicorn.png'));
    return hasUnicorn ? directory : undefined;
  },
  { type: 'directory' }
);

// 性能优化：遇到名为 work 的目录就停止
await findUp((directory) => {
  if (path.basename(directory) === 'work') return findUpStop;
  return 'package.json';
});
```

### findUpStop

从 `find-up` 导入的 **Symbol**：在 matcher 里 return 它，会**立刻结束搜索**并让 findUp 返回 `undefined`，适合在「已经知道再往上没必要」时提前退出。

---

## findDown 向下查找

从 **cwd** 开始向**子目录**查找，而不是父目录。

```js
import { findUp, findDown } from 'find-up';

// 找「最近的、其直接子目录里含有 example.js 的」父目录（如 monorepo 包根）
const root = await findUp(
  async (directory) => findDown('example.js', { cwd: directory, depth: 1 })
);
```

- **depth**：只向下几层，默认 `1` 表示只查 cwd 的直接子目录。
- **strategy**：`'breadth'` 先浅后深，`'depth'` 先深后浅。

---

## 常见场景与示例

### 找 package.json

```js
const pkgPath = await findUp('package.json');
if (pkgPath) {
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf-8'));
}
```

### 找 .env（优先 .env.local）

```js
const envPath = await findUp(['.env.local', '.env']);
```

### 找项目根（含 .git 的目录）

```js
const gitDir = await findUp('.git', { type: 'directory' });
const root = gitDir ? path.dirname(gitDir) : undefined;
```

### 找所有上级的 package.json（如 monorepo）

```js
const allPkgs = await findUpMultiple('package.json', { limit: 5 });
```

### 指定起点目录

```js
const configPath = await findUp('.eslintrc.js', { cwd: __dirname });
```

### 只匹配目录

```js
const nodeModules = await findUp('node_modules', { type: 'directory' });
```

---

## 相关包与延伸阅读

- **find-up-cli**：find-up 的命令行版本，可在 shell 里直接「向上找文件」。
- **package-up**：专门找最近的 `package.json`（基于 find-up 的语义）。
- **pkg-dir**：找 npm 包根目录（含 package.json 的目录）。
- **resolve-from**：从指定目录起做 `require.resolve` 风格的模块解析。

### 参考链接

- [GitHub - sindresorhus/find-up](https://github.com/sindresorhus/find-up)
- [npm - find-up](https://www.npmjs.com/package/find-up)
- [find-up-cli](https://github.com/sindresorhus/find-up-cli)
- [package-up](https://github.com/sindresorhus/package-up)
- [pkg-dir](https://github.com/sindresorhus/pkg-dir)

---

**小结**：**find-up** 从指定目录（默认当前目录）**向上**逐层查找文件或目录，支持单名、多名、matcher 函数和 **findUpStop**；另有 **findDown** 向下查找、**findUpMultiple** 返回所有匹配；选项包括 **cwd**、**type**、**stopAt**、**limit** 等，常用于找配置文件、项目根、package.json。
