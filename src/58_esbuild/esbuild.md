# esbuild 学习文档

> 极快的 JavaScript/TypeScript/CSS 打包器，用 Go 编写、编译为原生代码，面向现代 Web 构建；Vite 等工具内置使用

## 📚 目录

1. [用大白话说：esbuild 是啥](#用大白话说esbuild-是啥)
2. [原理：为什么这么快](#原理为什么这么快)
3. [与 Webpack、Rollup 的对比](#与-webpackrollup-的对比)
4. [安装与使用方式](#安装与使用方式)
5. [CLI 与 JS/Go API](#cli-与-jsgo-api)
6. [Build 与 Transform](#build-与-transform)
7. [平台、格式、Watch、Serve](#平台格式watchserve)
8. [插件与扩展](#插件与扩展)
9. [常见坑与最佳实践](#常见坑与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：esbuild 是啥

### 你遇到的问题（构建太慢时）

- **打包慢**：Webpack、Rollup 打一个大项目要几十秒甚至更长，改一行等半天。
- **冷启动慢**：开发时每次起 dev 或改配置都要等。
- **只想做「链接」**：把 TS/JSX 转成 JS、把多文件并成一份、压缩，不需要一堆 loader/plugin 堆叠。

也就是说：**在「把源码打成可用的 JS/CSS」这件事上，做到极快、配置简单**，就是 esbuild 要解决的问题。

### esbuild 帮你做啥

**esbuild** 是一个 **JavaScript/TypeScript/CSS 打包器（bundler）**：

1. **极快**：用 **Go** 写、编译成原生二进制，解析/链接/代码生成高度并行，官方 benchmark 下比 Webpack、Rollup 等快一个数量级（例如 10 份 three.js 生产打包：esbuild ~0.4s，Webpack ~41s）。
2. **开箱即用**：内置 JS、TS、JSX、CSS 支持，无需单独配 TypeScript 编译器或一堆 loader；Tree-shaking、minify、source map 都有。
3. **三种使用方式**：**CLI**、**JavaScript API**、**Go API**；支持 watch、serve、incremental rebuild，适合做 dev 或集成到其他工具里。
4. **定位清晰**：作者明确不做「大而全的 Webpack 替代」——不做类型检查（建议单独跑 tsc）、不做 HMR、不做 Vue/Svelte 等框架的专用编译；复杂需求用**插件**或配合其他工具。

一句话：**esbuild = 极快、简单的「链接器」：把 TS/JSX/CSS 转成、合并、压缩成可用的 JS/CSS**；Vite 的依赖预构建与部分构建就基于 esbuild。

---

## 原理：为什么这么快

**核心原因**（来自官方 FAQ 与文档）：

1. **Go 原生**：不是跑在 Node 里的 JS，而是编译好的原生程序；没有「先启动 JS 引擎、再 JIT 你的打包器」这一层成本，且 Go 天然多线程、共享内存，适合并行。
2. **全链路自研**：解析器、链接、代码生成、minify 都是自己写的，数据结构统一、少做格式转换；不用官方 TypeScript 编译器（为类型服务、不为速度优化），TS 只做「脱类型 + 语法转换」。
3. **高度并行**：大致分三阶段——**解析**、**链接**、**代码生成**；解析和代码生成可完全并行，多核吃满；多 entry 共享的模块只解析一次。
4. **内存与遍历少**：AST 只完整扫几遍（词法/解析/作用域 → 符号绑定、语法压缩、TS/JSX 转换 → 标识符压缩、生成代码、source map），数据尽量待在 CPU 缓存里；不做「字符串 → TS AST → 字符串 → JS AST → 字符串」这种多次序列化。
5. **无缓存也能快**：设计目标就是「无缓存从零打」也很快，所以不依赖复杂的持久化缓存。

可以这么记：**语言选型（Go）+ 自研全链路 + 并行 + 少遍历少转换 = 数量级级别的速度提升**。

---

## 与 Webpack、Rollup 的对比

| 对比项 | esbuild | Webpack | Rollup |
|--------|---------|---------|--------|
| **实现** | Go，原生二进制 | JS，跑在 Node | JS，跑在 Node |
| **速度** | 极快，benchmark 下明显领先 | 较慢，大项目更明显 | 中等 |
| **能力** | 打包、TS/JSX/CSS、minify、Tree-shaking、watch、serve | 全能，loader/plugin 生态极多 | 库打包、Tree-shaking 很好 |
| **类型检查** | 不做，建议单独 tsc | 可配 ts-loader 等 | 可配插件 |
| **HMR** | 无，可自己做 live reload | 内置 | 需配合 |
| **定位** | 快速「链接器」，可被集成 | 应用构建全流程 | 库/应用都可 |
| **适用** | 追求速度、简单管线、被 Vite 等集成 | 复杂应用、需要大量定制 | 发 npm 库、要极致 Tree-shaking |

**简单记**：  
- **要速度、简单管线、或给 Vite 等当引擎** → 用 **esbuild**。  
- **要类型检查** → 用 esbuild 做转译，**再单独跑 tsc**。  
- **要 HMR、框架专用编译** → 用 **Vite（内建 esbuild）** 或 Webpack 等。

---

## 安装与使用方式

### 推荐：项目内安装原生版

```bash
pnpm add -D esbuild
# 或
npm install --save-exact --save-dev esbuild
```

安装后会根据当前系统下载对应平台的原生可执行文件（如 `@esbuild/win32-x64` 等）；**不要**使用 `--ignore-scripts` 和 `--no-optional` 同时用，否则可能拿不到二进制。

### 验证

```bash
./node_modules/.bin/esbuild --version
# Windows: .\node_modules\.bin\esbuild --version
```

### 其他安装方式

- **全局**：`npm i -g esbuild`，可直接用 `esbuild` 命令。
- **WASM 版**：`esbuild-wasm`，跨平台但慢很多，一般只在浏览器或无法用原生二进制时用。
- **从源码编译**：需要安装 Go，在仓库里 `go build ./cmd/esbuild`；通常用 npm 装即可。

**注意**：esbuild 是**平台相关**的，不能把 A 系统的 `node_modules` 拷到 B 系统直接跑，需要在 B 上重新 `npm install`。

---

## CLI 与 JS/Go API

### CLI 快速示例

```bash
# 单文件打包到单文件
esbuild app.jsx --bundle --outfile=out.js

# 多 entry、输出到目录、生产：minify + sourcemap + 指定目标
esbuild app.jsx --bundle --outdir=dist --minify --sourcemap --target=chrome58,firefox57,safari11,edge16

# 监听变更
esbuild app.jsx --bundle --outfile=out.js --watch

# 开发服务（打包结果 + 静态目录）
esbuild app.jsx --bundle --outdir=www --servedir=www
```

### JavaScript API（推荐用 async）

```js
import * as esbuild from 'esbuild';

// 单次构建
await esbuild.build({
  entryPoints: ['app.jsx'],
  bundle: true,
  outfile: 'out.js',
});

// 开发：context + watch + serve
const ctx = await esbuild.context({
  entryPoints: ['app.jsx'],
  bundle: true,
  outdir: 'www',
});
await ctx.watch();
const { port } = await ctx.serve({ servedir: 'www' });
```

**插件**只能用 **异步 API**（`build` / `context`），同步的 `buildSync` 不支持插件。

### Go API

直接调 `github.com/evanw/esbuild/pkg/api`，概念与 JS API 一致，适合用 Go 写的工具链。

---

## Build 与 Transform

### Build（主入口）

- **输入**：一个或多个 **entry** 文件（或 stdin 虚拟文件）。
- **能力**：**bundle**（把 import 打进去）、**Tree-shaking**、**minify**、**source map**、**代码分割**（splitting）、**多 entry**、**自定义 loader**、**插件** 等。
- **输出**：写入 **outfile** 或 **outdir**；可配 **format**（iife/cjs/esm）、**platform**（browser/node/neutral）、**target**（如 node12、chrome80）。

### Transform（单段转换）

- **输入**：一段**字符串**（不读盘、不解析 import）。
- **能力**：把这段内容当 TS/JS/JSX 等做**转译 + 可选的 minify**，返回结果字符串（和 source map）。
- **限制**：不能 bundle、不能用插件；适合「单文件转译」「minify 一段代码」等。

```js
const result = await esbuild.transform('let x: number = 1', { loader: 'ts' });
console.log(result.code); // 'let x = 1;\n'
```

---

## 平台、格式、Watch、Serve

### platform

- **browser**（默认）：输出给浏览器用；会处理 `process.env.NODE_ENV`、`browser` 字段、默认 **iife** 等。
- **node**：输出给 Node；内置模块（如 `fs`）自动 **external**，默认 **cjs**。
- **neutral**：不预设，默认 **esm**。

### format

- **iife**：浏览器脚本，避免污染全局；可配 **globalName**。
- **cjs**：CommonJS，给 Node 或老环境。
- **esm**：ES Module，浏览器需 `<script type="module">`，Node 需 `.mjs` 或 `"type": "module"`。

### target

指定语法降级目标，如 `chrome58`、`node12`；esbuild 会把更新语法转成目标可运行的写法。

### watch

- **CLI**：`--watch`；可加 `--watch=forever` 避免因 stdin 关闭而退出。
- **JS**：`context()` 后 `await ctx.watch()`；要停用可 `ctx.dispose()`。

监听用**轮询**实现，大项目约 2 秒内能发现变更；如需「即时」可自建 watcher + `ctx.rebuild()`。

### serve

- 启动一个 **HTTP 服务**，既提供**本次构建结果**，也可用 **servedir** 提供静态目录（如 `www`）。
- 每次请求会触发一次 build（若需要），再返回结果，所以不会出现「请求到了但还没 build 完」的陈旧结果。
- **仅建议开发用**，不要用于生产。
- 配合 **watch** 可实现 **live reload**：页面里连 `/esbuild` 的 EventSource，收到 `change` 就 `location.reload()`；也可在此基础上自己做 CSS 热替换（不刷新整页）。

---

## 插件与扩展

esbuild 提供 **插件** 接口（仅 **异步 build/context** 可用）：

- **onResolve**：解析 import 路径，可改成虚拟模块或外部包。
- **onLoad**：根据路径返回虚拟文件内容（可配合不同 loader）。

**不做**的事（官方明确）：不做类型检查、不做 Vue/Svelte 等框架的专用编译、不做 HMR、不做「所有前端需求一站式」。复杂需求用插件或上层工具（如 Vite）实现。

---

## 常见坑与最佳实践

### 常见坑

1. **跨平台拷贝 node_modules**：esbuild 二进制是平台相关的，换系统要重新 `npm install`；Docker 里建议在镜像内执行 install。
2. **杀毒软件误报**：原生可执行文件可能被报毒，属误报；可加白名单或改用 `esbuild-wasm`（会慢很多）。
3. **浏览器用 ESM 未加 `type="module"`**：用 `format: 'esm'` 时，若用 `<script src="...">` 必须改成 `<script src="..." type="module">`，否则顶层变量会进全局、易冲突。
4. **Node 打包**：若不想打进去依赖，用 `--platform=node --packages=external`；需要 `__dirname`、`import.meta.url`、`.node` 原生模块等时，也常把依赖 external 掉。
5. **npm 安装**：不要同时用 `--ignore-scripts` 和 `--no-optional`，否则二进制可能没装上。

### 最佳实践

- **生产构建**：开 **minify**、**sourcemap**，按需设 **target**；浏览器用 **iife** 或 **esm**，Node 用 **platform=node** 或 **cjs**。
- **类型检查**：用 esbuild 做**转译**，用 **tsc --noEmit** 做类型检查，两者分离。
- **开发**：用 **context + watch + serve** 或直接使用 **Vite**（内建 esbuild）。
- **版本**：若用于生产，建议锁版本（如 `--save-exact`），避免自动升级带来行为变化。
- **复杂管线**：esbuild 做「快」的那一段，其他（如 HTML 注入、框架编译）交给 Vite、Webpack 或脚本。

---

## 参考与延伸阅读

- [esbuild 官网](https://esbuild.github.io/)
- [Getting Started](https://esbuild.github.io/getting-started/)
- [API 文档](https://esbuild.github.io/api/)（Build、Transform、选项说明）
- [FAQ](https://esbuild.github.io/faq/)（为什么快、benchmark、生产就绪性、杀毒误报等）
- [Plugins](https://esbuild.github.io/plugins/)
- [Content types](https://esbuild.github.io/content-types/)（loader：js/ts/jsx/css 等）
- [GitHub - evanw/esbuild](https://github.com/evanw/esbuild)
- [Vite](https://vitejs.dev/)（默认用 esbuild 做依赖预构建与部分构建）

---

**小结**：**esbuild** 是用 Go 写的极快打包器，主打**解析 + 链接 + 代码生成**，内置 TS/JSX/CSS，支持 Tree-shaking、minify、watch、serve；通过 **CLI / JS / Go API** 使用，适合做简单快速构建或被 Vite 等工具集成；类型检查、HMR、框架专用编译等交给其他工具或插件。
