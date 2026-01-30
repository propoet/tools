# @tanstack/vue-query 与 @tanstack/vue-store 学习文档

## 📚 目录

1. [概述](#概述)
2. [原理：服务端状态与客户端状态](#原理服务端状态与客户端状态)
3. [@tanstack/vue-query](#tanstackvue-query)
3. [@tanstack/vue-store](#tanstackvue-store)
4. [两者关系与选型](#两者关系与选型)
5. [参考链接](#参考链接)

---

## 概述

| 包 | 作用 | 适用场景 |
|----|------|----------|
| **@tanstack/vue-query** | Vue 版的 TanStack Query，负责**服务端状态**：请求、缓存、同步、更新 | 接口数据、列表/分页/无限滚动、Mutation 后失效与重取 |
| **@tanstack/vue-store** | TanStack Store 的 **Vue 适配层**，提供 `useStore`、`shallow` 等，用于**客户端状态** | 本地 UI 状态、表单草稿、多组件共享的简单状态 |

- **vue-query**：服务端数据（Server State）— 谁都可能改、会过期，需要缓存与失效策略。
- **vue-store**：客户端状态（Client State）— 完全由当前应用控制，无需请求与缓存。

二者可同时使用：Query 管接口数据，Store 管本地状态。

---

## 原理：服务端状态与客户端状态

**核心思路**：前端状态分两类——**服务端状态**（来自接口，可能过期、被他人修改，需要缓存与失效策略）和**客户端状态**（仅本应用控制，如 UI 开关、表单草稿）。Vue Query 管前者，Store 管后者；二者在 Vue 里通过 Composition API 暴露，与响应式系统集成。

- **Vue Query**：维护「查询 key → 数据 + 元数据（status、staleTime 等）」的缓存；请求前先查缓存，未过期则直接用，过期则后台重取（stale-while-revalidate）；组件通过 `useQuery` 订阅，数据变化触发响应式更新；Mutation 后可主动失效相关 query 触发重取。
- **Vue Store**：TanStack Store 是框架无关的细粒度响应式 store；Vue 适配层通过 `useStore` 把 store 的读写映射到 Vue 的 ref/reactive，使组件只订阅用到的 slice，减少无效更新。
- **为何分开**：服务端状态有「请求、缓存、重试、失效」等通用模式，用 Query 统一处理；客户端状态无此需求，用 Store 更轻量、可控。

---

## @tanstack/vue-query

### 是什么

TanStack Query 的 Vue 版本，用于在 Vue 中**拉取、缓存、同步和更新服务端状态**。支持 Vue 3 与 Vue 2.7；Vue 2.6 需配合 `@vue/composition-api`。

### 核心能力（简要）

- 与协议/后端无关（REST、GraphQL、Promise 等均可）
- 自动缓存与重新请求（stale-while-revalidate、窗口聚焦重取、轮询）
- 并行 / 依赖查询、分页 / 游标 / 无限滚动
- Mutation 与查询失效、乐观更新、请求取消
- 可选：Suspense、SSR、Devtools

### 安装

```bash
pnpm add @tanstack/vue-query
# 或
npm i @tanstack/vue-query
```

Vue 2.6 需先安装并启用 `@vue/composition-api`。

### 全局注册

在应用入口挂载 **VueQueryPlugin**：

```javascript
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

createApp(App).use(VueQueryPlugin).mount('#app')
```

### 快速示例：Query + Mutation + 失效

```vue
<script setup>
import { useQueryClient, useQuery, useMutation } from '@tanstack/vue-query'

const queryClient = useQueryClient()

const { isPending, isError, data, error } = useQuery({
  queryKey: ['todos'],
  queryFn: getTodos,
})

const mutation = useMutation({
  mutationFn: postTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

function onButtonClick() {
  mutation.mutate({ id: Date.now(), title: 'Do Laundry' })
}
</script>

<template>
  <span v-if="isPending">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <ul v-else>
    <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
  </ul>
  <button @click="onButtonClick">Add Todo</button>
</template>
```

### 动态选项（响应式）

若 `queryKey`、`enabled` 等依赖响应式数据，请传入 **ref/computed**，以便在变化时重新执行或禁用查询：

```javascript
const id = ref(1)
const enabled = ref(false)

const query = useQuery({
  queryKey: ['todos', id],
  queryFn: () => getTodos(id.value),
  enabled,
})
```

### 常用 API 速查

| API | 用途 |
|-----|------|
| `useQuery({ queryKey, queryFn, ... })` | 单条查询，返回 `data`、`isPending`、`isError`、`error`、`refetch` 等 |
| `useQueries` | 多条查询并行 |
| `useInfiniteQuery` | 无限列表 / 加载更多 |
| `useMutation({ mutationFn, onSuccess, ... })` | 变更，触发 `mutate(variables)` |
| `useQueryClient()` | 获取 `QueryClient`，用于 `invalidateQueries`、`setQueryData`、`prefetchQuery` 等 |
| `queryOptions` / `infiniteQueryOptions` | 抽离可复用的查询配置（含类型推断） |

### 文档与示例

- 安装、TypeScript、响应式、GraphQL、SSR/Nuxt 等见官方 [Vue 文档](https://tanstack.com/query/latest/docs/framework/vue/overview)。
- 概念：查询键、查询函数、禁用/暂停、重试、分页、占位数据、乐观更新、Suspense 等均有对应章节。
- 示例：Basic、Vue 2.6/2.7、Nuxt 3、Persister 等见 [Examples](https://tanstack.com/query/latest/docs/framework/vue/examples/basic)。

---

## @tanstack/vue-store

### 是什么

**TanStack Store** 的 Vue 适配包，提供 `useStore`、`shallow` 等，让 Vue 组件能订阅 **Store / Derived / Effect** 的更新。核心逻辑在 **@tanstack/store**（框架无关的 signal/状态实现），@tanstack/vue-store 负责与 Vue 的响应式结合。

**注意**：TanStack Store 当前为 **Alpha**，API 可能变动。

### 安装

```bash
pnpm add @tanstack/vue-store
# 或
npm i @tanstack/vue-store
```

通常同时依赖核心包 `@tanstack/store`（vue-store 会带出）。

### 核心概念（来自 @tanstack/store）

- **Store**：对一块状态的封装，`getState()` / `state` 读，`setState(updater)` 写，`subscribe` 订阅变更。
- **Derived**：依赖一个或多个 Store（或 Derived），惰性计算派生值，需 `mount()` 后才开始监听。
- **Effect**：依赖 Store/Derived，执行副作用，需 `mount()` 后才运行。
- **batch**：批量更新，减少订阅触发次数。

### 在 Vue 中使用：useStore

**useStore(store, selector?, options?)**：在组件内订阅 Store（或 Derived），返回**只读的 ref**，selector 用于只取部分状态，减少重渲染。

- `store`：`Store` 或 `Derived` 实例。
- `selector`：`(state) => TSelected`，可选；不传则返回整个 state 的 ref。
- `options`：如 `{ shallow: true }`，使用浅比较（见下方 `shallow`）。

```javascript
import { useStore } from '@tanstack/vue-store'
import { store } from './store'

const props = defineProps({ animal: String })
const count = useStore(store, (state) => state[props.animal])
```

模板中直接使用 `count` 即可（ref 自动解包）。

### 定义 Store（可在组件外）

Store 可在任意地方创建（例如单独 `store.js`），不依赖组件生命周期：

```javascript
import { Store } from '@tanstack/vue-store'
// 或从核心包：import { Store } from '@tanstack/store'

export const store = new Store({
  dogs: 0,
  cats: 0,
})

export function updateState(animal) {
  store.setState((state) => ({
    ...state,
    [animal]: state[animal] + 1,
  }))
}
```

组件内通过 **useStore** 读取，通过 **updateState** 或直接 **store.setState** 更新。

### shallow（浅比较）

当 **selector** 返回对象/数组时，默认会按引用触发更新。若希望只在“浅层”变化时更新，可配合 **shallow**：

```javascript
import { useStore, shallow } from '@tanstack/vue-store'

const selected = useStore(store, (state) => ({ a: state.a, b: state.b }), { shallow: true })
```

具体 API 以官方 [Vue Reference - shallow](https://tanstack.com/store/latest/docs/framework/vue/reference/functions/shallow) 为准。

### 简单完整示例（官方风格）

**store.js**

```javascript
import { Store } from '@tanstack/vue-store'

export const store = new Store({
  dogs: 0,
  cats: 0,
})

export function updateState(animal) {
  store.setState((state) => ({
    ...state,
    [animal]: state[animal] + 1,
  }))
}
```

**Display.vue**

```vue
<script setup>
import { useStore } from '@tanstack/vue-store'
import { store } from './store'

const props = defineProps({ animal: String })
const count = useStore(store, (state) => state[props.animal])
</script>

<template>
  <div>{{ animal }}: {{ count }}</div>
</template>
```

**Increment.vue**

```vue
<script setup>
import { updateState } from './store'
const props = defineProps({ animal: String })
</script>

<template>
  <button @click="updateState(animal)">My Friend Likes {{ animal }}</button>
</template>
```

### 文档与示例

- [TanStack Store - Vue](https://tanstack.com/store/latest/docs/framework/vue)
- [Vue Quick Start](https://tanstack.com/store/latest/docs/framework/vue/quick-start)
- [useStore / shallow](https://tanstack.com/store/latest/docs/framework/vue/reference/functions/useStore)
- [Simple Example](https://tanstack.com/store/latest/docs/framework/vue/examples/simple)
- 核心 Store/Derived/Effect、batch、updateFn、onUpdate 等见 [Quick Start (core)](https://tanstack.com/store/latest/docs/quick-start)

---

## 两者关系与选型

| 维度 | @tanstack/vue-query | @tanstack/vue-store |
|------|---------------------|----------------------|
| **状态类型** | 服务端状态（异步、可过期、共享） | 客户端状态（同步、应用内可控） |
| **典型用法** | 接口请求、缓存、失效、Mutation | 本地计数、表单草稿、UI 开关、多组件共享小状态 |
| **是否替代 Pinia/Vuex** | 不替代，专注服务端数据 | 可视为轻量、signal 风格的状态方案；Pinia 仍适合大型客户端状态与 DevTools |

- **只做接口拉取与缓存**：用 **vue-query** 即可。
- **只做简单全局/共享客户端状态**：可用 **vue-store**（注意 Alpha 状态）。
- **既有接口又有本地状态**：**vue-query + vue-store** 或 **vue-query + Pinia** 均可。

---

## 参考链接

### @tanstack/vue-query

- [npm - @tanstack/vue-query](https://www.npmjs.com/package/@tanstack/vue-query)
- [TanStack Query - Vue 总览](https://tanstack.com/query/latest/docs/framework/vue/overview)
- [Vue 安装](https://tanstack.com/query/latest/docs/framework/vue/installation)
- [Vue Quick Start](https://tanstack.com/query/latest/docs/framework/vue/quick-start)
- [Vue 示例 Basic](https://tanstack.com/query/latest/docs/framework/vue/examples/basic)

### @tanstack/vue-store

- [npm - @tanstack/vue-store](https://www.npmjs.com/package/@tanstack/vue-store)
- [TanStack Store - Vue](https://tanstack.com/store/latest/docs/framework/vue)
- [TanStack Store - Quick Start (core)](https://tanstack.com/store/latest/docs/quick-start)
- [Vue Quick Start](https://tanstack.com/store/latest/docs/framework/vue/quick-start)
- [useStore](https://tanstack.com/store/latest/docs/framework/vue/reference/functions/useStore)
- [GitHub - TanStack/store](https://github.com/TanStack/store)
