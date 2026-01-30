# VueUse 综合学习文档

> 涵盖：@vueuse/core、@vueuse/integrations、@vueuse/motion

## 📚 目录

1. [用大白话说：VueUse 是啥](#用大白话说vueuse-是啥)
2. [原理：Composables 与响应式封装](#原理composables-与响应式封装)
3. [三个包的关系](#三个包的关系)
4. [@vueuse/core：组合式工具库](#vueusecore组合式工具库)
5. [@vueuse/integrations：第三方库集成](#vueuseintegrations第三方库集成)
6. [@vueuse/motion：动画](#vueusemotion动画)
7. [综合示例与选包建议](#综合示例与选包建议)
8. [常见坑与最佳实践](#常见坑与最佳实践)
9. [包速查表与参考](#包速查表与参考)

---

## 用大白话说：VueUse 是啥

### 你遇到的问题（手写组合式逻辑时）

- **重复造轮子**：本地存储、窗口尺寸、剪贴板、全屏、拖拽、防抖节流……每个项目都要自己写一遍。
- **浏览器 API 难用**：要管监听、清理、SSR 兼容，写起来啰嗦还容易漏。
- **第三方库和 Vue 脱节**：Axios、Fuse.js、Sortable 等要自己包成 ref、onUnmounted，代码散。

也就是说：**常用能力 + 浏览器 API + 第三方库**，如果都手写，维护成本高、一致性差。

### VueUse 帮你做啥

**VueUse** 是 Vue 3 的 **组合式 API 工具集合**（Composables），把「状态、DOM、浏览器、网络、动画」等封装成可直接在 `setup` 里用的函数，特点：

1. **开箱即用**：`useLocalStorage`、`useMouse`、`useClipboard` 等，按需引入即可。
2. **响应式 + 自动清理**：返回 ref/computed，组件卸载时自动移除监听、取消请求等。
3. **TypeScript**：完整类型，IDE 友好。
4. **按需引入**：从 `@vueuse/core` 或子路径引入，利于 tree-shaking。

一句话：**VueUse = 一堆可复用的 Vue 3 Composables**，少写样板代码、少踩浏览器和生命周期坑。

---

## 原理：Composables 与响应式封装

**核心思路**：把「状态 + 副作用 + 清理」封装成函数（Composable），在 setup 里调用即可得到 ref/computed 和自动清理的监听；VueUse 的每个函数都是这类封装：内部用 ref/reactive、onMounted/onUnmounted、watch 等，对外只暴露「当前值」和「可选方法」。

- **响应式与生命周期**：例如 useLocalStorage 内部用 ref 存值，读时从 localStorage 取、写时同步写入，并监听 storage 事件做跨标签同步；onUnmounted 时不再监听，避免泄漏。
- **浏览器 API 封装**：如 useMouse 在 mount 时注册 mousemove、在 unmount 时移除；useClipboard 封装 navigator.clipboard 的读写并暴露 ref + copy()；这样调用方不用手写 addEventListener/removeEventListener。
- **integrations**：把 axios、Fuse.js 等「非 Vue」的 API 包一层：用 ref 存结果、在 composable 里调第三方 API、用 watch 或显式调用驱动请求，这样在 Vue 里用起来和普通 ref 一致，且自动跟随组件生命周期。

---

## 三个包的关系

| 包 | 作用 |
|----|------|
| **@vueuse/core** | 核心：不依赖第三方库的「纯」组合式函数（状态、DOM、浏览器、时间、异步、交互等）。 |
| **@vueuse/integrations** | 集成：把 **第三方库**（axios、Fuse.js、Sortable、qrcode、nprogress 等）包成 Composables，和 Vue 响应式、生命周期对接。 |
| **@vueuse/motion** | 动画：基于 Popmotion，提供声明式动画（指令 `v-motion`、Composables、预设），API 风格类似 Framer Motion。 |

**简单记**：  
- **core**：浏览器 + DOM + 状态 + 时间等，无额外依赖。  
- **integrations**：axios、排序、搜索、二维码等，每个对应一个第三方库。  
- **motion**：做动画，单独包、单独装。

---

## @vueuse/core：组合式工具库

### 安装

```bash
pnpm add @vueuse/core
```

- **Vue 版本**：面向 Vue 3（Composition API）；Vue 2 需用 @vueuse/core 的 Vue 2 适配或 vue-demi。
- **按需引入**：建议从子路径引入，便于 tree-shaking，例如 `import { useMouse } from '@vueuse/core'`。

### 常用分类与示例

#### 状态与持久化

| 函数 | 作用 |
|------|------|
| **useLocalStorage** | 响应式读写 localStorage，键对应一个 ref。 |
| **useSessionStorage** | 同上，用 sessionStorage。 |

```typescript
import { useLocalStorage } from '@vueuse/core';

const theme = useLocalStorage('theme', 'dark');
theme.value = 'light'; // 自动写入 localStorage
```

#### 浏览器 / 设备

| 函数 | 作用 |
|------|------|
| **useMouse** | 鼠标位置 x, y（响应式）。 |
| **useWindowSize** | 窗口宽高。 |
| **useClipboard** | 剪贴板读写，copy()、只读 copied。 |
| **useFullscreen** | 全屏 API 封装，toggle、isFullscreen。 |
| **usePreferredDark** | 是否偏好深色（prefers-color-scheme）。 |

```typescript
import { useMouse, useClipboard } from '@vueuse/core';

const { x, y } = useMouse();
const { copy, copied } = useClipboard();
// copy(text) 后 copied 会在一段时间内为 true
```

#### DOM / 元素

| 函数 | 作用 |
|------|------|
| **useElementSize** | 监听元素尺寸（需传 ref 或元素）。 |
| **useDraggable** | 让元素可拖拽，返回 style/position 等。 |
| **templateRef** | 在 script setup 里拿 template ref 且支持跨组件。 |

```typescript
import { useElementSize, useDraggable } from '@vueuse/core';

const el = ref<HTMLElement | null>(null);
const { width, height } = useElementSize(el);
const { x, y, style } = useDraggable(el);
```

#### 时间

| 函数 | 作用 |
|------|------|
| **useTimestamp** | 当前时间戳（可设 interval 刷新）。 |
| **useNow** | 当前 Date 对象（可设 interval）。 |

#### 异步与网络

| 函数 | 作用 |
|------|------|
| **useAsyncState** | 封装异步函数，得到 data、loading、error、execute。 |
| **useFetch** | 基于 fetch 的请求封装，支持 ref URL、自动请求。 |

```typescript
import { useFetch } from '@vueuse/core';

const { data, isFinished, error } = useFetch('/api/user');
```

#### 交互与工具

| 函数 | 作用 |
|------|------|
| **useToggle** | 布尔切换，toggle()。 |
| **useVModel** | 对 props 的 v-model 简写，读写都像 ref。 |
| **useIntersectionObserver** | 元素是否进入视口（可见性）。 |
| **useDebounceFn / useThrottleFn** | 防抖/节流函数。 |

```typescript
import { useToggle, useVModel, useIntersectionObserver } from '@vueuse/core';

const [on, toggle] = useToggle(false);
const model = useVModel(props, 'modelValue');
const { stop } = useIntersectionObserver(el, ([{ isIntersecting }]) => {
  if (isIntersecting) console.log('进入视口');
});
```

### 文档与分类

- 完整列表见 [VueUse Core 文档](https://vueuse.org/core/)，按「Browser / Sensor / State / Element / Component / Watch / Network / Animation」等分类。

---

## @vueuse/integrations：第三方库集成

### 安装

```bash
pnpm add @vueuse/integrations
# 用到哪个集成再装对应第三方库，例如：
pnpm add axios
```

- **按需引入**：从子路径引入有利于 tree-shaking，例如 `import { useAxios } from '@vueuse/integrations/useAxios'`。

### 常见集成一览

| 函数 | 依赖库 | 作用 |
|------|--------|------|
| **useAxios** | axios | 响应式请求，data/loading/error/execute/abort。 |
| **useSortable** | sortable | 列表拖拽排序。 |
| **useFuse** | fuse.js | 模糊搜索。 |
| **useQRCode** | qrcode | 生成二维码。 |
| **useNProgress** | nprogress | 顶部进度条（路由/请求时）。 |
| **useFocusTrap** | focus-trap | 焦点 trap（弹窗/抽屉无障碍）。 |
| **useCookies** | universal-cookie | Cookie 读写。 |
| **useJwt** | jwt-decode | 解码 JWT。 |
| **useIDBKeyval** | idb-keyval | IndexedDB 简单 KV。 |
| **useAsyncValidator** | async-validator | 异步校验（表单）。 |
| **useChangeCase** | change-case | 大小写/命名转换。 |
| **useDrauu** | drauu | 画板/涂鸦。 |

### useAxios 示例

```typescript
import { useAxios } from '@vueuse/integrations/useAxios';
import axios from 'axios';

const { data, isFinished, isLoading, error, execute, abort } = useAxios(
  '/api/posts',
  {}, // config
  { immediate: true } // useAxios 选项
);
// execute() 可手动再次请求；abort() 取消请求
```

### useFuse 示例（模糊搜索）

```typescript
import { useFuse } from '@vueuse/integrations/useFuse';
import Fuse from 'fuse.js';

const list = ref([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
const search = ref('');
const { results } = useFuse(search, list, {
  keys: ['name'],
  fuseOptions: { threshold: 0.2 },
});
// results 为匹配项，随 search 变化
```

### 文档

- 完整列表与用法见 [VueUse Integrations](https://vueuse.org/integrations/readme)。

---

## @vueuse/motion：动画

### 做什么

- 基于 **Popmotion**，提供**声明式**动画，API 风格类似 Framer Motion。
- 支持 **指令** `v-motion`、**Composables**（如 useMotion）、**预设**（slide、fade 等），SSR 友好，支持 Nuxt 3。
- 体积轻量（约 <20kb），TypeScript 编写。

### 安装

```bash
pnpm add @vueuse/motion
```

### 全局注册（用指令时）

```typescript
import { MotionPlugin } from '@vueuse/motion';
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);
app.use(MotionPlugin);
app.mount('#app');
```

### 组件内注册（按需）

```typescript
import { MotionDirective as motion } from '@vueuse/motion';

export default {
  directives: { motion: motion() },
};
```

### 指令 v-motion 基本用法

- 通过 **v-motion** 绑定「变体名」或配置，控制进入/离开或状态动画。
- 常用属性：进入/离开的 key（如 `initial`、`enter`、`leave`），以及预设名（如 `slide-left`、`fade`）。

```vue
<template>
  <div v-motion :initial="{ opacity: 0, x: -20 }" :enter="{ opacity: 1, x: 0 }">
    内容
  </div>
</template>
```

- **预设**：如 `slide-left`、`slide-right`、`fade`、`scale` 等，可直接绑在指令上，详见 [Motion 文档 - Transition Properties / Presets](https://motion.vueuse.org/)。

### useMotion（Composables）

- 在 script 里拿到「motion 实例」，编程控制动画（如 play、状态切换）。
- 适合需要根据逻辑触发动画、或与 ref 状态联动的场景，详见官方 [Motion Instance](https://motion.vueuse.org/features/motion-instance)。

### 文档

- 入门、指令、属性、变体、Nuxt： [@vueuse/motion 文档](https://motion.vueuse.org/)。

---

## 综合示例与选包建议

### 示例：一个简单页面（core + integrations）

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useLocalStorage, useClipboard, useMouse } from '@vueuse/core';
import { useAxios } from '@vueuse/integrations/useAxios';
import axios from 'axios';

const theme = useLocalStorage('theme', 'light');
const { x, y } = useMouse();
const { copy, copied } = useClipboard();
const { data: user, isLoading, execute } = useAxios('/api/user', {}, { immediate: true });
</script>

<template>
  <div>
    <p>鼠标: {{ x }}, {{ y }}</p>
    <button @click="copy('hello')">{{ copied ? '已复制' : '复制' }}</button>
    <p v-if="isLoading">加载中...</p>
    <pre v-else>{{ user }}</pre>
  </div>
</template>
```

### 选包建议

- **只做状态、DOM、浏览器、时间**：只装 **@vueuse/core**。
- **要用 axios、Fuse、Sortable、二维码等**：加 **@vueuse/integrations**，并装对应第三方库。
- **要做声明式/复杂动画**：加 **@vueuse/motion**；简单过渡用 Vue 自带 `<Transition>` 即可。

---

## 常见坑与最佳实践

1. **按需引入**：从 `@vueuse/core` 或 `@vueuse/integrations/useXxx` 按需 import，避免整包打包。
2. **integrations 的依赖**：useAxios 要装 axios，useFuse 要装 fuse.js，否则运行时报错。
3. **SSR**：core 里很多函数已考虑 SSR（如 useLocalStorage 在服务端不访问 window），Nuxt 等框架按文档说明用即可；motion 也标称 SSR Ready。
4. **ref 与 DOM**：useElementSize、useDraggable 等要传元素 ref，确保在挂载后才有值（如 ref 绑在组件或 DOM 上）。
5. **motion 指令**：用 `v-motion` 前必须 `app.use(MotionPlugin)` 或在组件里注册 directive，否则指令不生效。

---

## 包速查表与参考

### 包速查表

| 包名 | 类型 | 一句话说明 |
|------|------|------------|
| **@vueuse/core** | 核心 | Vue 3 组合式工具库：状态、DOM、浏览器、时间、异步、交互等，无第三方业务依赖。 |
| **@vueuse/integrations** | 集成 | 把 axios、Fuse、Sortable、qrcode、nprogress 等包成 Composables。 |
| **@vueuse/motion** | 动画 | 声明式动画（v-motion、useMotion、预设），基于 Popmotion，Framer Motion 风格。 |

### 参考与延伸阅读

- [VueUse 官网](https://vueuse.org/)
- [VueUse Core 函数列表](https://vueuse.org/core/)
- [VueUse Integrations](https://vueuse.org/integrations/readme)
- [@vueuse/motion 文档](https://motion.vueuse.org/)

---

**文档版本**：针对 Vue 3 + VueUse 当前生态整理；具体 API 以官方文档为准。
