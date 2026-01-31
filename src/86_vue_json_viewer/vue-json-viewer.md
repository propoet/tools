# vue-json-viewer 学习文档

> Vue 2/3 的 JSON 树形展示组件，支持展开折叠、复制、主题与深度配置

## 📚 目录

1. [用大白话说：vue-json-viewer 是啥](#用大白话说vue-json-viewer-是啥)
2. [原理：树形展示与增量更新](#原理树形展示与增量更新)
3. [与 vue3-json-viewer、@textea/json-viewer 的关系](#与-vue3-json-viewervuetextea-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [组件与 props](#组件与-props)
6. [常用选项：expandDepth、theme、sort](#常用选项expanddepththemesort)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：vue-json-viewer 是啥

### 你遇到的问题（要展示 JSON 时）

- **可读性**：直接 `JSON.stringify(obj)` 一大坨，嵌套深了很难看。
- **需要树形**：希望像开发者工具那样，按 key 展开/折叠，可复制某一段。
- **Vue 项目**：希望一个现成组件，传 data 就能用，支持 Vue 2 或 Vue 3。

也就是说：**在「Vue 里以树形、可交互方式展示 JSON」这件事上，提供现成组件**，就是 vue-json-viewer 要解决的问题。

### vue-json-viewer 帮你做啥

**vue-json-viewer**（chenfengjw163 维护）是一个 **Vue 用 JSON 树形查看组件**：

1. **树形展示**：把对象/数组渲染成可展开、折叠的树，支持深层嵌套。
2. **交互**：点击展开/折叠、复制值、可选排序 key。
3. **主题**：内置 light/dark 等主题，可自定义样式。
4. **Vue 2 / Vue 3**：Vue 2 用 `vue-json-viewer@2`，Vue 3 用 `vue-json-viewer@3`。
5. **增量更新**：支持大对象增量更新，减少重渲染。

一句话：**vue-json-viewer = Vue 用的「JSON 树形查看器」**，只读展示、可复制、可主题。

---

## 原理：树形展示与增量更新

- **树形**：递归渲染对象/数组，每层为 key + 类型图标 + 值（或折叠块）；点击展开/折叠切换子节点显示。
- **复制**：在节点上提供复制按钮或交互，把该路径的值复制到剪贴板。
- **增量更新**：当 data 变化时，尽量只更新变化部分，适合大 JSON。

---

## 与 vue3-json-viewer、@textea/json-viewer 的关系

| 角色 | 作用 |
|------|------|
| **vue-json-viewer** | Vue 2/3 通用，树形展示、复制、主题；Vue 3 需装 @3。 |
| **vue3-json-viewer** | 专为 Vue 3 重写，TypeScript、暗色主题等；与 vue-json-viewer 不同包。 |
| **@textea/json-viewer** | 框架无关的 JSON 查看器，功能更丰富；Vue 需自己封装。 |

**简单记**：Vue 项目要现成组件用 vue-json-viewer（Vue 3 装 @3）；要更强交互可看 vue3-json-viewer 或 @textea/json-viewer。

---

## 安装与使用方式

### 安装

```bash
# Vue 3
pnpm add vue-json-viewer@3
# Vue 2
pnpm add vue-json-viewer@2
```

### 使用方式

- **全局注册**：`app.use(JsonViewer)`（Vue 3）或 `Vue.use(JsonViewer)`（Vue 2）。
- **局部使用**：`import JsonViewer from 'vue-json-viewer'`，在组件里 `<json-viewer :value="data" />`。

---

## 组件与 props

### 组件名

- **Vue 3**：`JsonViewer` 或 `json-viewer`（kebab）。
- **Vue 2**：同上。

### 基本用法

```vue
<template>
  <json-viewer :value="jsonData" :expand-depth="2" />
</template>

<script setup>
import JsonViewer from 'vue-json-viewer';
const jsonData = { a: 1, b: { c: 2 }, d: [3, 4] };
</script>
```

### 常用 props（以官方文档为准）

| prop | 说明 |
|------|------|
| **value** | 要展示的 JSON（对象或数组）。 |
| **expandDepth** | 默认展开层数，如 2 表示展开两层。 |
| **theme** | 主题名，如 `'light'`、`'dark'`。 |
| **sort** | 是否对 key 排序，默认 false。 |
| **copyable** | 是否显示复制按钮，默认 true。 |
| **boxed** | 是否给值加框样式。 |

---

## 常用选项：expandDepth、theme、sort

- **expandDepth**：数字，0 表示全部折叠，5 表示默认展开 5 层；大 JSON 可设小一点。
- **theme**：内置主题名或自定义 class；暗色用 `theme="dark"`。
- **sort**：为 true 时对象 key 按字母排序，便于对比。

---

## 常见场景与最佳实践

1. **接口调试/管理后台**：把接口返回的 JSON 用 `<json-viewer :value="response" />` 展示。
2. **默认展开**：用 `expand-depth` 控制首屏展开层数，避免一屏过长。
3. **大对象**：依赖库的增量更新；仍建议对超大 JSON 做分页或懒加载。
4. **Vue 3**：务必安装 `vue-json-viewer@3`，不要用 @2。

---

## 参考与延伸阅读

- [vue-json-viewer npm](https://www.npmjs.com/package/vue-json-viewer)
- [vue-json-viewer GitHub](https://github.com/chenfengjw163/vue-json-viewer)
- [vue3-json-viewer](https://www.npmjs.com/package/vue3-json-viewer)（Vue 3 专用替代）
