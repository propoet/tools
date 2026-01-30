# vee-validate 与 @vee-validate/zod 综合学习文档

> Vue 3 表单校验库 vee-validate，配合 Zod 的 @vee-validate/zod 实现「类型安全 + 声明式校验」

## 📚 目录

1. [用大白话说：vee-validate 是啥](#用大白话说vee-validate-是啥)
2. [原理：表单状态与校验流程](#原理表单状态与校验流程)
3. [vee-validate 与 Zod、@vee-validate/zod 的关系](#vee-validate-与-zodvee-validatezod-的关系)
4. [安装](#安装)
5. [核心概念：Form / Field / ErrorMessage 与 useForm / useField](#核心概念form--field--errormessage-与-useform--usefield)
6. [两种用法：组件式 vs Composition API](#两种用法组件式-vs-composition-api)
7. [校验方式：表单级 schema 与字段级 rules](#校验方式表单级-schema-与字段级-rules)
8. [@vee-validate/zod：用 Zod 写校验](#vee-validatezod用-zod-写校验)
9. [完整示例：登录表单 + Zod](#完整示例登录表单--zod)
10. [常见场景与进阶](#常见场景与进阶)
11. [校验时机（何时触发校验）](#校验时机何时触发校验)
12. [常见坑与最佳实践](#常见坑与最佳实践)
13. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：vee-validate 是啥

### 你遇到的问题（手写表单时）

- **状态多**：每个输入要绑 `v-model`，还要自己记「有没有改过」「有没有报错」「错误文案是啥」。
- **校验散**：必填、长度、邮箱、异步查重……规则写在各种地方，提交前要自己 `if (!email) ...` 一堆。
- **体验难做**：失焦校验、提交时一次性标红、防重复提交、和 UI 库（Element Plus、Naive 等）对接，都要自己撸。

也就是说：**表单状态 + 校验逻辑 + 错误展示 + 提交流程**，全手写很累，还容易漏。

### vee-validate 帮你做啥

vee-validate 是 **Vue 3 下的表单校验库**，特点：

1. **不管 UI**：只提供「值、错误、校验、提交」的逻辑（Composition API + 可选组件），不强制你用什么输入框，所以能和任意 UI 库或原生 `<input>` 搭配。
2. **两种用法**：  
   - **组件式**：用 `<Form>`、`<Field>`、`<ErrorMessage>`，在模板里声明，适合简单表单。  
   - **Composition API**：用 `useForm`、`useField`，自己写 `<input>` 或第三方组件，适合复杂、定制化表单。
3. **多种校验来源**：可以用**函数**、**Yup schema**、**Zod schema**（通过 @vee-validate/zod）、或**全局规则**（`defineRule`），按需选。
4. **状态与时机**：自动管「脏、碰过、错误、校验中」等状态，支持失焦/输入/提交时校验，以及异步校验。

一句话：**vee-validate = 表单状态管理 + 校验引擎 + 与 Vue 响应式/组件无缝结合**；用 **@vee-validate/zod** 时，校验用 Zod 写，还能得到完整的 TypeScript 类型推断。

---

## 原理：表单状态与校验流程

**核心思路**：表单可以抽象成「字段值 + 脏/碰过/错误/校验中」等状态，以及「何时校验、如何展示错误」的流程。vee-validate 在内部维护这些状态（与 Vue 响应式打通），对外暴露 useForm/useField 或 Form/Field 组件；校验时把当前值交给「规则」（函数或 schema），根据结果更新错误状态。

- **状态管理**：每个 field 有 value、touched、dirty、errors、meta 等；useForm 聚合所有 field，提供 submit、setValues、reset 等；状态用 ref/reactive 与 Vue 绑定，组件只消费不手写。
- **校验流程**：校验时机由配置决定（blur、change、submit 等）；触发时对单个字段或整表执行「规则」——函数则传入 value 返回 true/string/Promise，schema（如 Zod）则用 schema.parse 或 safeParse，把错误转成 vee-validate 需要的字段错误结构。
- **@vee-validate/zod**：把 Zod schema 通过 toTypedSchema 转成 vee-validate 能调用的校验函数，内部用 zod 的 safeParse，失败时把 zod 的 path + message 映射到 field errors；这样既能用 Zod 写规则和类型，又能用 vee-validate 管状态和 UI。

---

## vee-validate 与 Zod、@vee-validate/zod 的关系

| 包 | 作用 |
|----|------|
| **vee-validate** | 核心库：提供 Form/Field/ErrorMessage、useForm/useField、校验流程、状态管理。不关心「规则用什么写」，只关心「有没有通过、错误信息是啥」。 |
| **zod** | 独立的 schema 校验库：`z.object({ email: z.string().email() })` 这种写法，可单独在 Node/前端做数据校验，并推导 TypeScript 类型。 |
| **@vee-validate/zod** | 桥接层：把 **Zod 的 schema** 转成 vee-validate 能用的「校验配置」，用 `toTypedSchema()`；这样既能用 Zod 写规则，又能让 vee-validate 管表单状态和错误展示，并且**提交值的类型**可以从 Zod schema 自动推断。 |

**简单记**：  
- 用 **vee-validate** 管「表单怎么绑、什么时候校验、错误怎么显示」。  
- 用 **Zod** 写「每个字段/整张表长什么样、怎么才算合法」。  
- 用 **@vee-validate/zod** 的 `toTypedSchema()` 把 Zod 接到 vee-validate 上。

---

## 安装

三个包一起装（若项目里已有 `zod` 可只装 vee-validate 和 @vee-validate/zod）：

```bash
pnpm add vee-validate zod @vee-validate/zod
# 或
npm i vee-validate zod @vee-validate/zod
```

- **Vue 版本**：vee-validate 4.x 面向 Vue 3（Composition API + `<script setup>` 最佳）。
- **只用 vee-validate、不用 Zod**：可不装 `zod` 和 `@vee-validate/zod`，用函数或 Yup 写规则。

---

## 核心概念：Form / Field / ErrorMessage 与 useForm / useField

### 组件式三件套

| 组件 | 作用 |
|------|------|
| **Form** | 包住整张表，负责「表单级校验 schema、提交处理、子 Field 的上下文」。通过 `@submit` 拿到通过校验的值；可传 `validation-schema`（如 toTypedSchema(zod.object({...}))）。 |
| **Field** | 代表一个字段，绑定 `name`，可包一层原生 `<input>` 或任意组件；可传 `rules`（字段级）或依赖 Form 的 schema；通过 slot 拿到 `value`、`meta`、`handleChange` 等。 |
| **ErrorMessage** | 按 `name` 显示该字段的错误信息，无错误时不渲染；可用 `as` 指定标签或用 slot 自定义。 |

### Composition API 两件套

| 组合式函数 | 作用 |
|------------|------|
| **useForm** | 表单级：配置 `validationSchema`、`initialValues` 等；返回 `handleSubmit`、`errors`、`setFieldValue`、`meta` 等，用于自定义表单布局和提交。 |
| **useField** | 字段级：传字段 `name` 和可选 `rules`/校验函数；返回 `value`、`errorMessage`、`handleChange`、`meta` 等，用来绑到你自己的 input 或组件。 |

**关系**：  
- 用 `<Form>` 时，内部的 `<Field>` / `useField` 会挂到该 Form 的上下文中，共用同一套 schema 和提交逻辑。  
- 用 `useForm` 时，不再必须用 `<Form>` 标签，但同一表单里的多个 `useField(name)` 会通过 `name` 和同一个 `useForm` 实例关联（需在同一组件或 provide/inject 下）。

---

## 两种用法：组件式 vs Composition API

### 方式一：组件式（Form + Field + ErrorMessage）

适合：表单结构简单、希望少写 JS、模板一眼能看出有哪些字段。

```vue
<template>
  <Form :validation-schema="schema" @submit="onSubmit">
    <Field name="email" v-slot="{ field }">
      <input v-bind="field" type="email" />
    </Field>
    <ErrorMessage name="email" />

    <Field name="password" v-slot="{ field }">
      <input v-bind="field" type="password" />
    </Field>
    <ErrorMessage name="password" />

    <button type="submit">提交</button>
  </Form>
</template>

<script setup>
import { Form, Field, ErrorMessage } from 'vee-validate';

const schema = { /* 见下节 */ };
function onSubmit(values) {
  console.log(values);
}
</script>
```

- `Field` 的 `v-slot="{ field }"` 里通常有 `value`、`name`、`onBlur`、`onChange` 等，用 `v-bind="field"` 绑到原生 input 即可。
- 校验既可来自 Form 的 `validation-schema`，也可在 Field 上单独写 `rules`。

### 方式二：Composition API（useForm + useField）

适合：要用自定义组件、第三方 UI 库、或更细粒度控制布局和逻辑。

```vue
<template>
  <form @submit="onSubmit">
    <input v-model="email" name="email" type="email" />
    <span>{{ errors.email }}</span>

    <input v-model="password" name="password" type="password" />
    <span>{{ errors.password }}</span>

    <button type="submit">提交</button>
  </form>
</template>

<script setup>
import { useForm, useField } from 'vee-validate';

const { handleSubmit, errors } = useForm({
  validationSchema: schema, // 表单级 schema
});

const { value: email } = useField('email');
const { value: password } = useField('password');

const onSubmit = handleSubmit((values) => {
  console.log(values);
});
</script>
```

- `useField('email')` 的 `value` 和表单里的 `name="email"` 对应，`errors` 由 `useForm` 根据 `validationSchema` 计算。
- 原生 `<form>` 只是为了语义和回车提交，实际校验和提交由 `handleSubmit` 处理。

---

## 校验方式：表单级 schema 与字段级 rules

### 表单级：validationSchema

整张表用一个「对象 schema」描述（例如 Zod 的 `z.object({ email: ..., password: ... })`），交给 `<Form :validation-schema="...">` 或 `useForm({ validationSchema })`。  
优点：一处定义、类型好推、适合和 @vee-validate/zod 一起用。

### 字段级：rules

单个字段上写规则，例如 `<Field name="email" :rules="emailRules" />` 或 `useField('email', emailRules)`。  
`rules` 可以是：

- **函数**：`(value) => value ? true : '必填'`
- **字符串**：配合全局 `defineRule`，如 `"required|email|min:8"`
- **Zod schema 转成**：`toTypedSchema(zod.string().email())`（见下节）

### 全局规则：defineRule

在应用入口（如 `main.js`）定义一次，到处用字符串规则：

```javascript
import { defineRule } from 'vee-validate';

defineRule('required', (value) => (value && String(value).trim() ? true : '此字段必填'));
defineRule('min', (value, [limit]) => {
  if (!value) return true;
  return value.length >= Number(limit) ? true : `至少 ${limit} 个字符`;
});
```

模板里：`<Field name="name" rules="required|min:2" />`。

**返回值约定**：  
- 通过：`return true`  
- 不通过：`return '错误信息字符串'` 或 `return false`（用默认文案）  
- 异步：`return new Promise((resolve) => { ... resolve(true | '错误信息'); })`

---

## @vee-validate/zod：用 Zod 写校验

### toTypedSchema 做什么

`@vee-validate/zod` 只导出一个对 vee-validate 有用的东西：**toTypedSchema**。  
它把 Zod 的 schema 转成 vee-validate 能用的格式，并且：

- 校验时按 Zod 规则跑；
- **提交/值的类型**可以从 Zod schema 推断（TypeScript 下 `handleSubmit((values) => ...)` 里 `values` 有类型）。

### 字段级：单个字段用 Zod

```javascript
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

const emailSchema = toTypedSchema(
  z.string().min(1, { message: '必填' }).email({ message: '邮箱格式不正确' })
);
```

- **组件式**：`<Field name="email" :rules="emailSchema" />`
- **Composition**：`useField('email', emailSchema)`

### 表单级：整表用 zod.object

```javascript
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

const validationSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, { message: '必填' }).email({ message: '邮箱格式不正确' }),
    password: z.string().min(1, { message: '必填' }).min(8, { message: '至少 8 位' }),
  })
);
```

- **组件式**：`<Form :validation-schema="validationSchema" @submit="onSubmit">`
- **Composition**：`useForm({ validationSchema })`

Zod 的 `message` 会变成 vee-validate 展示的错误文案；TS 下 `values` 类型即为 `z.infer<typeof schema>`。

### refine / superRefine 注意点

Zod 的 `refine` / `superRefine` 在「对象里缺 key」时可能不执行（Zod 的设计），表单未填全时可能拿不到预期错误。复杂跨字段校验可考虑在提交前用 `schema.safeParse` 自己跑一遍，或把能写的规则尽量写在单字段上。

---

## 完整示例：登录表单 + Zod

下面用 **Composition API + 表单级 Zod** 写一个登录表单（邮箱 + 密码），包含必填、格式、长度。

```vue
<template>
  <form @submit="onSubmit" class="form">
    <div>
      <label>邮箱</label>
      <input v-model="email" name="email" type="email" />
      <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>
    <div>
      <label>密码</label>
      <input v-model="password" name="password" type="password" />
      <span v-if="errors.password" class="error">{{ errors.password }}</span>
    </div>
    <button type="submit" :disabled="meta.touched && !meta.valid">登录</button>
  </form>
</template>

<script setup>
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

const validationSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, { message: '请输入邮箱' }).email({ message: '邮箱格式不正确' }),
    password: z.string().min(1, { message: '请输入密码' }).min(8, { message: '密码至少 8 位' }),
  })
);

const { handleSubmit, errors, meta } = useForm({
  validationSchema,
});

const { value: email } = useField('email');
const { value: password } = useField('password');

const onSubmit = handleSubmit((values) => {
  // values 类型为 { email: string; password: string }
  console.log('提交', values);
});
</script>
```

同一套 schema 用组件式写法：

```vue
<template>
  <Form :validation-schema="validationSchema" @submit="onSubmit">
    <Field name="email" v-slot="{ field }">
      <input v-bind="field" type="email" />
    </Field>
    <ErrorMessage name="email" as="span" class="error" />

    <Field name="password" v-slot="{ field }">
      <input v-bind="field" type="password" />
    </Field>
    <ErrorMessage name="password" as="span" class="error" />

    <button type="submit">登录</button>
  </Form>
</template>

<script setup>
import { Form, Field, ErrorMessage } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

const validationSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, { message: '请输入邮箱' }).email({ message: '邮箱格式不正确' }),
    password: z.string().min(1, { message: '请输入密码' }).min(8, { message: '密码至少 8 位' }),
  })
);

function onSubmit(values) {
  console.log('提交', values);
}
</script>
```

---

## 常见场景与进阶

### 初始值

- **useForm**：`useForm({ initialValues: { email: '', password: '' }, validationSchema })`
- **Form 组件**：`<Form :initial-values="..." />`

### 异步校验（如用户名是否已存在）

在 Zod 里用 `.refine()` 配合 async，或不用 schema、用 `useField('name', async (value) => { ... })` 返回 `true` / 错误字符串。

### 动态字段名（如列表表单项）

`useField` 里名字用**函数**保持响应式：`useField(() => props.name)`，避免闭包拿到旧名字。

### 与 UI 库（Element Plus、Naive UI 等）配合

不用 `<Field>` 渲染的组件，用 `useField` 拿 `value`、`errorMessage`、`handleChange`、`handleBlur` 绑到库的输入组件上；`errors` 来自 `useForm`，在需要的地方显示即可。

### 只校验部分字段（如分步表单）

可给当前步骤的字段单独做一个 `z.object`，或同一 schema 下用 `useForm` 的 `setFieldError` / 按需 `validateField` 控制展示。

---

## 校验时机（何时触发校验）

- **默认**：失焦（blur）时校验单字段；点击提交时校验整表。
- **useForm 可配**：`validateOnMount: true` 挂载时就校验；`validateOnBlur` / `validateOnValueUpdate` 等可关掉或改成输入时校验，按需查阅官方文档。
- **useField**：也可单独控制该字段的校验时机。

---

## 常见坑与最佳实践

1. **Field 的 name 和 useField 的 name 必须一致**，且和 schema 里的 key 一致，否则拿不到错误或值。
2. **表单级 schema 时，Field 不必再写 rules**，否则可能重复校验或覆盖 schema。
3. **提交前校验**：`handleSubmit` 会在提交时跑整表校验，不通过不会执行你传进去的 onSubmit 回调。
4. **Zod 的 message**：用 `{ message: '...' }` 形式，vee-validate 会用来展示；不写则用 Zod 默认错误信息。
5. **类型**：用 TypeScript 时，表单级用 `toTypedSchema(z.object({...}))`，提交值的类型会自动推断，无需手写 interface。
6. **与 Zod 文档衔接**：本仓库 [19_zod/zod.md](../19_zod/zod.md) 有 Zod 的 `z.string()`、`z.object()`、`z.coerce`、`safeParse` 等用法，schema 写法以 Zod 为准，这里只负责「接到 vee-validate」。

---

## 参考与延伸阅读

- [vee-validate 4 官方文档](https://vee-validate.logaretm.com/v4/)
- [Zod Schema Validation（@vee-validate/zod）](https://vee-validate.logaretm.com/v4/integrations/zod-schema-validation/)
- [Zod 官网](https://zod.dev/)
- 本仓库 [19_zod/zod.md](./19_zod/zod.md)：Zod 单独用法与类型推断

---

**文档版本**：针对 vee-validate 4.x + @vee-validate/zod + Vue 3；API 以官方文档为准。
