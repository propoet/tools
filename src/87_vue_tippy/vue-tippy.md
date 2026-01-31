# vue-tippy 学习文档

> Vue 3 的 tippy.js 封装：指令 v-tippy、组件 Tippy、Composition API useTippy，便于在 Vue 里做 tooltip/popover

## 📚 目录

1. [用大白话说：vue-tippy 是啥](#用大白话说vue-tippy-是啥)
2. [原理：与 tippy.js 的关系](#原理与-tippyjs-的关系)
3. [与 tippy.js、Vue 指令的关系](#与-tippyjsvue-指令的关系)
4. [安装与使用方式](#安装与使用方式)
5. [三种用法：指令、组件、useTippy](#三种用法指令组件usetippy)
6. [全局配置与默认选项](#全局配置与默认选项)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：vue-tippy 是啥

### 你遇到的问题（Vue 里要做 tooltip 时）

- **不想手写 tippy 实例**：tippy.js 要手动 `tippy(el, options)`，在 Vue 里要管生命周期、清理，麻烦。
- **希望声明式**：希望用 `v-tippy="'提示文字'"` 或 `<Tippy content="...">` 这种声明式写法。
- **Vue 3 生态**：希望有官方或成熟的 Vue 3 封装，支持 Composition API。

也就是说：**在「Vue 3 里用声明式方式使用 tippy.js」这件事上，提供指令、组件与 hook**，就是 vue-tippy 要解决的问题。

### vue-tippy 帮你做啥

**vue-tippy**（Kabbour 等维护）是一个 **Vue 3 的 tippy.js 封装**：

1. **指令**：`v-tippy` 或可配置的指令名（如 `v-tippy="'提示'"` 或 `v-tippy="{ content: '...' }"`），挂到任意元素即可。
2. **组件**：`<Tippy>` 或 `<tippy>`，用 slot 放触发器，用 content 或 slot 放内容。
3. **Composition API**：`useTippy()` 在 setup 里拿到 tippy 实例或创建逻辑，便于受控显示/隐藏。
4. **全局配置**：`app.use(VueTippy, { directive: 'tippy', component: 'Tippy', defaultOptions: { ... } })`，统一默认选项。
5. **底层 tippy.js**：依赖 tippy.js，需同时安装 tippy.js 并引入 CSS。

一句话：**vue-tippy = Vue 3 的 tippy.js 封装**，指令 + 组件 + useTippy，声明式使用。

---

## 原理：与 tippy.js 的关系

- **vue-tippy** 内部在元素挂载时调用 `tippy(el, options)`，在卸载时调用 `instance.destroy()`；选项与 tippy.js 一致。
- **指令**：在 `mounted` 时创建 tippy，在 `unmounted` 时销毁；选项可从绑定值或全局默认值合并。
- **组件**：用 Vue 的 ref 拿到触发器 DOM，再创建 tippy；内容可为 slot 或 content prop。

---

## 与 tippy.js、Vue 指令的关系

| 角色 | 作用 |
|------|------|
| **vue-tippy** | Vue 3 封装：指令、组件、useTippy；底层调 tippy.js。 |
| **tippy.js** | 核心库，必须安装；vue-tippy 负责生命周期与 Vue 集成。 |
| **Vue 指令** | v-tippy 是自定义指令，挂到元素上即创建 tippy。 |

**简单记**：Vue 3 项目用 vue-tippy 更方便；纯 HTML/JS 用 tippy.js 直接调。

---

## 安装与使用方式

### 安装

```bash
pnpm add vue-tippy@6 tippy.js
# 或
npm i vue-tippy@6 tippy.js
```

### 使用方式

- **全局注册**：`import VueTippy from 'vue-tippy'`、`import 'tippy.js/dist/tippy.css'`，再 `app.use(VueTippy, options)`。
- **局部使用**：只引入指令或组件，在需要的组件里用。

---

## 三种用法：指令、组件、useTippy

### 指令 v-tippy

```vue
<template>
  <button v-tippy="'悬停提示'">按钮</button>
  <button v-tippy="{ content: '点击', trigger: 'click' }">Popover</button>
</template>
```

- 绑定值可为字符串（即 content）或对象（tippy 选项）。
- 指令名可配置，如 `directive: 'tippy'` 则用 `v-tippy`。

### 组件 Tippy

```vue
<template>
  <Tippy content="提示文字">
    <button>悬停</button>
  </Tippy>
</template>

<script setup>
import { Tippy } from 'vue-tippy';
</script>
```

- 子节点（默认 slot）为触发器；内容可用 `content` prop 或具名 slot。
- 选项与 tippy.js 一致，如 `placement`、`trigger`、`interactive`。

### useTippy()

```vue
<script setup>
import { useTippy } from 'vue-tippy';

const { show, hide, setContent } = useTippy(targetRef, { content: '...' });
</script>
```

- 在 setup 里传入 ref 和选项，得到 show/hide 等控制方法；适合受控显示。

---

## 全局配置与默认选项

```javascript
import { createApp } from 'vue';
import VueTippy from 'vue-tippy';
import 'tippy.js/dist/tippy.css';

const app = createApp(App);
app.use(VueTippy, {
  directive: 'tippy',
  component: 'Tippy',
  defaultOptions: {
    placement: 'top',
    theme: 'light',
  },
});
```

- **directive**：指令名，默认 `'tippy'`。
- **component**：组件名，默认 `'Tippy'`。
- **defaultOptions**：所有 tippy 实例的默认选项，可被单次选项覆盖。

---

## 常见场景与最佳实践

1. **全局提示**：`app.use(VueTippy)` 后，任意元素 `v-tippy="'...'"` 即可。
2. **Popover**：`v-tippy="{ content: '...', trigger: 'click', interactive: true }"` 或 `<Tippy trigger="click" interactive>...</Tippy>`。
3. **主题**：全局 `defaultOptions: { theme: 'dark' }` 或单次 `theme: 'dark'`。
4. **Vue 3**：务必用 `vue-tippy@6`，与 tippy.js v6 对应。

---

## 参考与延伸阅读

- [vue-tippy 官网](https://vue-tippy.netlify.app/)
- [vue-tippy npm](https://www.npmjs.com/package/vue-tippy)
- [tippy.js](https://atomiks.github.io/tippyjs/)
