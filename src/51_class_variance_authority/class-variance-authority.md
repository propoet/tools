# class-variance-authority (CVA) 从零开始学习指南

> 类型安全的 CSS 类变体 API：用「变体 + 默认值 + 复合条件」生成 className，与 Tailwind / 传统 CSS 都兼容

## 📚 目录

1. [什么是 class-variance-authority](#什么是-class-variance-authority)
2. [原理：变体与 className 合并](#原理变体与-classname-合并)
3. [安装与引入](#安装与引入)
4. [核心 API：cva 与 cx](#核心-apicva-与-cx)
5. [variants 与 defaultVariants](#variants-与-defaultvariants)
6. [compoundVariants 复合变体](#compoundvariants-复合变体)
7. [TypeScript 与类型推导](#typescript-与类型推导)
8. [与 Tailwind、tailwind-merge 配合](#与-tailwindtailwind-merge-配合)
9. [在 React / Vue 中使用](#在-react--vue-中使用)
10. [最佳实践与参考](#最佳实践与参考)

---

## 什么是 class-variance-authority

**class-variance-authority**（常简称 **CVA**）是一个**根据「变体」生成类型安全 className** 的小库，适用于「同一组件有多种样式变体」的场景（如按钮的 primary/secondary、small/medium、disabled 等），不用手写一堆 `if/else` 拼类名，也不用上 CSS-in-JS，保持对样式表输出的完全控制。

### 为什么选择 CVA？

- ✅ **类型安全**：variants 的 key/value 有 TypeScript 推导，传错变体或漏写会报错
- ✅ **框架无关**：不绑 React/Vue，传统 CSS、Tailwind、CSS Modules 都能用
- ✅ **变体 + 默认值**：`defaultVariants` 一次设好默认，调用时只传要改的
- ✅ **复合变体**：`compoundVariants` 可写「当 intent=primary 且 size=medium 时加某类」
- ✅ **体积小**：依赖 clsx 做类名合并，包很小
- ✅ **与 shadcn/ui、Radix 等生态常用**：很多组件库用 CVA 定义组件样式 API

### 典型场景

- 按钮、Badge、Card 等组件的「变体」样式（intent、size、disabled）
- 与 Tailwind 搭配：base 和每个变体值都是 Tailwind 类，CVA 只负责「根据 props 选哪几组类」
- 需要把「可选的 className」和变体合并时，用 `cx(cva(...)(props), props.className)` 或配合 `tailwind-merge`

---

## 原理：变体与 className 合并

**核心思路**：组件的样式 = **基础类（base）** + **按变体选中的类** + **满足复合条件时追加的类**。CVA 把「变体 schema（variants、compoundVariants、defaultVariants）」编译成一个函数：传入变体取值（如 `{ intent: 'primary', size: 'small' }`），函数内部根据 defaultVariants 补全、按 variants 查表取类、再按 compoundVariants 条件追加类，最后用 **clsx** 把 base + 所有选中的类合并成一条字符串返回。

- **variants**：每个变体是一个「名 → 取值 → 类名」的映射；调用时根据传入的变体值（或 defaultVariants）选出对应的类数组/字符串，一起放进 clsx。
- **compoundVariants**：每条是「若干变体条件 + class」；当当前变体取值同时满足某条 compound 的条件时，把该条的 class 也加入合并列表；可用来表达「primary + medium 时多加 uppercase」这类组合逻辑。
- **clsx**：CVA 内部用 clsx 做「多段类名（字符串、数组、对象条件）合并、去重、去空」，最终输出一个 className 字符串；对外也暴露 `cx` 作为 clsx 的别名，方便和外部 className 合并。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add class-variance-authority
# 或
npm i class-variance-authority
# 或使用短名别名（v1 起官方包名会改为 cva）
pnpm add cva@npm:class-variance-authority
```

### 2. 引入

```javascript
// ESM
import { cva, cx } from 'class-variance-authority';

// 若用别名安装
import { cva, cx } from 'cva';
```

### 3. 类型（TypeScript）

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
```

---

## 核心 API：cva 与 cx

### cva(base, options?)

**作用**：定义一个「变体组件」，返回一个函数；调用该函数并传入变体取值，得到合并后的 className。

| 参数 | 说明 |
|------|------|
| **base** | 基础类名：`string`、`string[]` 或任意 [clsx 支持的输入](https://github.com/lukeed/clsx#input) |
| **options.variants** | 变体 schema：`{ [variantName]: { [value]: classNames } }` |
| **options.compoundVariants** | 复合条件：`{ [variantName]: value, ..., class: string \| string[] }[]` |
| **options.defaultVariants** | 默认变体取值：`{ [variantName]: value }` |

**返回**：一个函数 `(props?) => string`，传入的 props 里变体 key 会覆盖 defaultVariants；props 里多出来的 key（如 `className`）可被忽略或在自己封装时处理。

### cx(...inputs)

**作用**：合并类名，即 [clsx](https://github.com/lukeed/clsx) 的别名；可接字符串、数组、对象（key 为类名、value 为布尔）等。

```javascript
cx('a', ['b', 'c'], { d: true, e: false }); // => "a b c d"
```

---

## variants 与 defaultVariants

### 基本写法

```javascript
import { cva } from 'class-variance-authority';

const button = cva(
  ['font-semibold', 'border', 'rounded'],
  {
    variants: {
      intent: {
        primary: ['bg-blue-500', 'text-white', 'border-transparent'],
        secondary: ['bg-white', 'text-gray-800', 'border-gray-400'],
      },
      size: {
        small: ['text-sm', 'py-1', 'px-2'],
        medium: ['text-base', 'py-2', 'px-4'],
      },
      disabled: {
        true: ['opacity-50', 'cursor-not-allowed'],
        false: null,
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'medium',
      disabled: false,
    },
  }
);

button(); 
// => "font-semibold border rounded bg-blue-500 text-white border-transparent text-base py-2 px-4"
button({ intent: 'secondary', size: 'small' }); 
// => "font-semibold border rounded bg-white text-gray-800 border-gray-400 text-sm py-1 px-2"
button({ disabled: true }); 
// => 在默认 intent/size 基础上加上 opacity-50 cursor-not-allowed
```

### 变体值为字符串

每个变体取值可以是 `string` 或 `string[]`（数组会一起交给 clsx 合并）：

```javascript
variants: {
  intent: {
    primary: 'bg-blue-500 text-white border-transparent',
    secondary: 'bg-white text-gray-800 border-gray-400',
  },
}
```

### defaultVariants 与 null

- `defaultVariants` 里未写的变体，调用时不传则为 `undefined`，不会参与 variants 查表（一般不产生额外类）。
- 若希望「不传即无类」，可把该变体的 `defaultVariants` 设为 `null`（文档说明：设置 variant 为 `null` 可完全移除默认值）。

---

## compoundVariants 复合变体

当**多个变体同时满足**某条件时，追加一类名。

```javascript
const button = cva('…', {
  variants: {
    intent: { primary: '…', secondary: '…' },
    size: { small: '…', medium: '…' },
  },
  compoundVariants: [
    { intent: 'primary', disabled: false, class: 'hover:bg-blue-600' },
    { intent: 'secondary', disabled: false, class: 'hover:bg-gray-100' },
    { intent: 'primary', size: 'medium', class: 'uppercase' },
    // 多条条件同时满足：intent 为 primary 或 secondary，且 size 为 medium
    { intent: ['primary', 'secondary'], size: 'medium', class: 'rounded-lg' },
  ],
  defaultVariants: { intent: 'primary', size: 'medium', disabled: false },
});
```

- 每条 `compoundVariants` 项：除 `class`（或 `className`）外，其余 key 为变体名，value 为当前变体取值或取值数组（表示「属于其中之一即满足」）。
- 当前传入的变体取值若满足某条的所有条件，则该条的 `class` 会加入合并结果。

---

## TypeScript 与类型推导

用 `VariantProps<typeof cvaComponent>` 可得到「变体 + 默认值」的类型，用于组件 props。

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('base', {
  variants: {
    intent: { primary: '…', secondary: '…' },
    size: { small: '…', medium: '…' },
  },
  defaultVariants: { intent: 'primary', size: 'medium' },
});

type ButtonVariants = VariantProps<typeof buttonVariants>;
// { intent?: 'primary' | 'secondary'; size?: 'small' | 'medium' }

export interface ButtonProps extends ButtonVariants {
  className?: string;
  children?: React.ReactNode;
}

export function Button({ className, ...variants }: ButtonProps) {
  return <button className={cx(buttonVariants(variants), className)} />;
}
```

---

## 与 Tailwind、tailwind-merge 配合

### Tailwind IntelliSense

在 VS Code 的 `settings.json` 中把 `cva`、`cx` 加入 Tailwind 的 class 函数，便于在 CVA 里写 Tailwind 类时也有补全：

```json
{
  "tailwindCSS.classFunctions": ["cva", "cx"]
}
```

### 避免类冲突：tailwind-merge

同一属性多组 Tailwind 类可能冲突（如 `p-2` 与 `p-4`），CVA 只做「选哪几组」，不负责冲突。可用 **tailwind-merge** 在最终合并时覆盖：

```javascript
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const buttonVariants = cva(['base', 'classes'], {
  variants: { intent: { primary: ['primary', 'classes'] } },
  defaultVariants: { intent: 'primary' },
});

export const button = (variants: VariantProps<typeof buttonVariants>) =>
  twMerge(buttonVariants(variants));
```

组件里再把用户传入的 `className` 合并进去：`className={twMerge(buttonVariants(props), props.className)}`。

---

## 在 React / Vue 中使用

### React

```tsx
const buttonVariants = cva('…', { variants: { … }, defaultVariants: { … } });

function Button({ className, intent, size, disabled, ...rest }) {
  return (
    <button
      className={cx(buttonVariants({ intent, size, disabled }), className)}
      {...rest}
    />
  );
}
```

### Vue 3

```vue
<script setup>
import { cva, cx } from 'class-variance-authority';

const buttonVariants = cva('…', { variants: { … }, defaultVariants: { … } });
</script>

<template>
  <button :class="cx(buttonVariants({ intent, size, disabled }), $attrs.class)">
    <slot />
  </button>
</template>
```

---

## 最佳实践与参考

### 最佳实践

- **base 放公共样式**：所有变体共有的类放 base，变体里只放「该取值独有」的类，减少重复。
- **布尔变体用 true/false**：如 `disabled: { true: '…', false: null }`，语义清晰。
- **需要接外部 className 时**：用 `cx(cvaResult, props.className)` 或 `twMerge(cvaResult, props.className)`，避免覆盖用户样式。
- **与 Tailwind 冲突多时**：用 `tailwind-merge` 包一层 CVA 或最终 className。
- **SSR/SSG 友好**：CVA 只算字符串，无运行时 DOM，适合在服务端生成 className。

### 参考链接

- [CVA 官网与文档](https://cva.style/docs)
- [GitHub: joe-bell/cva](https://github.com/joe-bell/cva)
- [npm: class-variance-authority](https://www.npmjs.com/package/class-variance-authority)
- [clsx](https://github.com/lukeed/clsx)（类名合并）
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)（Tailwind 类冲突合并）
