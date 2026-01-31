# jiti 学习文档

> Node.js 下的运行时 TypeScript 与 ESM 支持，无需预编译即可直接跑 .ts / .mjs；UnJS 生态维护，Nuxt、Tailwind、ESLint 等常用

## 📚 目录

1. [用大白话说：jiti 是啥](#用大白话说jiti-是啥)
2. [原理：怎么做到「运行时跑 TS/ESM」](#原理怎么做到运行时跑-tsesm)
3. [与 ts-node、tsx 的对比](#与-ts-nodetsx-的对比)
4. [安装与使用方式](#安装与使用方式)
5. [createJiti 与 import / require](#createjiti-与-import--require)
6. [CLI 与 register 钩子](#cli-与-register-钩子)
7. [常用选项](#常用选项)
8. [常见场景与最佳实践](#常见场景与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：jiti 是啥

### 你遇到的问题（Node 里直接跑 TS/ESM 时）

- **Node 默认不认 .ts**：直接 `node index.ts` 会报错，要先 `tsc` 或用 ts-node/tsx。
- **ESM 与 CJS 混用麻烦**：项目里既有 `import` 又有 `require`，扩展名、条件导出要配一堆。
- **配置/脚本想用 TS**：例如 `vite.config.ts`、`vitest.config.ts`、各种 `.ts` 脚本，希望「直接跑」不先编译。
- **不想为小脚本上整条构建管线**：只要「能跑 TS/ESM」、轻量、无额外依赖。

也就是说：**在「Node 里直接执行 TypeScript 和 ESM」这件事上，做到零配置、轻量、与 require/import 兼容**，就是 jiti 要解决的问题。

### jiti 帮你做啥

**jiti**（[UnJS](https://unjs.io/) 生态）是一个 **Node.js 下的运行时 TypeScript / ESM 加载器**：

1. **直接跑 .ts / .mjs**：通过 **createJiti** 或 **register 钩子**，让 Node 能 `require()` / `import()` 到 .ts 和 ESM 文件，无需先 `tsc` 或单独构建。
2. **ESM 与 CJS 互通**：自动处理 `import` / `export` 与 `require` / `module.exports` 的互用，同一套代码在 ESM 和 CJS 下都能加载。
3. **按需转译**：只对「需要转译」的语法（TS、JSX、顶层 await 等）做转换，纯 JS 可跳过，减少开销。
4. **缓存**：支持内存与磁盘缓存（如 `node_modules/.cache/jiti`），二次加载更快。
5. **CLI**：`jiti index.ts` 或 `npx jiti index.ts` 直接执行；也可 `node -r jiti/register index.ts` 用 require 钩子。

一句话：**jiti = 在 Node 里「按需转译并加载」TS/ESM 的运行时**，让配置、脚本、工具链里的 .ts 能直接跑，Nuxt、Tailwind、ESLint 等都在用。

---

## 原理：怎么做到「运行时跑 TS/ESM」

### 1. 劫持模块加载

- **register 模式**：通过 `node -r jiti/register` 或 `jiti.register()` 注册到 Node 的 **require** 扩展链；当 `require('./foo.ts')` 时，先由 jiti 处理，转译成 Node 能执行的 JS 再交给 Node 执行。
- **createJiti + import**：`jiti.import(path)` 自己实现「解析路径 → 读文件 → 转译 → 执行」的流程，相当于手动的 `import()`，可替代动态 `import()` 并支持 TS/ESM。

### 2. 转译：只转需要的

- jiti 会**检测文件内容**（是否含 TS 语法、JSX、装饰器等），只对需要转译的文件走 Babel（或内置转换），纯 JS 可原样返回，减少开销。
- 转译结果可写入 **磁盘缓存**（如 `node_modules/.cache/jiti`）或仅内存缓存，下次同文件直接读缓存。

### 3. 解析与 ESM 互操作

- 支持 **Node 的 resolve 规则**（node_modules、package.json 的 main/exports 等）；可选 **esmResolve** 用 ESM 的解析算法（如 `import` 条件）。
- 加载 ESM 时转成 CJS 或通过内部桥接，使 `require('esm-only')` 或 `jiti.import('esm-only')` 能工作。

可以简单记：**劫持 require/自实现 import → 按需转译 TS/ESM → 缓存 → 交给 Node 执行**。

---

## 与 ts-node、tsx 的对比

| 对比项       | jiti                    | ts-node                 | tsx                    |
|--------------|-------------------------|-------------------------|------------------------|
| **定位**     | 运行时 TS/ESM 加载      | 运行时 TS 执行          | 运行时 TS/ESM 执行     |
| **实现**     | Babel 转译 + 缓存       | 官方 ts 或 swc          | esbuild                |
| **零依赖**   | 是（Babel 懒加载）      | 否                      | 否                     |
| **ESM/CJS**  | 互通好                  | 需配置                  | 支持                   |
| **CLI**      | jiti file.ts            | ts-node file.ts         | tsx file.ts            |
| **register** | jiti/register           | ts-node/register        | 支持                   |
| **典型用途** | 配置/脚本/Nuxt 等加载   | 单测、脚本              | 脚本、单测             |

**简单记**：  
- **要轻量、和 UnJS/Nuxt 生态一致、配置/脚本加载 .ts** → 用 **jiti**。  
- **要官方 TypeScript 或 swc** → 用 **ts-node**。  
- **要 esbuild 速度、简单跑脚本** → 用 **tsx**。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D jiti
# 或
npm i jiti --save-dev
```

常用于配置、脚本、工具链，多作为 **devDependencies**。

### 使用方式概览

1. **程序**：`createJiti(import.meta.url)` 得到实例，用 `jiti.import('./file.ts')` 异步加载，或 `jiti('./file.ts')` 同步加载（CJS 风格）。
2. **CLI**：`jiti index.ts` 或 `npx jiti index.ts` 直接执行该文件。
3. **Register**：`node -r jiti/register index.ts`，之后所有 `require('.ts')` 由 jiti 处理。

---

## createJiti 与 import / require

### ESM 下（推荐）

```js
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// 异步加载（替代 import()，支持 .ts）
const mod = await jiti.import("./path/to/file.ts");

// 需要 default 导出时
const modDefault = await jiti.import("./path/to/file.ts", { default: true });
```

- **createJiti(import.meta.url)**：以当前模块的 URL 为「根」做路径解析，保证相对路径正确。
- **jiti.import(path)**：返回 Promise，解析并执行该模块，支持 .ts、.mjs、.cjs 等。

### CJS 下（旧版用法）

```js
const jiti = require("jiti")(__filename);

// 同步加载（替代 require）
const mod = jiti("./path/to/file.ts");
```

- **require("jiti")(__filename)**：以当前文件路径为根。
- **jiti(path)**：同步返回模块导出，等价于 `require()` 但支持 .ts。

### 选项（第二参数）

```js
const jiti = createJiti(import.meta.url, {
  debug: true,
  cache: true,
  esmResolve: true,
  alias: { "#": "./src" },
});
```

见下节「常用选项」。

---

## CLI 与 register 钩子

### CLI

```bash
# 直接执行 .ts 文件
jiti index.ts

# 或通过 npx
npx jiti index.ts
```

相当于用 jiti 加载并执行该文件，无需事先编译。

### Register 钩子

```bash
# 让 Node 的 require 能加载 .ts
node -r jiti/register index.ts
```

之后在 `index.ts` 及其 require 链里，所有 `require('./xxx.ts')` 都会经 jiti 转译后再执行。

### 程序里注册

```js
const jiti = require("jiti")();
const unregister = jiti.register();
// 之后 require('.ts') 由 jiti 处理
// unregister() 可取消
```

---

## 常用选项

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| **debug** | boolean | false | 打印被转译的文件（环境变量 JITI_DEBUG） |
| **cache** | boolean \| string | true | 是否用转译缓存；true 时用 node_modules/.cache/jiti 或 TMP 目录（JITI_CACHE） |
| **esmResolve** | boolean \| string | false | 是否用 ESM 解析算法（如 import 条件）（JITI_ESM_RESOLVE） |
| **sourceMaps** | boolean | false | 是否生成 inline source map（JITI_SOURCE_MAPS） |
| **interopDefault** | boolean | false | 是否把模块的 default 导出作为顶层返回值 |
| **alias** | object | - | 路径别名，如 `{ '#': './src' }`（JITI_ALIAS） |
| **nativeModules** | string[] | ['typescript'] | 这些 node_modules 下的包不转译，直接用原生 require |
| **transformModules** | string[] | - | 这些 node_modules 下的包强制走 jiti 转译（JITI_TRANSFORM_MODULES） |
| **experimentalBun** | boolean | Bun 下默认 true | 是否用 Bun 原生转译（JITI_EXPERIMENTAL_BUN） |

---

## 常见场景与最佳实践

### 1. 配置文件用 .ts（如 vite.config.ts）

构建工具（Vite、Vitest 等）若内置 jiti，会直接用 jiti 加载 `vite.config.ts`，无需你手写；若自己写加载逻辑，可用：

```js
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);
const config = await jiti.import("./vite.config.ts");
```

### 2. 脚本直接跑 .ts

```bash
npx jiti scripts/build.ts
```

或：

```bash
node -r jiti/register scripts/build.ts
```

### 3. 缓存与调试

- 生产或 CI 可保留 **cache: true** 加速重复运行。
- 排查「有没有被转译」时开 **debug: true** 或 `JITI_DEBUG=1`。

### 4. 路径别名

在 createJiti 里传 **alias**，与 tsconfig paths 或构建别名一致，避免运行时路径对不上。

---

## 参考与延伸阅读

- [jiti npm](https://www.npmjs.com/package/jiti)
- [jiti GitHub](https://github.com/unjs/jiti)
- [UnJS - jiti](https://unjs.io/packages/jiti/)
- [jiti v2 roadmap](https://github.com/unjs/jiti/issues/174)

---

**小结**：jiti 通过劫持 require 或自实现 import，在 Node 里按需转译并执行 TS/ESM；用 createJiti + import 或 CLI 或 register 即可直接跑 .ts，适合配置、脚本和 UnJS 生态（如 Nuxt）。
