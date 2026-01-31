# tippy.js 学习文档

> 基于 Popper.js 的 tooltip、popover、dropdown 库，支持智能定位、动画、主题与无障碍

## 📚 目录

1. [用大白话说：tippy.js 是啥](#用大白话说tippyjs-是啥)
2. [原理：定位与 Popper](#原理定位与-popper)
3. [与 vue-tippy、原生 title 的关系](#与-vue-tippynative-title-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [核心 API：tippy()、实例方法](#核心-apitippy实例方法)
6. [常用选项：content、placement、trigger、interactive](#常用选项contentplacementtriggerinteractive)
7. [主题与动画](#主题与动画)
8. [常见场景与最佳实践](#常见场景与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：tippy.js 是啥

### 你遇到的问题（要做 tooltip/popover 时）

- **原生 title 太简陋**：浏览器自带的 title 不能自定义样式、不能富文本、不能交互（如放链接）。
- **定位要稳**：希望 tooltip 在视口内自动避让、翻转，不要被裁掉。
- **统一体验**：希望 tooltip、popover、下拉菜单用同一套定位与动画逻辑。

也就是说：**在「富样式、可交互、智能定位的 tooltip/popover」这件事上，提供一套完整方案**，就是 tippy.js 要解决的问题。

### tippy.js 帮你做啥

**tippy.js**（atomiks 维护）是一个 **tooltip / popover 库**：

1. **智能定位**：基于 Popper.js，自动选择 top/bottom/left/right 及 start/end，避免溢出视口。
2. **多种用法**：tooltip（悬停提示）、popover（点击弹出）、dropdown、menu；通过选项区分。
3. **可交互**：`interactive: true` 时内容可点击、可悬停，不立刻消失。
4. **主题与动画**：内置 light、dark 等主题，支持多种动画；可完全自定义 CSS。
5. **无障碍**：支持键盘、焦点、ARIA，便于屏幕阅读器。
6. **框架**：Vue 可用 vue-tippy，React 可用 @tippyjs/react。

一句话：**tippy.js = 富样式、可交互、智能定位的 tooltip/popover**，基于 Popper.js。

---

## 原理：定位与 Popper

- **Popper.js**：计算「浮层」相对「锚点」的位置，考虑视口、滚动、翻转等；tippy.js 用其做定位引擎。
- **触发器**：默认 hover；可改为 click、focus 或自定义；支持 touch。
- **生命周期**：create → show → hide → destroy；可挂载 Vue/React 组件或 HTML 字符串。

---

## 与 vue-tippy、原生 title 的关系

| 角色 | 作用 |
|------|------|
| **tippy.js** | 核心库，纯 JS，不依赖框架；提供 API 与样式。 |
| **vue-tippy** | Vue 的封装：指令 v-tippy、组件 <Tippy>、useTippy()，底层用 tippy.js。 |
| **原生 title** | 浏览器默认提示，不可样式、不可交互；tippy 可完全替代。 |

**简单记**：tippy.js 是核心；Vue 项目用 vue-tippy 更方便。

---

## 安装与使用方式

### 安装

```bash
pnpm add tippy.js
# 或
npm i tippy.js
```

### 使用方式

- **引入 CSS**：`import 'tippy.js/dist/tippy.css'`（必须，否则无默认样式）。
- **创建实例**：`tippy(selectorOrElement, { content: '...', ... })`，返回 Tippy 实例；可调用 `.show()`、`.hide()`、`.destroy()`。

---

## 核心 API：tippy()、实例方法

### tippy(targets, options?)

为单个或多个元素创建 tippy。

- **targets**：CSS 选择器字符串、HTMLElement 或 NodeList。
- **options**：见下节；常用 `content`、`placement`、`trigger`、`interactive`。
- **返回值**：单个实例或实例数组（依 targets 数量）。

```javascript
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

const instance = tippy('#btn', {
  content: '提示文字',
  placement: 'top',
  trigger: 'mouseenter',
});
```

### 实例方法

- **show()** / **hide()**：显示/隐藏。
- **setContent(content)**：更新内容。
- **destroy()**：销毁实例，移除事件与 DOM。

---

## 常用选项：content、placement、trigger、interactive

| 选项 | 说明 |
|------|------|
| **content** | 字符串或 HTML；可为函数，返回内容。 |
| **placement** | `'top'`、`'bottom'`、`'left'`、`'right'` 及 `'top-start'` 等。 |
| **trigger** | `'mouseenter'`（默认）、`'click'`、`'focus'`、`'focusin'` 等。 |
| **interactive** | 为 true 时内容可悬停/点击，不立刻关闭。 |
| **arrow** | 是否显示箭头，默认 true。 |
| **theme** | 主题名，如 `'light'`、`'dark'`；对应 CSS 类。 |
| **animation** | 动画类型，如 `'shift-away'`、`'fade'`。 |
| **appendTo** | 挂载到的父元素，默认 `document.body`。 |

---

## 主题与动画

- **主题**：通过 `theme: 'light'` 等指定，对应 class `.tippy-box[data-theme="light"]`；可自定义 CSS 覆盖。
- **动画**：通过 `animation: 'shift-away'` 等指定；需引入对应 CSS 或自定义。
- **无样式**：若只想要行为不要默认样式，可只引基础 tippy.css 并覆盖，或自定义主题。

---

## 常见场景与最佳实践

1. **简单提示**：`tippy(el, { content: '...' })`，默认 hover 即可。
2. **点击弹出**：`trigger: 'click'`，适合 popover；可配合 `interactive: true` 放表单或链接。
3. **Vue/React**：用 vue-tippy 或 @tippyjs/react，以组件/指令方式使用。
4. **无障碍**：保持默认的 focus 行为；自定义触发器时注意键盘与焦点。

---

## 参考与延伸阅读

- [tippy.js 官网](https://atomiks.github.io/tippyjs/)
- [tippy.js npm](https://www.npmjs.com/package/tippy.js)
- [tippy.js GitHub](https://github.com/atomiks/tippyjs)
- [vue-tippy](https://vue-tippy.netlify.app/)
