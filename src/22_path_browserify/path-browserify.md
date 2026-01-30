# path-browserify 从零开始学习指南

## 📚 目录
1. [什么是 path-browserify](#什么是-path-browserify)
2. [原理：如何在浏览器里实现 path](#原理如何在浏览器里实现-path)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 path-browserify

path-browserify 是 Node.js 内置模块 **path** 的浏览器实现，在打包工具（Webpack、Vite 等）里常作为 `path` 的 polyfill，让依赖 `path` 的代码在浏览器端也能运行，API 与 Node 的 path 尽可能一致。

### 为什么选择 path-browserify？
- ✅ API 与 Node `path` 对齐（如 join、resolve、dirname、basename、extname 等）
- ✅ 无 Node 专属依赖，可在纯浏览器环境或打包后的前端代码中运行
- ✅ 被 Webpack、Browserify 等用作 `path` 的 fallback，工程化里“间接使用”很多

### 典型场景
- 依赖 `path` 的库在浏览器端打包时，通过 resolve.alias 或 polyfill 把 `path` 指到 path-browserify
- 同构代码（SSR/构建脚本共用）里写 `import path from 'path'`，在浏览器侧由打包工具换成 path-browserify
- 不需要“真文件系统”，只需要“路径拼写、解析”的逻辑时，在浏览器里用 path-browserify 替代 path

### 与 Node path 的区别
- Node 的 path 依赖操作系统与真实文件系统；path-browserify 只做**字符串层面的路径处理**，不访问文件系统。
- 在浏览器里没有 `__dirname`、`process.cwd()` 等，通常由打包工具注入或改用 `import.meta.url`、静态路径等。

---

## 原理：如何在浏览器里实现 path

path-browserify 的核心是：**只做「路径字符串」的解析与拼接，不依赖 Node 的 fs 或操作系统 API；用纯 JS 实现 join、resolve、dirname、basename、extname 等，按 POSIX 或当前平台约定处理分隔符与规范化**。

1. **纯字符串**：所有 API 的输入输出都是字符串；不访问文件系统，不调用 `fs` 或 `path` 的 Node 专属能力，因此可在浏览器或任意 JS 环境运行。
2. **与 Node path 对齐**：实现与 Node 的 path 模块相同的函数签名与语义（如 resolve 的拼接顺序、dirname 的边界情况），便于「写一份代码、Node 用 path、浏览器用 path-browserify」。
3. **分隔符与平台**：内部根据 `sep`、`delimiter` 等处理 Windows/Unix 差异；浏览器端通常按 Unix 风格（`/`）即可，或由打包工具注入平台。
4. **打包时替换**：构建工具通过 resolve.alias 把 `path` 指到 path-browserify，业务代码仍写 `import path from 'path'`，无需改代码。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add path-browserify
# 或 npm install path-browserify
```

### 2. 引入方式

```javascript
import path from 'path-browserify';
// 或 CommonJS
const path = require('path-browserify');
```

在打包配置里把 `path` 指到 path-browserify 时，业务里可继续写 `import path from 'path'`，由 alias 决定实际加载谁。

---

## 基础用法

### 1. path.join / path.resolve

```javascript
import path from 'path-browserify';

path.join('a', 'b', 'c');           // 'a/b/c' 或 'a\\b\\c'（由实现决定，通常统一为 /）
path.resolve('a', 'b', 'c');        // 从“当前目录”解析出的绝对路径形式（浏览器里往往是假想根）
```

### 2. path.dirname / path.basename / path.extname

```javascript
path.dirname('/foo/bar/baz.txt');   // '/foo/bar'
path.basename('/foo/bar/baz.txt');  // 'baz.txt'
path.basename('/foo/bar/baz.txt', '.txt'); // 'baz'
path.extname('/foo/bar/baz.txt');   // '.txt'
```

### 3. path.normalize / path.sep / path.delimiter

```javascript
path.normalize('a/../b/./c');       // 'b/c'
path.sep;                           // '/' 或 '\\'
path.delimiter;                     // ':' 或 ';'
```

### 4. path.relative / path.isAbsolute

```javascript
path.relative('/a/b', '/a/b/c');   // 'c'
path.isAbsolute('/foo');           // true
path.isAbsolute('foo');            // false
```

---

## 示例与组合

### 1. 在 Vite 里做 path 的 alias

```javascript
// vite.config.js
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      path: 'path-browserify',
    },
  },
});
```

这样业务里 `import path from 'path'` 在浏览器构建时会用 path-browserify。

### 2. 在 Webpack 里做 fallback

```javascript
resolve: {
  fallback: {
    path: require.resolve('path-browserify'),
  },
},
```

### 3. 同构代码里根据环境选 path

```javascript
import path from 'path-browserify'; // 或根据 process.env / import.meta 选 'path' / 'path-browserify'
const dir = path.join(base, 'sub');
```

---

## 高级特性

### 1. 与 Node path 的差异

- **path.posix / path.win32**：Node 的 path 有这两个子对象；path-browserify 不一定完全实现，使用前需查文档或源码。
- **绝对路径含义**：在浏览器里没有“当前工作目录”，`resolve`、`relative` 等往往基于字符串规则，不反映真实文件系统。

### 2. 常见 API 一览

| API | 说明 |
|-----|------|
| `path.join(...segments)` | 用分隔符拼接 |
| `path.resolve(...segments)` | 解析为“绝对形式” |
| `path.dirname(p)` | 目录部分 |
| `path.basename(p, ext?)` | 文件名，可选去掉扩展名 |
| `path.extname(p)` | 扩展名 |
| `path.normalize(p)` | 规范化 |
| `path.relative(from, to)` | 相对路径 |
| `path.isAbsolute(p)` | 是否绝对路径 |
| `path.sep` / `path.delimiter` | 分隔符 |

---

## 最佳实践

- 仅在“需要 path 的 API 且运行在浏览器/打包后环境”时引入 path-browserify；Node 脚本里直接用 `import path from 'path'`。
- 通过打包工具的 alias/fallback 统一把 `path` 指到 path-browserify，业务代码尽量保持 `import path from 'path'`，便于同构。
- 不在浏览器里依赖 `path.resolve()` 的“真实绝对路径”语义，只当字符串处理用。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 拼接 | `path.join('a', 'b', 'c')` |
| 解析 | `path.resolve('a', 'b')` |
| 目录名 | `path.dirname('/a/b/c')` |
| 文件名 | `path.basename('/a/b/c.txt')` |
| 扩展名 | `path.extname('/a/b/c.txt')` |
| 规范化 | `path.normalize('a/../b')` |
| 相对路径 | `path.relative('/a', '/a/b')` |
| 是否绝对 | `path.isAbsolute(p)` |

---

## 参考与延伸

- [path-browserify GitHub](https://github.com/browserify/path-browserify)
- [Node.js path](https://nodejs.org/api/path.html) - 官方 path 文档
- [Vite resolve.alias](https://vitejs.dev/config/shared-options.html#resolve-alias) - 在 Vite 中配置 path 别名
