# lucide-vue-next 学习文档

> 面向 Vue 3 的 Lucide 图标组件库；每个图标是独立 Vue 组件、内联 SVG、Tree-shakable，支持 Composition API 与 script setup

## 📚 目录

1. [用大白话说：lucide-vue-next 是啥](#用大白话说lucide-vue-next-是啥)
2. [原理：为什么 Tree-shakable、内联 SVG](#原理为什么-tree-shakable内联-svg)
3. [与 Iconify、@iconify/vue 的对比](#与-iconifyiconifyvue-的对比)
4. [安装与使用方式](#安装与使用方式)
5. [按图标按需导入](#按图标按需导入)
6. [Props 与 SVG 属性](#props-与-svg-属性)
7. [Icon 组件与 Lucide Lab](#icon-组件与-lucide-lab)
8. [通用图标组件（慎用）](#通用图标组件慎用)
9. [无障碍与最佳实践](#无障碍与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：lucide-vue-next 是啥

### 你遇到的问题（Vue 3 里用图标时）

- **需要统一、好看的图标**：不想自己画 SVG，希望有一套风格一致、数量够用的图标。
- **要 Tree-shake**：整包引入图标库会很大，只想打包用到的图标。
- **要能改大小、颜色**：通过 props 或 CSS 控制尺寸、颜色、描边等。
- **要 Vue 3 友好**：组件式、响应式、Composition API、TypeScript 支持。

也就是说：**在「Vue 3 里用一套统一、可 Tree-shake、可配置的图标组件」这件事上，提供现成方案**，就是 lucide-vue-next 要解决的问题。

### lucide-vue-next 帮你做啥

**lucide-vue-next** 是 **Lucide Icons** 的 **Vue 3 版本**：

1. **按图标导入**：从 `lucide-vue-next` 按需 import 单个图标（如 `Camera`、`Check`），每个图标是一个 **Vue 组件**，渲染为 **内联 SVG**；未用到的图标会被 Tree-shake 掉。
2. **统一风格**：Lucide 是 Feather Icons 的继任，线条风格一致，数量多（千级），命名清晰（PascalCase）。
3. **Props 与 SVG**：支持 **size**、**color**、**stroke-width** 等通用 props，也可传任意 **SVG 属性**（fill、class、aria-* 等）。
4. **Icon 组件**：可用 **Icon** 组件 + **iconNode**（如 Lucide Lab 或自定义）渲染单图标。
5. **无障碍**：默认 `aria-hidden="true"`，可传 **aria-label** 等给读屏。

一句话：**lucide-vue-next = Vue 3 下按需使用的 Lucide 图标组件**，适合中后台、管理端、需要统一图标体系的 Vue 3 项目。

---

## 原理：为什么 Tree-shakable、内联 SVG

### 1. ES Module + 按图标导出

- 库用 **ES Module** 导出，每个图标是独立模块；打包器（Vite、Webpack、Rollup）会做 **Tree-shaking**，只把你在代码里 **import** 到的图标打进 bundle，未引用的不会包含。
- 若用「通用组件 + 字符串名」并 **import * as icons**，会引入全部图标，体积暴增，**不推荐**。

### 2. 内联 SVG

- 每个图标组件渲染的是 **inline SVG**，不是字体或图片；可被 CSS 控制（color、stroke、fill），也可传 SVG 属性，无障碍和可访问性更好。
- 不依赖额外字体或网络请求，首屏即可用。

可以简单记：**按图标 import → 只打包用到的 → 渲染为内联 SVG = 小体积 + 可样式**。

---

## 与 Iconify、@iconify/vue 的对比

| 对比项       | lucide-vue-next        | @iconify/vue（Iconify） |
|--------------|------------------------|--------------------------|
| **图标来源** | 仅 Lucide 一套         | 200+ 图标集、27 万+ 图标 |
| **用法**     | 按图标 import 组件    | 按图标 ID（如 `mdi:home`）或按需加载 |
| **Tree-shake** | 按 import 自然 Tree-shake | 按请求/按集合加载，不打包未用 |
| **风格**     | 统一线条风格           | 多风格、多集合           |
| **体积**     | 只含 Lucide 用到的     | 依赖 API 或预置集合      |
| **典型用途** | Vue 3 项目、要 Lucide 风格 | 多图标集、需海量图标、统一 API |

**简单记**：**只要 Lucide、Vue 3、要简单 Tree-shake** → **lucide-vue-next**；**要多图标集、统一一套 API** → **Iconify**。

---

## 安装与使用方式

### 安装

```bash
pnpm add lucide-vue-next
# 或
npm i lucide-vue-next
```

### 使用方式概览

- **按需导入**：`import { Camera, Check } from 'lucide-vue-next'`，在模板里 `<Camera />`、`<Check />`。
- **传 props**：`<Camera :size="32" color="red" />`。
- **Icon + iconNode**：用于 Lucide Lab 或自定义 icon 数据。

---

## 按图标按需导入

### 基本用法（script setup）

```vue
<script setup>
import { Camera, Check, ChevronDown } from "lucide-vue-next";
</script>

<template>
  <Camera />
  <Check color="green" :size="24" />
  <ChevronDown stroke-width="2" />
</template>
```

- 图标名是 **PascalCase**，与 [Lucide 官网](https://lucide.dev/icons/) 一致。
- 只 import 用到的图标，打包时未引用的会被 Tree-shake 掉。

### 在 JS/TS 里动态用

- 若要根据变量渲染不同图标，可用 **动态组件**：`<component :is="iconComponent" />`，其中 `iconComponent` 是已 import 的组件引用；不要用「字符串名 + import *」全量引入。

---

## Props 与 SVG 属性

### 常用 Props

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| **size** | number | 24 | 图标宽高（px） |
| **color** | string | currentColor | 颜色，默认继承文字色 |
| **stroke-width** | number | 2 | 描边宽度 |
| **absoluteStrokeWidth** | boolean | false | 为 true 时描边不随 size 缩放 |
| **default-class** | string | lucide-icon | 默认 class 名 |

### 任意 SVG 属性

- 组件接受 **所有 SVG 属性** 作为 props，如 **fill**、**class**、**aria-label**、**aria-hidden** 等，便于样式与无障碍。

```vue
<Camera fill="red" class="my-icon" aria-label="拍照" />
```

---

## Icon 组件与 Lucide Lab

### Icon + iconNode（Lucide Lab / 自定义）

- [Lucide Lab](https://github.com/lucide-icons/lucide-lab) 是未进入主库的图标集合，可通过 **Icon** 组件 + **iconNode** 使用。

```vue
<script setup>
import { Icon } from "lucide-vue-next";
import { baseball } from "@lucide/lab";
</script>

<template>
  <Icon :icon-node="baseball" />
</template>
```

- **Icon** 的 props（size、color、stroke-width 等）与普通图标组件一致。

---

## 通用图标组件（慎用）

- 可以做一个「传名字渲染对应图标」的通用组件，但需要 **import * as icons from 'lucide-vue-next'**，会**引入全部图标**，打包体积很大，**不推荐**。
- 若必须按「字符串名」用图标，建议只 import 项目用到的有限个图标，放进一个 map，再 `<component :is="iconMap[name]" />`。

---

## 无障碍与最佳实践

### 默认行为

- 图标默认带 **aria-hidden="true"**，不暴露给读屏，适合装饰性图标。

### 语义化图标

- 若图标代表操作或状态（如「完成」「删除」），应传 **aria-label** 或配合可见文案。

```vue
<Check aria-label="任务已完成" />
```

### 最佳实践

1. **按需 import**，不要 `import *`。
2. 需要时传 **size**、**color**、**stroke-width**，或用 **class** 统一样式。
3. 有语义的图标加 **aria-label**；纯装饰保留默认 aria-hidden。
4. 查图标名到 [Lucide Icons](https://lucide.dev/icons/) 搜索。

---

## 参考与延伸阅读

- [Lucide 官网](https://lucide.dev/)
- [lucide-vue-next 使用说明](https://lucide.dev/guide/packages/lucide-vue-next)
- [Lucide Icons 列表](https://lucide.dev/icons/)
- [Lucide Lab](https://github.com/lucide-icons/lucide-lab)
- [无障碍指南](https://lucide.dev/guide/advanced/accessibility)

---

**小结**：lucide-vue-next 在 Vue 3 中按图标 import 使用 Lucide，每个图标是独立组件、内联 SVG、Tree-shakable；通过 size、color、stroke-width 等 props 或 SVG 属性定制；语义图标加 aria-label，慎用「通用组件 + 全量 import」。
