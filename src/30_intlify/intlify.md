# @intlify/core-base 与 @intlify/unplugin-vue-i18n 学习指南

## 📚 目录
1. [Intlify / Vue I18n 简介](#intlify--vue-i18n-简介)
2. [原理：消息解析与运行时编译](#原理消息解析与运行时编译)
3. [@intlify/core-base 概览](#intlifycore-base-概览)
3. [createI18n 与 I18n 实例](#createi18n-与-i18n-实例)
4. [类型定义（DefineLocaleMessage 等）](#类型定义definelocalemessage-等)
5. [Core 层 API（消息解析、fallback）](#core-层-apimessage-解析fallback)
6. [@intlify/unplugin-vue-i18n 概览](#intlifyunplugin-vue-i18n-概览)
7. [安装与 Vite/Webpack 配置](#安装与-vitewebpack-配置)
8. [SFC 的 i18n 自定义块](#sfc-的-i18n-自定义块)
9. [优化：运行时仅、预编译、JIT](#优化运行时仅预编译jit)
10. [SSR 与功能开关](#ssr-与功能开关)
11. [参考链接](#参考链接)

---

## Intlify / Vue I18n 简介

**Intlify** 是 Vue I18n 及相关国际化工具的维护团队与生态命名；**Vue I18n** 是 Vue 3 官方推荐的国际化（i18n）方案。

- **vue-i18n**：应用层包，提供 `createI18n`、`useI18n`、`$t`、`<i18n-t>` 等，依赖底层 core。
- **@intlify/core-base**：底层核心，提供「与框架无关」的 i18n 能力（消息解析、复数、fallback 等），被 vue-i18n 使用；也可在非 Vue 环境（如 Node、Web Worker）中直接使用。
- **@intlify/unplugin-vue-i18n**：构建时插件，用于预编译语言包、解析 Vue SFC 中的 `<i18n>` 块、优化打包体积。

本页重点：**@intlify/core-base** 的职责与常用 API，以及 **@intlify/unplugin-vue-i18n** 的配置与用法。

---

## 原理：消息解析与运行时编译

**核心思路**：i18n 要解决两件事——**按 locale 和 key 取到文案**，以及**把带占位符、复数、插值等语法的消息编译成最终字符串**。Core 层与框架解耦，只负责「消息解析 + 编译」，Vue 层负责响应式、组件和依赖收集。

- **消息解析**：消息通常是嵌套对象（如 `{ common: { ok: '确定' } }`），根据 path（如 `common.ok`）和当前 locale 解析出原始字符串；若当前语言缺失则按 fallback 链（如 zh-CN → zh → en）回退。
- **消息编译**：消息可能是 `'Hello, {name}!'`、复数 `'no apples | one apple | {count} apples'` 等，core 提供编译器把这类模板转成可执行函数（MessageFunction），运行时传入变量得到最终文案。
- **unplugin 的作用**：构建时预编译语言包、解析 SFC 的 `<i18n>` 块并注入，可把「运行时编译」转为「预编译」，减少运行时开销和包体积。

---

## @intlify/core-base 概览

**@intlify/core-base** 提供：

| 能力 | 说明 |
|------|------|
| **createI18n** | 创建 I18n 实例的工厂（Vue I18n 对外暴露的也是它） |
| **类型定义** | `DefineLocaleMessage`、`DefineDateTimeFormat`、`DefineNumberFormat`、`DefineCoreLocaleMessage` 等，用于 TS 下对消息/格式做严格类型约束 |
| **消息解析** | `resolveValue`、`resolveWithKeyValue`、`MessageResolver`，用于从嵌套对象里按 path 取文案 |
| **Fallback** | `fallbackWithLocaleChain`、`fallbackWithSimple`、`LocaleFallbacker`，决定「当前语言没有 key 时」回退到哪些 locale |
| **消息编译/运行时** | `MessageCompiler`、`MessageFunction`、`MessageContext`（复数、list、named、linked 等），供编译器与运行时使用 |

日常写 Vue 应用时，一般直接用 **vue-i18n** 即可；**@intlify/core-base** 多在以下场景被关心：

- 为 Vue I18n 写**类型扩展**（如 `DefineLocaleMessage`）
- 做**自定义 message resolver** 或 **locale fallbacker**
- 在 **Node / Worker / 非 Vue 环境** 里复用同一套 i18n 逻辑

---

## createI18n 与 I18n 实例

### createI18n(options)

Vue I18n 的入口，返回一个 **I18n** 实例，用于 `app.use(i18n)`。

**Legacy API 模式**（默认 `legacy: true`）：

```javascript
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'ja',
  messages: {
    en: { greeting: 'Hello' },
    ja: { greeting: 'こんにちは' },
  },
})

const app = createApp(App)
app.use(i18n)
app.mount('#app')
```

**Composition API 模式**（`legacy: false`）：

```javascript
const i18n = createI18n({
  legacy: false,
  locale: 'ja',
  messages: {
    en: { greeting: 'Hello' },
    ja: { greeting: 'こんにちは' },
  },
})

// 组件内
const { t, locale } = useI18n()
```

### I18n 实例

- **i18n.global**：全局 Composer（composition 模式）或 VueI18n（legacy 模式），所有组件共享。
- **i18n.install(app)**：插件安装入口，由 `app.use(i18n)` 调用。
- **i18n.dispose()**：释放全局资源。

### I18nOptions 常用项

继承自 **I18nAdditionalOptions** 与 ComposerOptions / VueI18nOptions：

| 选项 | 说明 |
|------|------|
| **locale** | 当前语言 |
| **fallbackLocale** | 回退语言（字符串、数组或 `{ [locale]: Locale[] }`） |
| **messages** | 各 locale 的消息对象 |
| **datetimeFormats** / **numberFormats** | 日期、数字格式 |
| **legacy** | 是否使用 Legacy API，默认 `true` |
| **globalInjection** | 是否向组件注入 `$t`、`$i18n` 等，默认 `true` |

---

## 类型定义（DefineLocaleMessage 等）

在 TypeScript 中希望 `$t('menu.login')`、`t('menu.login')` 有类型提示和校验时，可扩展 Vue I18n 的全局类型。

### DefineLocaleMessage（vue-i18n）

在项目内声明（如 `types/i18n.d.ts`）：

```typescript
import { DefineLocaleMessage } from 'vue-i18n'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    title: string
    menu: {
      login: string
      logout: string
    }
  }
}
```

### DefineCoreLocaleMessage（@intlify/core-base）

若直接使用 **@intlify/core-base** 的底层 API，可扩展：

```typescript
import { DefineCoreLocaleMessage } from '@intlify/core-base'

declare module '@intlify/core-base' {
  export interface DefineCoreLocaleMessage {
    title: string
    menu: { login: string }
  }
}
```

### DefineDateTimeFormat / DefineNumberFormat

同理可定义日期、数字格式的 key：

```typescript
import { DefineDateTimeFormat, DefineNumberFormat } from 'vue-i18n'

declare module 'vue-i18n' {
  export interface DefineDateTimeFormat {
    short: { hour: 'numeric'; minute: 'numeric'; timeZoneName?: string }
  }
  export interface DefineNumberFormat {
    currency: { style: 'currency'; currencyDisplay: 'symbol'; currency: string }
  }
}
```

---

## Core 层 API（Message 解析、Fallback）

这些 API 主要在 **@intlify/core-base** 中，vue-i18n 内部会用到；自定义 resolver 或 fallback 时也会接触。

### resolveValue(obj, path)

按 **path**（如 `'menu.login'`）从嵌套对象中解析出值，支持点分路径。

```javascript
import { resolveValue } from '@intlify/core-base'

const messages = { menu: { login: '登录' } }
resolveValue(messages, 'menu.login') // '登录'
```

### resolveWithKeyValue(obj, path)

按 **扁平 key-value** 解析，不支持嵌套对象，适合「key 即 path」的简单结构。

### Fallback

- **fallbackWithLocaleChain(ctx, fallback, start)**：按「语言链」回退（如 zh-CN → zh → en），Vue I18n 默认使用。
- **fallbackWithSimple(ctx, fallback, start)**：简单回退，直接使用配置的 fallback locale。
- **registerLocaleFallbacker(fn)**：注册自定义 fallback 函数。

### MessageContext（消息函数内）

在「消息为函数」或编译后的 message function 中，可通过 **MessageContext** 使用：

- **named(key)**：命名插值，如 `named('name')`
- **list(index)**：列表插值，如 `list(0)`
- **plural(messages)**：复数选择
- **linked(key, modifier?)**：链接到其它消息

---

## @intlify/unplugin-vue-i18n 概览

**@intlify/unplugin-vue-i18n** 是基于 [unplugin](https://github.com/unjs/unplugin) 的构建插件，支持 Vite、Webpack、Rollup、esbuild 等。

| 功能 | 说明 |
|------|------|
| **i18n 资源预编译** | 将 JSON/YAML/JSON5 等语言包预编译为 Message 函数或 AST，减少运行时编译 |
| **SFC i18n 块** | 解析 Vue 单文件组件中的 `<i18n>` 自定义块，支持多语言、多格式 |
| **静态导入** | 按需打包语言文件，有利于 tree-shaking 与体积优化 |
| **SSR** | 通过 `ssr: true` 支持服务端渲染 |

注意：旧的 **@intlify/vite-plugin-vue-i18n** 已弃用，推荐统一使用 **@intlify/unplugin-vue-i18n**。

---

## 安装与 Vite/Webpack 配置

### 安装

```bash
pnpm add -D @intlify/unplugin-vue-i18n
# 或
npm i -D @intlify/unplugin-vue-i18n
```

### Vite

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [
    Vue(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
    }),
  ],
})
```

**include**：指定「需要被预编译」的语言资源路径（如 JSON、YAML），支持 glob。

### Webpack

```javascript
// webpack.config.js
const path = require('path')
const VueI18nPlugin = require('@intlify/unplugin-vue-i18n/webpack')

module.exports = {
  plugins: [
    VueI18nPlugin({
      include: path.resolve(__dirname, './src/locales/**'),
    }),
  ],
}
```

---

## SFC 的 i18n 自定义块

在 `.vue` 文件中可使用 **`<i18n>`** 自定义块，将当前组件的文案写在单文件内。

### 基础用法

```vue
<template>
  <p>{{ $t('hello') }}</p>
</template>

<script>
export default { name: 'App' }
</script>

<i18n>
{
  "en": { "hello": "hello world!" },
  "ja": { "hello": "こんにちは、世界！" }
}
</i18n>
```

- 默认格式为 **JSON**；也可用 `lang="yaml"`、`lang="json5"` 等（需插件支持）。
- 使用 **Composition API** 时，需在 `setup` 里通过 **useI18n** 返回的 `t` 等，才能引用到该 SFC 的 i18n 块中的 key。

### 本地作用域

i18n 块中的 key 属于**组件本地作用域**：模板里 `$t('hello')` 会先查本组件的 i18n 块，再查全局 messages。

---

## 优化：运行时仅、预编译、JIT

### 两套 ESM 构建

Vue I18n 为打包器提供：

| 入口 | 说明 |
|------|------|
| **vue-i18n.esm-bundler.js** | 含 message compiler + runtime，可运行时编译文案 |
| **vue-i18n.runtime.esm-bundler.js** | 仅 runtime，**所有文案必须预编译**，体积更小 |

使用 **@intlify/unplugin-vue-i18n** 做生产构建时，通常会预编译语言包，并让打包器使用 **runtime only** 版本，从而去掉编译器，减小体积。

### 预编译与 JIT（v9.3+）

- **v9.3 之前**：插件把 locale messages 编译成 **Message 函数**，不打包 compiler，可明显减体积。
- **v9.3 及以后**：默认会编译成 **AST**，且 **message compiler 仍会打进包**（以便 JIT）；若开启 **JIT 编译**，可在运行时再编译消息（适合 CSP、或从后端拉取文案的场景）。
- **v10 起**：JIT 默认开启，无需再单独设 `__INTLIFY_JIT_COMPILATION__`。

### 功能开关（Tree-shaking）

在打包配置里可通过 **define** 控制：

- **__VUE_I18N_FULL_INSTALL__**：是否完整安装（含组件、指令等），设为 `false` 可减小体积。
- **__VUE_I18N_LEGACY_API__**：是否支持 Legacy API，设为 `false` 可仅保留 Composition API。
- **__INTLIFY_JIT_COMPILATION__**（v9.3）：是否启用 JIT 编译。
- **__INTLIFY_DROP_MESSAGE_COMPILER__**（JIT 开启时）：是否在打包时去掉 message compiler。

Vite 示例：

```javascript
define: {
  __VUE_I18N_FULL_INSTALL__: false,
  __VUE_I18N_LEGACY_API__: false,
}
```

---

## SSR 与功能开关

### SSR

使用 Nuxt / 自定义 SSR 时，在插件里开启 **ssr**：

```javascript
VueI18nPlugin({
  include: resolve(__dirname, './src/locales/**'),
  ssr: true,
})
```

### 小结

| 需求 | 做法 |
|------|------|
| 应用内多语言 | vue-i18n + createI18n，Legacy 或 Composition 二选一 |
| 类型安全 | 扩展 DefineLocaleMessage / DefineDateTimeFormat / DefineNumberFormat |
| 预编译语言包 + 减体积 | @intlify/unplugin-vue-i18n，include 指定 locales 目录，生产用 runtime only |
| SFC 内文案 | `<i18n>` 块 + 同上插件 |
| CSP / 后端动态文案 | 启用 JIT（v9.3+，v10 默认） |
| SSR | unplugin-vue-i18n 设 `ssr: true` |
| 底层解析/fallback | @intlify/core-base 的 resolveValue、fallbackWithLocaleChain 等 |

---

## 参考链接

- [Vue I18n 官方文档](https://vue-i18n.intlify.dev/)
- [Vue I18n API（General）](https://vue-i18n.intlify.dev/api/general.html)
- [Optimization（优化、unplugin、JIT）](https://vue-i18n.intlify.dev/guide/advanced/optimization.html)
- [Single File Components（SFC i18n 块）](https://vue-i18n.intlify.dev/guide/advanced/sfc.html)
- [@intlify/unplugin-vue-i18n（GitHub）](https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n)
- [@intlify/core-base（npm）](https://www.npmjs.com/package/@intlify/core-base)

### 本目录

- **intlify.md** — 本文档：@intlify/core-base 与 @intlify/unplugin-vue-i18n 的学习与用法概要。
