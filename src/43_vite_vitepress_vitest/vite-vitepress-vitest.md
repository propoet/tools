# Vite / VitePress / Vitest 综合学习文档

> 涵盖：vite、Vue 插件、VitePress、PWA、构建/开发插件、Vitest

## 📚 目录

1. [用大白话说：Vite / VitePress / Vitest 是啥](#用大白话说vite--vitepress--vitest-是啥)
2. [原理：ESM 开发与 Rollup 构建](#原理esm-开发与-rollup-构建)
3. [包的关系总览](#包的关系总览)
4. [核心：vite](#核心vite)
5. [Vue 生态：@vitejs/plugin-vue 与 plugin-vue-jsx](#vue-生态vitejsplugin-vue-与-plugin-vue-jsx)
6. [VitePress：vitepress、PWA、group-icons](#vitepressvitepresspwagroup-icons)
7. [构建与开发插件](#构建与开发插件)
8. [测试：vitest](#测试vitest)
9. [一份综合配置示例](#一份综合配置示例)
10. [常见坑与最佳实践](#常见坑与最佳实践)
11. [包速查表](#包速查表)
12. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：Vite / VitePress / Vitest 是啥

### 你遇到的问题（传统打包时）

- **开发慢**：Webpack 等「先打包再跑」，项目一大启动和 HMR 都慢。
- **文档站要单独一套**：又想用 Vue 写、又想 MD 驱动、又想 SEO 友好，自己搭很累。
- **测试和构建两套配置**：用 Jest 要一套配置，用 Vite 又要一套，环境不一致还容易踩坑。

也就是说：**开发体验 + 文档站 + 测试**，如果工具链不统一，维护成本会很高。

### Vite 帮你做啥

**Vite** 是新一代前端构建工具：

1. **开发阶段**：不打包，用浏览器原生 ES 模块 + 按需编译，冷启动快、HMR 快。
2. **生产构建**：用 Rollup 打包，产物可优化、可配。
3. **配置简单**：一个 `vite.config.ts`，插件化，和 Vue/React 等框架官方插件对接好。

一句话：**Vite = 开发服务器（ESM + 按需编译）+ 生产构建（Rollup）**，是「脚手架 + 打包」的统一入口。

### VitePress 是啥

**VitePress** 是基于 **Vite + Vue 3** 的静态站点/文档生成器：

- 用 **Markdown** 写内容，支持在 MD 里写 Vue 组件。
- 默认主题适合文档站（侧栏、导航、搜索等）。
- 构建出来是静态 HTML，部署简单、SEO 友好。

一句话：**VitePress = Vite + Vue + Markdown 驱动**，适合文档、博客、官网。

### Vitest 是啥

**Vitest** 是由 **Vite 驱动** 的单元测试框架：

- 和 Vite 共用一套配置（或单独 `vitest.config.ts`），环境一致。
- 速度快（ESM、按需编译）、API 和 Jest 类似（describe/it/expect），易迁移。
- 支持 Vue/React 组件测试、TS/JSX、覆盖率、Watch 模式。

一句话：**Vitest = 用 Vite 跑测试**，和开发/构建同一套生态，减少配置分裂。

### 如何选包（按项目类型）

- **Vue 应用（SPA）**：vite + @vitejs/plugin-vue；写 JSX/TSX 再加 @vitejs/plugin-vue-jsx。
- **文档站/博客**：vitepress；要离线/安装到桌面再加 @vite-pwa/vitepress。
- **发 npm 库（TS）**：vite + vite-plugin-dts + build.lib。
- **要压缩产物**：vite-plugin-compression；要多页/HTML 注入：vite-plugin-html。
- **开发体验**：vite-plugin-vue-devtools（Vue 项目）；按需加载组件库再考虑 vite-plugin-lazy-import。
- **单元测试**：vitest，和 Vite 共用配置。

---

## 原理：ESM 开发与 Rollup 构建

**核心思路**：开发阶段不打包，利用浏览器原生 ESM：入口 HTML 直接 `<script type="module" src="...">`，依赖按需由服务器编译后返回；生产阶段用 Rollup 打包成少量 chunk，保证加载与缓存友好。

- **开发服务器**：请求一个 ESM 模块时，Vite 根据 URL 找到源文件，对非 JS（如 .vue、.ts、.tsx）做即时编译转成 JS 再返回；遇到 import 再递归处理；这样只编译当前用到的文件，冷启动和 HMR 都快。
- **HMR**：修改文件后，Vite 通过 WebSocket 通知浏览器「某模块变了」，浏览器重新请求该模块并执行；Vue 等框架的 HMR 运行时负责「替换组件实例、保留状态」，无需整页刷新。
- **生产构建**：用 Rollup 做依赖预打包（deps 打成少量 chunk）、代码分割、tree-shaking、minify；Vite 的插件在 Rollup 的 hook 里挂载，和开发阶段共用部分逻辑（如解析 .vue），保证行为一致。
- **VitePress / Vitest**：VitePress 在 Vite 之上加「Markdown 转 Vue、路由、主题」等；Vitest 用 Vite 的解析与运行环境跑测试文件，和开发/构建同一套配置，减少分裂。

---

## 包的关系总览

| 类型 | 包 | 作用 |
|------|-----|------|
| **核心** | vite | 构建工具：开发服务器 + 生产打包 |
| **Vue** | @vitejs/plugin-vue | 让 Vite 能编译 .vue 单文件组件 |
| **Vue** | @vitejs/plugin-vue-jsx | 让 Vite 支持 Vue 的 JSX/TSX |
| **文档站** | vitepress | 基于 Vite+Vue 的文档/静态站生成器 |
| **PWA** | vite-plugin-pwa | 通用 PWA 插件（Service Worker、Manifest 等） |
| **PWA** | @vite-pwa/vitepress | 在 VitePress 里用 PWA 的封装（基于 vite-plugin-pwa） |
| **VitePress** | vitepress-plugin-group-icons | 图标分组/组织（如侧栏、导航图标） |
| **构建** | vite-plugin-compression | 构建时生成 gzip/brotli 压缩文件 |
| **构建** | vite-plugin-dts | 构建时生成 .d.ts 类型声明（库模式常用） |
| **构建** | vite-plugin-html | HTML 模板注入、EJS、多页、压缩 |
| **开发** | vite-plugin-lazy-import | 按需/懒加载导入（如组件库按需） |
| **开发** | vite-plugin-vue-devtools | 集成 Vue DevTools，方便调试 |
| **测试** | vitest | 由 Vite 驱动的单元测试框架 |

---

## 核心：vite

### 做什么

- **开发**：`vite` 或 `vite dev` 启动开发服务器，基于原生 ESM，按需编译，支持 HMR。
- **构建**：`vite build` 用 Rollup 打包，输出到 `dist`（可配）。
- **预览**：`vite preview` 预览构建后的静态资源。

### 安装与使用

```bash
pnpm create vite@latest my-app -- --template vue-ts
cd my-app
pnpm install
pnpm dev    # 开发
pnpm build  # 构建
pnpm preview # 预览构建结果
```

### 配置文件要点

- 根目录 **vite.config.ts**（或 .js/.mjs）。
- 常用：`plugins`、`resolve.alias`、`server`（端口、代理）、`build`（outDir、rollupOptions）。

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: { port: 5173, open: true },
  build: { outDir: 'dist', sourcemap: true },
});
```

### 系统要求

- Node.js 20+（Vite 5 要求 20.19+ 或 22.12+，以官方文档为准）。

---

## Vue 生态：@vitejs/plugin-vue 与 plugin-vue-jsx

### @vitejs/plugin-vue

- **作用**：让 Vite 能编译 **.vue** 单文件组件（template、script、style）。
- **安装**：创建 Vue 模板时通常已带；否则 `pnpm add -D @vitejs/plugin-vue`。
- **配置**：

```typescript
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
```

- **可选**：可传选项，如 `template.compilerOptions`、自定义块等，见官方文档。

### @vitejs/plugin-vue-jsx

- **作用**：让 Vite 支持 Vue 的 **JSX / TSX**（在 .jsx、.tsx 里写 Vue 组件）。
- **安装**：`pnpm add -D @vitejs/plugin-vue-jsx`。
- **配置**：和 plugin-vue 一起用时，两个都放进 `plugins`。

```typescript
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig({
  plugins: [vue(), vueJsx()],
});
```

- **何时用**：需要 JSX/TSX 写法时再装；纯 .vue 项目可不装。

---

## VitePress：vitepress、PWA、group-icons

### vitepress

- **作用**：基于 Vite + Vue 3 的静态站点/文档生成器；用 Markdown 写内容，支持 Vue 组件，默认主题适合文档站。
- **安装与初始化**：

```bash
pnpm add -D vitepress
pnpm exec vitepress init
```

- **目录习惯**：`docs/` 下放 `.md` 和 `docs/.vitepress/config.mts`（或 .ts）；侧栏、导航在 config 里配。
- **命令**：`pnpm docs:dev`（开发）、`pnpm docs:build`（构建）、`pnpm docs:preview`（预览），一般在 package.json 的 scripts 里配好。

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

- **配置要点**：`title`、`description`、`themeConfig.sidebar`、`themeConfig.nav` 等，见 [VitePress 文档](https://vitepress.dev/)。

### @vite-pwa/vitepress 与 vite-plugin-pwa

- **vite-plugin-pwa**：通用 Vite 插件，提供 PWA 能力（Workbox、Service Worker、Web App Manifest、离线等），不限于 VitePress。
- **@vite-pwa/vitepress**：在 **VitePress** 里用 PWA 的封装，内部基于 vite-plugin-pwa，并适配 VitePress 的 SSG/多页结构（如 withPwa 包装配置）。

**VitePress 里用 PWA**：装 `@vite-pwa/vitepress`，在 VitePress 配置里用 `withPwa` 包一层：

```bash
pnpm add -D @vite-pwa/vitepress
```

```typescript
// docs/.vitepress/config.mts
import { withPwa } from '@vite-pwa/vitepress';

export default withPwa({
  // 你的 VitePress 配置
  title: 'My Docs',
  themeConfig: { ... },
  // PWA 相关选项也可在这里传
});
```

- **普通 Vite 项目**：直接用 `vite-plugin-pwa`，在 `vite.config.ts` 的 `plugins` 里加即可。

### vitepress-plugin-group-icons

- **作用**：VitePress 的插件，用于**图标分组/组织**（如侧栏、导航中的图标分组展示），具体能力以 npm 包说明为准。
- **使用**：安装后在 VitePress 的 config 里加入 `vitepress-plugin-group-icons` 的插件配置，详见该包 README。

---

## 构建与开发插件

### vite-plugin-compression

- **作用**：构建时对产物做 **gzip / brotli** 等压缩，生成 .gz、.br 文件，部署时由服务器直接发压缩包，减小体积。
- **安装**：`pnpm add -D vite-plugin-compression`。
- **配置**：

```typescript
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compression({ algorithm: 'gzip', ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
});
```

- **注意**：有的项目用 `vite-plugin-compression2` 等新维护版本，用法类似，按需选包。

### vite-plugin-dts

- **作用**：在 **库模式**（build.lib）下，根据源码自动生成 **.d.ts** 类型声明，发布 npm 包时让 TS 用户有类型提示。
- **安装**：`pnpm add -D vite-plugin-dts`。
- **配置**：需配合 `build.lib` 使用：

```typescript
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyLib',
      formats: ['es'],
      fileName: 'my-lib',
    },
  },
  plugins: [dts()],
});
```

- **常见选项**：`tsconfigPath`（指定 tsconfig）、`rollupTypes: true`（合并成一个 .d.ts）等；若遇「找不到 vue」等，可指定 `tsconfigPath: './tsconfig.app.json'`。

### vite-plugin-html

- **作用**：**HTML 模板处理**：EJS 变量注入、多页应用（多 entry、多 html）、压缩等。
- **安装**：`pnpm add -D vite-plugin-html`。
- **配置**：在 index.html 里用 EJS 占位，在插件里注入数据：

```typescript
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      minify: true,
      inject: {
        data: { title: 'My App', injectScript: '<script>...</script>' },
      },
    }),
  ],
});
```

- **多页**：使用 `pages` 数组，每项指定 entry、filename、template、inject 等。

### vite-plugin-lazy-import

- **作用**：实现**按需/懒加载导入**（如把组件库或大模块改成按需加载），减少首包体积。
- **安装**：`pnpm add -D vite-plugin-lazy-import`。
- **配置**：按包文档配置要转换的库和规则；不同插件 API 不同，以官方 README 为准。  
- **注意**：Vite 本身支持动态 `import()` 懒加载；若只是路由级懒加载，不一定需要此插件。

### vite-plugin-vue-devtools

- **作用**：在开发环境集成 **Vue DevTools**，方便调试组件、状态等。
- **安装**：`pnpm add -D vite-plugin-vue-devtools`。
- **配置**：开发时启用即可，生产构建可自动不包含：

```typescript
import VueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  plugins: [VueDevTools()],
});
```

---

## 测试：vitest

### 做什么

- 和 Vite 共用配置（或单独 vitest.config.ts），同一套 ESM、别名、环境。
- 提供 `describe`、`it`/`test`、`expect`，和 Jest 类似；支持组件测试、覆盖率、Watch。

### 安装与使用

```bash
pnpm add -D vitest
```

- **脚本**：`"test": "vitest"`、`"test:run": "vitest run"`、`"test:coverage": "vitest run --coverage"`。
- **约定**：测试文件包含 `.test.` 或 `.spec.`（如 `sum.test.ts`），或在内置配置里自定义。

### 配置方式

- **方式一**：在 **vite.config.ts** 里加 `test` 段，Vitest 会读 Vite 的配置。
- **方式二**：单独 **vitest.config.ts**（或 .config.ts 在根目录），适合测试专用选项多的情况。

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,       // 全局 describe/it/expect
    environment: 'node', // 或 'jsdom' 测 DOM/Vue 组件
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

- **Vue 组件测试**：需配 `environment: 'jsdom'`（或 happy-dom），并安装 `@vue/test-utils`；Vitest 与 Vue Test Utils 搭配使用见官方文档。

### 简单示例

```typescript
// sum.test.ts
import { describe, it, expect } from 'vitest';
import { sum } from './sum';

describe('sum', () => {
  it('adds 1 + 2 to 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

---

## 一份综合配置示例

下面把「Vue + Vue JSX + HTML 注入 + 压缩 + Vue DevTools + Vitest」串在一起，仅作结构参考；实际项目按需删减。

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';
import compression from 'vite-plugin-compression';
import { createHtmlPlugin } from 'vite-plugin-html';
import VueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    createHtmlPlugin({ minify: true, inject: { data: { title: 'My App' } } }),
    compression({ algorithm: 'gzip', ext: '.gz' }),
    VueDevTools(),
  ],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  server: { port: 5173 },
  build: { outDir: 'dist' },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

- **库项目**：加上 `build.lib` 和 `vite-plugin-dts`。
- **VitePress**：在 `docs/.vitepress/config` 里配，PWA 用 `@vite-pwa/vitepress` 的 `withPwa`。

---

## 常见坑与最佳实践

1. **Node 版本**：Vite 5+ 要求 Node 20+，CI 和本地保持一致。
2. **插件顺序**：部分插件对顺序敏感（如 HTML 相关），按文档建议排列。
3. **vite-plugin-dts**：库模式才需要；若报错找不到模块，配好 `tsconfigPath` 或 tsconfig 的 include。
4. **VitePress 与 PWA**：在 VitePress 里用 **@vite-pwa/vitepress**，不要只在根 vite 里用 vite-plugin-pwa 而忽略 SSG 多页结构。
5. **Vitest**：和 Vite 共用 alias、env 等，避免测试里路径或环境不一致；组件测试记得 `environment: 'jsdom'`（或 happy-dom）。
6. **压缩插件**：服务器要支持对 .gz/.br 的协商（如 nginx 的 gzip_static），否则不会用到预压缩文件。

---

## 包速查表

| 包名 | 类型 | 一句话说明 |
|------|------|------------|
| **vite** | 核心 | 前端构建工具：开发服务器 + Rollup 生产构建 |
| **@vitejs/plugin-vue** | 插件 | 编译 .vue 单文件组件 |
| **@vitejs/plugin-vue-jsx** | 插件 | 支持 Vue 的 JSX/TSX |
| **vitepress** | 框架 | 基于 Vite+Vue 的文档/静态站生成器 |
| **vite-plugin-pwa** | 插件 | 通用 PWA（Service Worker、Manifest 等） |
| **@vite-pwa/vitepress** | 插件 | VitePress 专用 PWA 封装（withPwa） |
| **vitepress-plugin-group-icons** | 插件 | VitePress 图标分组/组织 |
| **vite-plugin-compression** | 插件 | 构建时 gzip/brotli 压缩 |
| **vite-plugin-dts** | 插件 | 库模式生成 .d.ts |
| **vite-plugin-html** | 插件 | HTML 模板、EJS 注入、多页、压缩 |
| **vite-plugin-lazy-import** | 插件 | 按需/懒加载导入 |
| **vite-plugin-vue-devtools** | 插件 | 集成 Vue DevTools |
| **vitest** | 测试 | 由 Vite 驱动的单元测试框架 |

---

## 参考与延伸阅读

- [Vite 官方文档](https://cn.vite.dev/)
- [VitePress 官方文档](https://vitepress.dev/)
- [Vitest 官方文档](https://vitest.dev/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [@vite-pwa/vitepress](https://github.com/vite-pwa/vitepress)

---

**文档版本**：针对 Vite 5、VitePress 2、Vitest 2 及常见插件整理；具体 API 以各包官方文档为准。
