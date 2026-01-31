# reka-ui 学习文档

> Vue 3 无样式（headless）无障碍 UI 组件库，Reka UI 为 Radix Vue 的 v2 品牌升级

## 📚 目录

1. [用大白话说：reka-ui 是啥](#用大白话说reka-ui-是啥)
2. [原理：headless 与无障碍](#原理headless-与无障碍)
3. [与 Radix Vue、shadcn-vue 的关系](#与-radix-vueshadcn-vue-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [组件概览与按需引入](#组件概览与按需引入)
6. [典型用法：Accordion、Dialog、Popover](#典型用法accordiondialogpopover)
7. [asChild、状态与国际化](#aschild状态与国际化)
8. [常见场景与最佳实践](#常见场景与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：reka-ui 是啥

### 你遇到的问题（做 Vue 无障碍组件时）

- **无障碍与键盘**：手写 Accordion、Dialog、Popover、Select 等要管焦点、键盘、ARIA，容易漏或错。
- **样式要自己控**：不想用「带死样式」的组件库，希望只拿行为与结构，样式完全自己写或接 Tailwind/shadcn。
- **Vue 3 生态**：希望有和 Radix（React）类似的无样式、可组合的 Vue 组件，便于做设计系统。

也就是说：**在「Vue 3 下提供无样式、无障碍、可组合的 UI 原语」这件事上，提供一套组件**，就是 reka-ui 要解决的问题。

### reka-ui 帮你做啥

**reka-ui**（原 Radix Vue，UnoVue 社区维护）是一个 **Vue 3 无样式 UI 组件库**：

1. **40+ 原语组件**：Accordion、AlertDialog、Checkbox、Collapsible、Dialog、DropdownMenu、Popover、Select、Tabs、Toast 等，只提供行为与 DOM 结构，不提供样式。
2. **无障碍优先**：遵循 WAI-ARIA，内置焦点管理、键盘导航、屏幕阅读器支持。
3. **无样式**：不绑死 CSS，你可接 Tailwind、自定义 CSS 或 shadcn-vue 等。
4. **asChild / 可控状态**：支持 `asChild` 把根节点换成自定义元素；默认 uncontrolled，也可完全可控。
5. **TypeScript、Tree-shake**：全量类型、按需引入，未用组件不打包。

一句话：**reka-ui = Vue 3 的「Radix 风格」无样式无障碍组件**，适合做设计系统或接 shadcn-vue。

---

## 原理：headless 与无障碍

- **Headless**：组件只负责「逻辑 + DOM 结构 + 无障碍属性」，样式由你通过 class 或 style 控制；便于统一设计语言、主题切换。
- **无障碍**：每个组件按 WAI-ARIA 暴露角色、状态、键盘行为；焦点、Tab 顺序、Esc 关闭等由库处理，减少手写错误。
- **组合**：多个原语可组合成复杂 UI（如 Popover + Select），保持可访问性一致。

---

## 与 Radix Vue、shadcn-vue 的关系

| 角色 | 作用 |
|------|------|
| **reka-ui** | Vue 3 无样式无障碍原语；原 Radix Vue，v2 品牌改为 Reka UI。 |
| **Radix Vue** | 即 reka-ui 的前身，现统一用 reka-ui 名称与包名。 |
| **shadcn-vue** | 基于 reka-ui（或 Radix Vue）的「复制粘贴」组件，带默认 Tailwind 样式；用 reka-ui 做行为层。 |

**简单记**：reka-ui 提供「行为 + 结构」；shadcn-vue 在之上加「默认样式」；新项目可直接用 reka-ui 或 shadcn-vue。

---

## 安装与使用方式

### 安装

```bash
pnpm add reka-ui
# 或
npm i reka-ui
```

### 使用方式

- **按需引入**：只引入用到的组件，如 `import { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent } from 'reka-ui'`。
- **在 SFC 里**：用组件包裹你的 HTML，并给子元素加 class 做样式。

---

## 组件概览与按需引入

常见原语（以官方文档为准）：

- **Accordion**：手风琴
- **AlertDialog**：确认对话框
- **Checkbox**：复选框
- **Collapsible**：可折叠区域
- **Dialog**：对话框
- **DropdownMenu**：下拉菜单
- **Popover**：弹出层
- **Select**：选择器
- **Tabs**：标签页
- **Toast**：轻提示
- **Tooltip**：工具提示
- …

每个组件多为「Root + 子组件」结构，如 `AccordionRoot` + `AccordionItem` + `AccordionTrigger` + `AccordionContent`。

---

## 典型用法：Accordion、Dialog、Popover

### Accordion 示例

```vue
<template>
  <AccordionRoot type="multiple">
    <AccordionItem value="a">
      <AccordionHeader>
        <AccordionTrigger>Section A</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>Content A</AccordionContent>
    </AccordionItem>
    <AccordionItem value="b">
      <AccordionHeader>
        <AccordionTrigger>Section B</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>Content B</AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<script setup>
import {
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from 'reka-ui';
</script>
```

### Dialog 示例

```vue
<template>
  <DialogRoot>
    <DialogTrigger as-child>
      <button>Open</button>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui';
</script>
```

### Popover 示例

```vue
<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <button>Open popover</button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent>Popover content</PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup>
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui';
</script>
```

---

## asChild、状态与国际化

- **asChild**：在 Trigger 等组件上设 `as-child`，子元素会作为实际可点击/可聚焦元素，便于用自定义 button 或链接。
- **状态**：多数组件默认 uncontrolled（内部管理状态）；需要时可用 `v-model` 或对应 props 做受控。
- **国际化**：支持 RTL、locale、数字格式等（见官方文档）。

---

## 常见场景与最佳实践

1. **设计系统**：用 reka-ui 做「行为层」，自己用 Tailwind/CSS 做主题与样式。
2. **接 shadcn-vue**：若喜欢 shadcn 的默认样式，可直接用 shadcn-vue，底层即 reka-ui。
3. **按需引入**：只 import 用到的组件，减小打包体积。
4. **无障碍**：保持默认的焦点与键盘行为，自定义样式时不要破坏可访问性（如保留 focus-visible 等）。

---

## 参考与延伸阅读

- [reka-ui 官网](https://reka-ui.com/)
- [Getting started](https://reka-ui.com/docs/overview/getting-started)
- [reka-ui GitHub](https://github.com/unovue/reka-ui)
- [reka-ui npm](https://www.npmjs.com/package/reka-ui)
