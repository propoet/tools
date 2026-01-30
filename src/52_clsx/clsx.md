# clsx 从零开始学习指南

> 极小的「条件式 className 合并」工具：支持字符串、对象、数组、嵌套，自动丢弃假值，常与 CVA、Tailwind、React/Vue 搭配使用

## 📚 目录

1. [什么是 clsx](#什么是-clsx)
2. [原理：如何合并类名](#原理如何合并类名)
3. [安装与引入](#安装与引入)
4. [API：clsx(...input)](#apiclsxinput)
5. [输入类型：字符串、对象、数组](#输入类型字符串对象数组)
6. [嵌套与混用](#嵌套与混用)
7. [clsx/lite 轻量版](#clsxlite-轻量版)
8. [与 classnames、CVA、tailwind-merge 的关系](#与-classnamescvatailwind-merge-的关系)
9. [在 React / Vue 中使用](#在-react--vue-中使用)
10. [Tailwind IntelliSense 与最佳实践](#tailwind-intellisense-与最佳实践)

---

## 什么是 clsx

**clsx** 是一个**根据条件合并出最终 className 字符串**的小工具（约 239B gzip），可接收字符串、对象、数组及嵌套结构，自动丢弃 `false`、`null`、`undefined`、`0`、`''` 等假值，输出一条干净、无多余空格的类名字符串。常作为 [classnames](https://github.com/JedWatson/classnames) 的更快、更小替代品，也被 [class-variance-authority](https://cva.style) 等库内部使用。

### 为什么选择 clsx？

- ✅ **体积极小**：默认版约 239B gzip，lite 版约 140B，无依赖
- ✅ **输入灵活**：字符串、对象（key 为类名、value 为布尔）、数组、可嵌套混用
- ✅ **假值自动丢弃**：`false`、`null`、`undefined`、`0`、`''`、`NaN` 及单独的布尔不输出
- ✅ **可替代 classnames**：API 兼容、性能更好、体积更小
- ✅ **多格式**：ESM、CommonJS、UMD；另有 `clsx/lite` 仅支持字符串
- ✅ **TypeScript**：自带类型声明

### 典型场景

- React/Vue 组件的 `className={clsx('base', isActive && 'active', props.className)}`
- 与 CVA 配合：CVA 内部用 clsx 合并 base + 变体类；对外暴露的 `cx` 即 clsx 别名
- Tailwind 类名条件组合：`clsx('text-base', error && 'text-red-500', className)`
- 替代手写 `[a, b, c].filter(Boolean).join(' ')`，避免漏处理对象和嵌套

---

## 原理：如何合并类名

**核心思路**：clsx 接收**任意个参数**（variadic），每个参数可以是 **string / number / object / array / boolean**；内部递归处理：字符串和非零数字转成类名加入结果，对象按「value 为真则取 key 作为类名」，数组递归展开，布尔和假值丢弃；最后把收集到的类名用空格拼接成一条字符串返回，不重复、不去重（由调用方保证类名不冲突）。

- **假值规则**：`false`、`null`、`undefined`、`0`、`NaN`、`''` 不输出；**单独的布尔**（如 `clsx(true)`）也不输出，只用于条件表达式里如 `true && 'foo'` 得到 `'foo'`。
- **对象**：遍历 key，若 `obj[key]` 为真，则 key 作为类名加入结果；key 可以是任意字符串（如 `'--foobar'` 这类 CSS 变量名风格）。
- **数组**：对数组内每一项递归处理，支持多层嵌套数组；最终展平为类名列表再拼接。
- **字符串**：直接加入结果；多段空格会保留为一段空格（实际实现里通常按段 trim 后拼接）。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add clsx
# 或
npm i clsx
```

### 2. 引入

```javascript
// ESM（默认）
import clsx from 'clsx';
// 或
import { clsx } from 'clsx';

// CommonJS
const clsx = require('clsx');
```

### 3. 轻量版（仅字符串）

```javascript
import { clsx } from 'clsx/lite';
// 或
import clsx from 'clsx/lite';
```

---

## API：clsx(...input)

### 签名

```ts
function clsx(...inputs: ClassValue[]): string;
```

- **参数**：任意个 `ClassValue`，可为 `string | number | object | array | boolean | null | undefined`。
- **返回值**：合并后的 className 字符串；若没有任何有效类名则返回 `''`。

### 行为小结

| 输入类型 | 行为 |
|----------|------|
| **string** | 直接加入结果 |
| **number** | 非 0 时转字符串加入；0 丢弃 |
| **object** | key 为类名，value 为真则取 key |
| **array** | 递归处理每一项，展平后加入 |
| **boolean / null / undefined** | 丢弃 |
| **假值** | `''`、`0`、`NaN` 等丢弃 |

```javascript
clsx(true, false, '', null, undefined, 0, NaN);
// => ''
```

---

## 输入类型：字符串、对象、数组

### 字符串（可变参数）

```javascript
clsx('foo', true && 'bar', 'baz');
// => 'foo bar baz'
```

### 对象（按条件取 key）

```javascript
clsx({ foo: true, bar: false, baz: isTrue() });
// => 'foo baz'
```

多对象、与其它类型混用：

```javascript
clsx({ foo: true }, { bar: false }, null, { '--foobar': 'hello' });
// => 'foo --foobar'
```

### 数组（展平、递归）

```javascript
clsx(['foo', 0, false, 'bar']);
// => 'foo bar'
```

---

## 嵌套与混用

数组内可再嵌套数组和对象，clsx 会递归展开：

```javascript
clsx(['foo'], ['', 0, false, 'bar'], [['baz', [['hello'], 'there']]]);
// => 'foo bar baz hello there'
```

混用示例：

```javascript
clsx('foo', [1 && 'bar', { baz: false, bat: null }, ['hello', ['world']]], 'cya');
// => 'foo bar hello world cya'
```

---

## clsx/lite 轻量版

**路径**：`clsx/lite`  
**体积**：约 140B gzip  
**限制**：**只接受字符串参数**，非字符串会被忽略（不报错、不输出）。

适用场景：只用「字符串 + 条件表达式」拼类名，不需要对象/数组写法，可进一步省体积。

```javascript
import { clsx } from 'clsx/lite';

clsx('hello', true && 'foo', false && 'bar');
// => 'hello foo'

// 非字符串被忽略
clsx({ foo: true });
// => ''
```

Tailwind 场景下若写法固定为 `clsx('text-base', props.active && 'text-primary', props.className)`，用 lite 即可。

---

## 与 classnames、CVA、tailwind-merge 的关系

| 库 | 作用 |
|----|------|
| **classnames** | 与 clsx 功能类似，条件合并 className；clsx 可作为其更快、更小的替代品，API 兼容。 |
| **class-variance-authority (CVA)** | 用「变体 schema」生成 className，内部用 clsx 合并 base + 变体类；对外提供 `cx` 作为 clsx 的别名。 |
| **tailwind-merge** | 合并时解决 Tailwind 类冲突（如 `p-2` 与 `p-4` 留后者）；与 clsx 正交，常一起用：`twMerge(clsx(...), className)`。 |

**简单记**：  
- 只做「条件合并」用 **clsx**（或 classnames）。  
- 要做「变体 + 默认值 + 复合条件」用 **CVA**，CVA 内部已用 clsx。  
- 要解决 Tailwind 类冲突用 **tailwind-merge**，可在 clsx/CVA 结果之上再包一层。

---

## 在 React / Vue 中使用

### React

```tsx
import clsx from 'clsx';

function Button({ primary, size, className, ...rest }) {
  return (
    <button
      className={clsx(
        'btn',
        primary && 'btn-primary',
        size === 'large' && 'btn-lg',
        size === 'small' && 'btn-sm',
        className
      )}
      {...rest}
    />
  );
}
```

### Vue 3

```vue
<script setup>
import clsx from 'clsx';

const props = defineProps(['active', 'class']);
</script>

<template>
  <div :class="clsx('base', props.active && 'active', props.class)" />
</template>
```

---

## Tailwind IntelliSense 与最佳实践

### VS Code 中 clsx 内类名补全

若用 Tailwind，可在 `settings.json` 中为 clsx 启用类名正则，便于在 `clsx('…')` 里得到 Tailwind 补全：

```json
{
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### 最佳实践

- **基础类 + 条件类 + 外部 className**：`clsx('base', condition && 'modifier', props.className)`，把用户传入的类放最后便于覆盖。
- **对象写法**：多条件时用对象更清晰，如 `clsx('btn', { 'btn-primary': primary, 'btn-disabled': disabled })`。
- **需要解决 Tailwind 冲突时**：用 `twMerge(clsx(...), className)`，避免同一 utility 多份生效。
- **仅用字符串时**：可考虑 `clsx/lite` 减小体积。
- **与 CVA 一起用**：组件样式用 CVA 定义变体，需要再接外部类时用 `cx(buttonVariants(props), props.className)`（CVA 的 `cx` 即 clsx）。

---

## 参考链接

- [GitHub: lukeed/clsx](https://github.com/lukeed/clsx)
- [npm: clsx](https://www.npmjs.com/package/clsx)
- [class-variance-authority](https://cva.style)（内部使用 clsx）
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)（与 clsx 配合解决 Tailwind 冲突）
- [classnames](https://github.com/JedWatson/classnames)（可被 clsx 替代）
