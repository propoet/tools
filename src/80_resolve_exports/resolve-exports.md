# resolve.exports 学习文档

> 根据 package.json 的 `exports`、`imports` 字段解析入口路径，不依赖文件系统，与 Node 行为对齐

## 📚 目录

1. [用大白话说：resolve.exports 是啥](#用大白话说resolveexports-是啥)
2. [原理：exports 条件解析](#原理exports-条件解析)
3. [与 Node、打包器的关系](#与-node打包器的关系)
4. [安装与使用方式](#安装与使用方式)
5. [核心 API：resolveExports、resolveImports](#核心-apiresolveexportsresolveimports)
6. [条件：import、require、node、browser](#条件importrequirenodebrowser)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：resolve.exports 是啥

### 你遇到的问题（要解析包入口时）

- **package.json 的 exports**：`import "pkg"`、`import "pkg/sub"` 到底对应哪个文件，由 `exports` 字段声明；不同条件（import/require、node/browser）可能指向不同文件。
- **工具要一致**：打包器、构建工具、运行时都需按同一规则解析，否则同一包在不同环境下解析结果不一致。
- **不依赖文件系统**：希望只根据「package.json 内容」算出入口路径，不实际读盘，便于在浏览器或纯内存场景使用。

也就是说：**在「根据 exports/imports 和条件解析出入口路径」这件事上，提供与 Node 对齐、不依赖文件系统的实现**，就是 resolve.exports 要解决的问题。

### resolve.exports 帮你做啥

**resolve.exports**（lukeed 维护）是一个 **exports/imports 解析库**：

1. **resolveExports(pkg, subpath?, conditions?)**：根据包的 package.json 的 `exports` 字段和条件，解析出入口路径（相对包根）；不读文件系统。
2. **resolveImports(pkg, key?, conditions?)**：根据 `imports` 字段解析内部映射。
3. **条件**：支持 `import`、`require`、`node`、`browser`、`default` 及自定义条件，与 Node 行为对齐。
4. **轻量**：体积小，无文件系统依赖，适合打包器、工具链、浏览器端使用。

一句话：**resolve.exports = 读 package.json 的 exports/imports + 条件 → 返回解析后的路径**，与 Node 解析规则一致。

---

## 原理：exports 条件解析

- **exports 字段**：声明包对外的入口；`"."` 表示主入口，`"./sub"` 表示子路径；值可以是字符串或条件对象（如 `{ "import": "./esm.js", "require": "./cjs.js", "default": "./cjs.js" }`）。
- **条件匹配**：按「条件优先级」选第一个匹配的入口；常见顺序为 `import`/`require`、`node`/`browser`、`default`。
- **无文件系统**：只做「JSON + 条件 → 路径」的运算，不检查文件是否存在；实际读文件由调用方（如 Node、打包器）负责。

---

## 与 Node、打包器的关系

| 角色 | 作用 |
|------|------|
| **resolve.exports** | 根据 package.json 的 exports/imports 和条件，算出入口路径；不读盘。 |
| **Node** | 运行时解析 `import "pkg"` 时会读 package.json 的 exports，与 resolve.exports 规则一致；Node 会再根据路径读文件。 |
| **Vite / Webpack / Rollup** | 打包器解析包入口时，可用 resolve.exports 得到路径，再拼接包根路径读文件。 |

**简单记**：resolve.exports 是「exports 解析」的参考实现；Node 和打包器按同一规则解析，保证一致。

---

## 安装与使用方式

### 安装

```bash
pnpm add resolve.exports
# 或
npm i resolve.exports
```

### 使用方式

- **编程**：`import { resolveExports } from 'resolve.exports'`，传入 package.json 对象、子路径、条件，得到解析后的路径数组（或 null）。

---

## 核心 API：resolveExports、resolveImports

### resolveExports(pkg, subpath?, conditions?)

根据 `pkg.exports` 和条件解析入口。

- **pkg**：package.json 对象（至少含 `exports` 字段）。
- **subpath**：子路径，如 `'.'`（主入口）、`'./utils'`；不传默认 `'.'`。
- **conditions**：条件对象，如 `{ import: true, node: true }` 或数组 `['import', 'node']`。
- **返回**：解析到的路径数组（如 `['./dist/esm/index.mjs']`），或 null（无匹配）。

```javascript
import { resolveExports } from 'resolve.exports';

const pkg = {
  name: 'mylib',
  exports: {
    '.': {
      import: './dist/esm/index.mjs',
      require: './dist/cjs/index.cjs',
      default: './dist/cjs/index.cjs',
    },
    './utils': './dist/esm/utils.mjs',
  },
};

resolveExports(pkg);                    // [ './dist/esm/index.mjs' ]（默认 import）
resolveExports(pkg, '.');               // 同上
resolveExports(pkg, '.', { require: true }); // [ './dist/cjs/index.cjs' ]
resolveExports(pkg, './utils');         // [ './dist/esm/utils.mjs' ]
```

### resolveImports(pkg, key?, conditions?)

根据 `pkg.imports` 解析内部映射（如 `#utils`）；用法类似，以官方文档为准。

---

## 条件：import、require、node、browser

- **import**：ESM 的 `import` 请求时匹配。
- **require**：CJS 的 `require` 请求时匹配。
- **node**：Node 环境。
- **browser**：浏览器环境。
- **default**：兜底，通常放最后。

传入 `conditions` 时，库按优先级选第一个匹配的入口；不传则使用默认条件（通常含 `import`、`node`）。

---

## 常见场景与最佳实践

1. **打包器/工具链**：解析包入口时用 resolve.exports 得到路径，再拼接包根（如 node_modules/pkg）读文件。
2. **校验 exports**：发 npm 包前，用 resolve.exports 检查「各条件是否都能解析到合法路径」。
3. **浏览器/无 FS**：只有 package.json 数据时，用 resolve.exports 算路径，再配合 CDN 或预加载列表使用。
4. **与 Node 一致**：条件名与顺序尽量与 Node 文档一致，避免工具间行为不一致。

---

## 参考与延伸阅读

- [resolve.exports npm](https://www.npmjs.com/package/resolve.exports)
- [resolve.exports GitHub](https://github.com/lukeed/resolve.exports)
- [Node.js Package exports](https://nodejs.org/api/packages.html#package-entry-points)
