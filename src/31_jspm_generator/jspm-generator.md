# @jspm/generator 学习指南

## 📚 目录
1. [它解决什么问题](#它解决什么问题)
2. [原理：Bare Specifier 解析与 Import Map 生成](#原理bare-specifier-解析与-import-map-生成)
3. [核心概念：Import Map](#核心概念import-map)
3. [安装与运行前提](#安装与运行前提)
4. [Generator 基本用法（install / getMap）](#generator-基本用法install--getmap)
5. [环境条件 env（browser / production / module 等）](#环境条件-envbrowser--production--module-等)
6. [Provider（jspm / jsdelivr / unpkg / nodemodules）](#providerjspm--jsdelivr--unpkg--nodemodules)
7. [link：从源码扫描依赖并生成映射](#link从源码扫描依赖并生成映射)
8. [inputMap：把 import map 当锁文件用](#inputmap把-import-map-当锁文件用)
9. [htmlInject：自动注入 importmap / es-module-shims / preload / integrity](#htmlinject自动注入-importmap--es-module-shims--preload--integrity)
10. [调试：logStream 与环境变量](#调试logstream-与环境变量)
11. [在线服务：api.jspm.io/generate（何时用）](#在线服务apijspmiogenerate何时用)
12. [常见坑与最佳实践](#常见坑与最佳实践)
13. [参考链接](#参考链接)

---

## 它解决什么问题

`@jspm/generator` 是 JSPM 生态里用于**生成 Import Map** 的底层库（Node 侧 API）。你可以把它理解成「import map 的包管理器」：

- 把 `react`、`lit/html.js` 这类 **bare specifier** 解析为具体 URL（CDN 或本地 `node_modules`）。
- 支持 **条件导出**（`exports` / `imports`）、**多环境分支**（`browser`/`node`、`production`/`development`、`module` 等）。
- 可以生成完整 import map，并可进一步注入到 HTML（配合 `es-module-shims`）。

典型场景：

- **无打包器/原生 ESM**：浏览器直接 `<script type="module">import 'react'</script>`，需要 import map。
- **导入映射“锁定”**：把 import map 当 lockfile，让解析稳定可复现。
- **CDN 运行**：把 npm 包解析到 `https://ga.jspm.io/...` / jsDelivr / unpkg 等。
- **本地运行**：把映射解析到本地 `./node_modules/...`（provider = `nodemodules`）。

---

## 原理：Bare Specifier 解析与 Import Map 生成

**核心思路**：浏览器原生 ESM 只认识 URL，不认识 `import 'react'` 这种「裸说明符」。Import Map 的作用就是把 bare specifier 映射到具体 URL；Generator 要做的就是：**解析包名与版本 → 解析 package.json 的 exports/conditions → 得到最终 URL → 写出 import map**。

- **解析流程**：输入 `react` 或 `react@18` → 查 registry（npm）得到包元数据与 `package.json` → 根据 `exports`、`imports` 和当前 env（browser/node、production/development、module 等）选出入口文件 → 再根据 provider（jspm/jsdelivr/unpkg/nodemodules）拼出最终 URL。
- **条件导出**：Node 与打包器都支持 `exports` 和 `imports` 的条件分支，Generator 复用同一套解析逻辑，保证浏览器端拿到的入口与 Node/打包器一致。
- **link 与锁文件**：`link` 从源码扫描 `import`/`require`，自动收集依赖再生成映射；`inputMap` 可传入已有 import map 作为「锁文件」，只补缺、不随意升级，保证可复现。

---

## 核心概念：Import Map

Import Map 本质上是一个 JSON：

- **imports**：顶层映射 `specifier -> url`
- **scopes**：针对特定 URL 前缀的“局部 imports”（用于依赖隔离、版本冲突分流）

`@jspm/generator` 的主要产出就是：

```json
{
  "imports": { "react": "https://ga.jspm.io/npm:react@18.2.0/index.js" },
  "scopes": { }
}
```

---

## 安装与运行前提

- `@jspm/generator` 是 **ESM-only** 包（用 `.mjs` 或 `"type":"module"`）。
- 你可以：
  - **本地 Node 运行**：`npm i @jspm/generator`
  - **用在线生成器**：`https://generator.jspm.io/`
  - **用托管 API**：`https://api.jspm.io/generate`（不推荐作为主方案，除非你的环境不能运行 JS）

---

## Generator 基本用法（install / getMap）

最常见用法：创建 `Generator`，然后 `install()`，最后 `getMap()`。

```js
import { Generator } from '@jspm/generator'

const generator = new Generator({
  // import map 的基准 URL：用于把相对路径规范化
  mapUrl: import.meta.url,
  // 默认解析提供方（CDN/provider）
  defaultProvider: 'jspm',
  // 目标环境：影响 conditional exports 分支选择
  env: ['production', 'browser', 'module'],
})

await generator.install('react-dom')
await generator.install('lit@2/decorators.js')
await generator.install({ target: 'react@16', alias: 'react16' })

console.log(JSON.stringify(generator.getMap(), null, 2))
```

> `install()` 支持字符串 target，也支持对象 `{ target, subpath, alias }` 等。

---

## 环境条件 env（browser / production / module 等）

`env` 是一个字符串数组，用来决定解析时采用哪些 condition：

- `browser` / `node` / `deno`：运行时环境
- `production` / `development`：生产/开发分支
- `module`：优先选择 ESM 入口（一般建议带上）

推荐默认值（浏览器生产）：

```js
env: ['browser', 'production', 'module']
```

推荐默认值（浏览器开发）：

```js
env: ['browser', 'development', 'module']
```

---

## Provider（jspm / jsdelivr / unpkg / nodemodules）

Generator 可以把依赖解析到不同来源：

- **jspm**：通常会生成到 `https://ga.jspm.io/...`
- **jsdelivr / unpkg / esm.sh**：其他公共 CDN（能力/兼容性有差异）
- **nodemodules**：解析到本地 `./node_modules/...`（适合本地开发/内网）

示例（本地 `node_modules`）：

```js
const generator = new Generator({
  mapUrl: import.meta.url,
  defaultProvider: 'nodemodules',
  env: ['production', 'module', 'browser'],
})

await generator.install('lit')
console.log(generator.getMap())
```

多 provider 项目可用 `providers` 做 scoped provider；也可以用 `customProviders` 定义自定义 provider hooks（适合自建 CDN/内网源）。

---

## link：从源码扫描依赖并生成映射

`link()` 适合“我有一个入口文件，想把里面 import 的依赖都收集出来并生成 map”：

```js
import { Generator } from '@jspm/generator'

const generator = new Generator({
  mapUrl: import.meta.url,
  env: ['production', 'module', 'browser'],
})

await generator.link('./mapping.js')
console.log(JSON.stringify(generator.getMap(), null, 2))
```

---

## inputMap：把 import map 当锁文件用

`inputMap` 可以把一个既有 import map 作为“初始解”，后续 install/update 会尽量复用既有解析结果，类似 lockfile：

```js
const generator = new Generator({
  env: ['production', 'module', 'browser'],
  inputMap: {
    imports: {
      react: 'https://ga.jspm.io/npm:react@17.0.1/index.js'
    }
  }
})

await generator.install('lit')
console.log(generator.getMap())
```

---

## htmlInject：自动注入 importmap / es-module-shims / preload / integrity

`htmlInject` 可以把 import map 与必要脚本注入到 HTML 字符串中，并支持：

- `esModuleShims: true`：注入 `es-module-shims`
- `preload: true`：生成 `modulepreload`
- `integrity: true`：带 SRI（integrity）
- `minifyWhitespace` / `jsonOnly`（以实际 API 文档为准）

示例：

```js
import { Generator } from '@jspm/generator'

const generator = new Generator({
  mapUrl: import.meta.url,
  env: ['production', 'browser', 'module'],
})

await generator.install('react')

const html = await generator.htmlInject('<!doctype html><script type=\"module\">import \"react\"</script>', {
  esModuleShims: true,
  preload: true,
  integrity: true,
})

console.log(html)
```

---

## 调试：logStream 与环境变量

调试解析过程可以使用 `generator.logStream`：

```js
const generator = new Generator()

;(async () => {
  for await (const { type, message } of generator.logStream()) {
    console.log(`${type}: ${message}`)
  }
})()
```

或设置环境变量 `JSPM_GENERATOR_LOG` 打开默认控制台日志（用于排查 resolve/install 细节）。

---

## 在线服务：api.jspm.io/generate（何时用）

`https://api.jspm.io/generate` 提供托管版 generator，返回：

```json
{ "staticDeps": [], "dynamicDeps": [], "map": { "imports": {}, "scopes": {} } }
```

它更适合：

- 你的运行环境 **无法运行 Node/JS**（例如某些后端平台/语言）。
- 快速验证与试验。

但官方也建议：**能本地跑 generator 就尽量本地跑**（可控性、稳定性、避免把关键构建链路依赖外部服务）。

---

## 常见坑与最佳实践

- **ESM-only**：示例脚本尽量用 `.mjs`，或在 `package.json` 设置 `"type": "module"`。
- **env 一定要想清楚**：少了 `module` 可能会选到非 ESM 入口；少了 `browser`/`node` 会影响 conditional exports 选择。
- **生产建议固定 inputMap**：把生成结果存档（作为 lockfile），避免每次生成导致 CDN URL 或依赖树变化。
- **本地开发用 nodemodules**：需要确保已 `npm i`，否则解析会失败。
- **遇到多版本冲突**：允许出现 `scopes`，不要强行 `flattenScope`，否则可能破坏依赖隔离。

---

## 参考链接

- [Generator 文档](https://jspm.org/docs/generator/)
- [Generator API（stable）](https://jspm.org/docs/generator/stable/)
- [在线生成器](https://generator.jspm.io/)
- [托管 generate API](https://jspm.org/cdn/api)
- [CDN Resolution 约定](https://jspm.org/docs/cdn-resolution)
- [npm: @jspm/generator](https://www.npmjs.com/package/@jspm/generator)

