# Nitro（nitropack）学习文档

> UnJS 的「下一代服务端工具包」；基于 h3、文件系统路由、零配置起服、一键多平台部署；可独立使用或作为 Nuxt 的服务端引擎

## 📚 目录

1. [用大白话说：Nitro 是啥](#用大白话说nitro-是啥)
2. [原理：为什么能「一处编写、到处部署」](#原理为什么能一处编写到处部署)
3. [与 h3、Nuxt 的关系](#与-h3nuxt-的关系)
4. [安装与快速开始](#安装与快速开始)
5. [目录结构与文件系统路由](#目录结构与文件系统路由)
6. [路由与中间件](#路由与中间件)
7. [nitro.config 与 preset](#nitroconfig-与-preset)
8. [routeRules 与部署](#routerules-与部署)
9. [常见场景与最佳实践](#常见场景与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：Nitro 是啥

### 你遇到的问题（做全栈/API 服务时）

- **想一套代码多端跑**：同一套 API 想部署到 Node、Vercel、Cloudflare Workers、Netlify 等，不想为每个平台写一套适配。
- **想要文件即路由**：像 Nuxt 的 `pages/` 一样，在 `server/api/` 或 `server/routes/` 里建文件就自动成路由，不用手写路由表。
- **想要小体积、快启动**：输出尽量小（&lt;1MB）、按需加载，适合 Serverless/Edge。
- **要 TypeScript、要热更新**：开发时改服务端代码即生效，生产用 TS 无额外配置。

也就是说：**在「写一套服务端逻辑、自动适配多运行时、文件即路由、小体积部署」这件事上，提供开箱可用的工具包**，就是 Nitro 要解决的问题。

### Nitro 帮你做啥

**Nitro**（npm 包名 **nitropack**，[UnJS](https://unjs.io/) 生态）是一个 **服务端构建与运行工具包**：

1. **基于 h3**：底层用 [h3](https://h3.unjs.io/) 处理 HTTP，你写的是 **defineEventHandler**，和 h3 一致。
2. **文件系统路由**：**server/api/** 下文件自动映射为 `/api/*`，**server/routes/** 下文件自动映射为对应路径；支持 `[param]`、`[...rest]`、`hello.get.ts` 等。
3. **零配置多端部署**：通过 **preset**（如 `node-server`、`vercel`、`cloudflare_pages`、`cloudflare_module`）构建出适配该平台的产物，无需为每个平台改代码。
4. **小体积、代码分割**：输出不含 node_modules，体积通常 &lt;1MB；异步按需加载，冷启动快。
5. **内置能力**：**Storage** 多驱动存储、**Cache** API、**中间件**（server/middleware/）、**routeRules**（重定向、代理、缓存、CORS 等）。
6. **可独立或配合 Nuxt**：可单独用 Nitro 做 API/服务；Nuxt 全栈应用的服务端引擎也是 Nitro。

一句话：**Nitro = 基于 h3 的「文件即路由 + 多 preset 构建 + 小体积输出」的服务端工具包**，适合 API、BFF、SSR 与 Nuxt 服务端。

---

## 原理：为什么能「一处编写、到处部署」

### 1. 抽象层：h3 + 适配器

- 业务逻辑用 **h3 的 defineEventHandler** 写，不直接依赖 Node 的 req/res 或某云厂商 API。
- Nitro 在**构建时**根据 **preset** 把 h3 应用转成目标平台的入口（Node handler、Vercel serverless、Cloudflare Worker 等），通过各平台的**适配器**把请求转成 h3 的 Event，再交给你的 handler。
- 所以「一处编写」的是 h3 逻辑，「到处部署」靠的是不同 preset 产出的不同入口 + 适配器。

### 2. 文件系统路由

- Nitro 在**构建时**扫描 **server/api/**、**server/routes/**，按文件名和目录结构生成路由表（基于 radix3），并注入到 h3 app；你不需要手写 `app.get('/api/hello', ...)`。
- 文件名约定：`index.ts` → 路径为目录名；`[id].ts` → 动态参数；`hello.get.ts` → 仅 GET；`[...].ts` → catch-all。

### 3. 打包与代码分割

- 构建时只打包用到的 handler、工具和依赖，输出到 **.output/**，结构按 preset 不同（如 Node 是单个入口 + 依赖，Vercel 是 serverless 函数）。运行时按需加载 chunk，减小冷启动时间。

可以简单记：**h3 抽象请求 → 文件即路由生成 handler → preset 决定构建产物与适配器 = 一处写、多处部署**。

---

## 与 h3、Nuxt 的关系

| 角色 | 作用 |
|------|------|
| **h3** | HTTP 框架：createApp、defineEventHandler、router、utils；Nitro 的「运行时」用的就是 h3。 |
| **Nitro** | 服务端工具包：基于 h3，提供文件系统路由、构建、preset、storage、cache、routeRules；可独立用，也可被 Nuxt 用。 |
| **Nuxt** | 全栈框架：前端 + 服务端；其服务端部分由 **Nitro** 驱动（server/api、server/routes、nitro 配置等）。 |

- **只做 API/BFF、要多端部署** → 单独用 **Nitro**（nitropack）。  
- **做全栈 Vue 应用** → 用 **Nuxt**，底层服务端仍是 Nitro。  
- **只想写 HTTP 逻辑、不关心构建** → 直接用 **h3**。

---

## 安装与快速开始

### 用模板新建项目（推荐）

```bash
pnpm dlx giget@latest nitro nitro-app --install
cd nitro-app
pnpm dev
```

- 会生成 **server/api/**、**server/routes/**、**nitro.config.ts** 等；`pnpm dev` 起开发服务（默认 http://localhost:3000），`pnpm build` 构建到 **.output**，`pnpm preview` 本地预览构建结果。

### 在已有项目里装 Nitro

```bash
pnpm add -D nitropack
```

- 需自己建 **server/api/** 或 **server/routes/**、**nitro.config.ts**，并在 **package.json** 里配置 **scripts**（如 `"dev": "nitro dev"`、`"build": "nitro build"`、`"preview": "nitro preview"`）。

---

## 目录结构与文件系统路由

### 常用目录

| 目录 | 说明 |
|------|------|
| **server/api/** | 自动加 `/api` 前缀的路由，如 `server/api/hello.ts` → `/api/hello` |
| **server/routes/** | 路径即文件路径，如 `server/routes/hello.ts` → `/hello` |
| **server/middleware/** | 全局中间件，按文件名顺序执行（可用数字前缀控制顺序） |
| **server/utils/** | 服务端工具，支持自动导入 |
| **server/plugins/** | Nitro 插件（生命周期钩子） |
| **nitro.config.ts** | Nitro 配置（preset、routeRules、plugins 等） |

### 路由规则示例

| 文件 | 路径 | 说明 |
|------|------|------|
| server/api/test.ts | GET/POST 等 /api/test | 默认所有方法 |
| server/routes/hello.get.ts | GET /hello | 仅 GET |
| server/routes/hello.post.ts | POST /hello | 仅 POST |
| server/routes/hello/[name].ts | /hello/:name | 动态参数，getRouterParam(event, 'name') |
| server/routes/hello/[...rest].ts | /hello/* | catch-all，rest 为剩余路径 |
| server/routes/[...].ts | * | 兜底路由 |

- 每个文件**只导出一个** defineEventHandler（或等价 handler）；如需多种方法，可拆成多个文件（如 `hello.get.ts`、`hello.post.ts`）。

---

## 路由与中间件

### 路由 handler 示例

```ts
// server/api/hello.ts
export default defineEventHandler(() => ({ message: "Hello from Nitro" }));
```

```ts
// server/routes/hello/[name].ts
import { getRouterParam } from "h3";
export default defineEventHandler((event) => {
  const name = getRouterParam(event, "name");
  return `Hello, ${name}!`;
});
```

- 使用 h3 的 **defineEventHandler**、**getRouterParam**、**readBody**、**getQuery** 等，与纯 h3 项目一致。

### 中间件

- 在 **server/middleware/** 下建文件，如 **auth.ts**；**不要 return 值**（return 会当作响应结束请求）。
- 中间件按**文件名排序**执行；可用 **01.logger.ts**、**02.auth.ts** 控制顺序。
- 在中间件里可给 **event.context** 挂数据，后续 handler 通过 **event.context** 读取。

---

## nitro.config 与 preset

### nitro.config.ts 示例

```ts
import { defineNitroConfig } from "nitropack";

export default defineNitroConfig({
  preset: "node-server", // 或 'vercel'、'cloudflare_pages'、'cloudflare_module' 等
  routeRules: {
    "/api/**": { cors: true },
    "/blog/**": { swr: 60 },
  },
});
```

- **preset**：决定构建产物和运行环境；常用有 **node-server**（Node）、**vercel**、**cloudflare_pages**、**cloudflare_module**、**netlify** 等，见 [Deploy](https://nitro.unjs.io/deploy)。
- **routeRules**：按路径配置缓存、重定向、代理、CORS、headers 等。

### 常见 preset

| preset | 说明 |
|--------|------|
| **node-server** | Node 服务器，输出 .output/server/index.mjs，可自托管 |
| **vercel** | Vercel Serverless / Edge |
| **cloudflare_pages** | Cloudflare Pages Functions |
| **cloudflare_module** | Cloudflare Workers（推荐） |
| **netlify** | Netlify Functions |
| **bun** | Bun 运行时 |

---

## routeRules 与部署

### routeRules 常用项

- **swr: true | number**：SWR 缓存，number 为 maxAge（秒）。
- **cache: { ... }**：细粒度缓存配置。
- **static: true**：当作静态资源处理。
- **headers: { ... }**：响应头。
- **cors: true**：开启 CORS。
- **redirect: string**：重定向。
- **proxy: string**：反向代理到某 URL。

### 部署流程（概览）

1. 在 **nitro.config.ts** 里设好 **preset**（或由部署平台自动检测）。
2. 本地执行 **pnpm build**（或 `nitro build`），产物在 **.output/**。
3. 按平台要求部署 **.output**：Node 一般运行 **.output/server/index.mjs**；Vercel/Netlify 等通常自动识别 Nitro 并执行其构建命令。

---

## 常见场景与最佳实践

### 1. 纯 API 项目

- 只用 **server/api/** 和 **server/routes/**，不配前端；preset 选 **node-server** 或目标云厂商。
- 用 **routeRules** 做 API 的 CORS、缓存。

### 2. 与 Nuxt 一起用

- Nuxt 项目里 **server/api/**、**server/routes/**、**nitro.config** 的配置会由 Nuxt 交给 Nitro 构建；无需单独装 nitropack（Nuxt 已依赖）。

### 3. 环境区分

- 路由文件可加后缀 **.dev.ts**、**.prod.ts** 等，只在对应环境构建时包含；也可在配置里用 **handlers** 等编程式注册。

### 4. 调试构建产物

- 开发时生成的临时入口在 **.nitro/dev/**，生产构建在 **.output/**；可看 **.output/** 结构理解当前 preset 的产出。

---

## 参考与延伸阅读

- [Nitro 官网](https://nitro.unjs.io/)
- [Getting Started](https://nitro.unjs.io/guide)
- [Routing](https://nitro.unjs.io/guide/routing)
- [Deploy](https://nitro.unjs.io/deploy)
- [Nitro GitHub](https://github.com/nitrojs/nitro)
- [h3](https://h3.unjs.io/)（底层 HTTP 框架）
- [Nuxt](https://nuxt.com/)（全栈框架，服务端用 Nitro）

---

**小结**：Nitro（nitropack）基于 h3，用 **server/api/**、**server/routes/** 做文件系统路由，用 **preset** 构建出多平台可部署的产物；通过 **nitro.config.ts** 的 **routeRules** 做缓存、CORS、重定向等；可独立做 API/BFF，也可作为 Nuxt 的服务端引擎。
