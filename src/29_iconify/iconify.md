# Iconify 全面学习指南

## 📚 目录
1. [什么是 Iconify](#什么是-iconify)
2. [原理：统一 API 与按需加载](#原理统一-api-与按需加载)
3. [图标命名规则](#图标命名规则)
3. [使用方式概览](#使用方式概览)
4. [Web 组件（iconify-icon）](#web-组件iconify-icon)
5. [React 组件](#react-组件)
6. [Vue / Svelte](#vue--svelte)
7. [按需加载与 Iconify API](#按需加载与-iconify-api)
8. [离线与自定义图标](#离线与自定义图标)
9. [尺寸、颜色与变换](#尺寸颜色与变换)
10. [CSS 方式（Tailwind / UnoCSS）](#css-方式tailwind--unocss)
11. [设计工具与图标浏览](#设计工具与图标浏览)
12. [最佳实践与参考](#最佳实践与参考)

---

## 什么是 Iconify

**Iconify** 是一套**统一使用海量图标**的方案：把 200+ 开源图标集、超过 27 万枚图标，用同一套 API 和组件来使用，支持按需加载、多框架、多用法（Web 组件、React/Vue/Svelte、SVG、CSS 等）。

### 核心特点
- ✅ **统一入口**：一套语法使用 200+ 图标集、27 万+ 图标
- ✅ **按需加载**：只请求用到的图标数据，不打包整本图标集
- ✅ **多端一致**：Web 组件、React、Vue、Svelte、纯 HTML、CSS 均可使用
- ✅ **SVG 渲染**：像素级清晰，支持单色/多色、CSS 着色
- ✅ **设计工具**：Figma、Sketch 插件，可直接从 Iconify 选图
- ✅ **公开 API**：可自建 API 做离线或私有图标

### 典型场景
- 后台、中台：统一图标体系，用户可选图标
- 多图标集混用：Material、Heroicons、Tabler 等一套写法
- 需要离线或内网：自建 API + addCollection 预置
- 与 Tailwind/UnoCSS 等配合：用 CSS 类使用图标

---

## 原理：统一 API 与按需加载

**核心思路**：图标集很多（Material、Heroicons、Font Awesome 等），若每套都整包引入会体积巨大。Iconify 的做法是：**统一命名（prefix:name）+ 中心 API 按图标 ID 返回 SVG 数据**，页面只请求用到的图标，避免打包整本图标集。

- **统一命名**：用 `prefix:name`（如 `mdi:home`）唯一标识一枚图标，不同图标集只是 prefix 不同，调用方式一致。
- **按需拉取**：组件渲染时根据 `icon` 属性向 Iconify API（或自建 API）请求该 ID 的 SVG 数据，拿到后再插入 DOM；未用到的图标不会请求、不占打包体积。
- **离线与预置**：可把常用图标通过 `addCollection` 预置到内存，或自建 API 镜像，这样不依赖公网、首屏更快；构建时也可用插件把用到的图标内联进 bundle。

---

## 图标命名规则

图标名格式：**`[provider:]prefix:name`**

| 部分 | 说明 | 示例 |
|------|------|------|
| **provider** | API 来源，以 `@` 开头，空表示公共 Iconify API | 空、`@custom` |
| **prefix** | 图标集前缀 | `mdi`、`heroicons`、`fa` |
| **name** | 图标在该集内的名称 | `home`、`user` |

### 常见写法

```text
mdi:home           # Material Design Icons 的 home
heroicons:home     # Heroicons 的 home
fa:home            # Font Awesome 的 home（可写 fa-home）
mdi-light:home     # MDI Light 变体
flat-color-icons:voice-presentation
```

- 公共 API 时 **provider 可省略**。
- 部分 prefix 支持用 `-` 连接：`fa:arrow-left` 与 `fa-arrow-left` 等价。

### 哪里查图标名

- [Iconify 图标集浏览](https://icon-sets.iconify.design/)
- [Icones](https://icones.js.org/)（Anthony Fu）

---

## 使用方式概览

| 方式 | 适用 | 说明 |
|------|------|------|
| **Web 组件** `<iconify-icon>` | 任意 HTML / 任意框架 | 推荐，SSR 友好，按需加载 |
| **React** `@iconify/react` | React / Next.js | 需注意 Next 下用 client 或改用 Web 组件 |
| **Vue** `@iconify/vue` | Vue 3 | 原生组件 |
| **Svelte** `@iconify/svelte` | Svelte | 原生组件 |
| **SVG 内联** | 任意 | 通过工具把图标转成 `<svg>` 内联 |
| **CSS（背景/遮罩）** | 任意 | Tailwind / UnoCSS 等插件，用类名引用 |

---

## Web 组件（iconify-icon）

**推荐方式**：框架无关、SSR 友好、按需从 API 拉取图标数据。

### 安装与注册

```bash
pnpm add iconify-icon
# 或 npm install iconify-icon
```

**打包项目**（推荐）：

```javascript
import 'iconify-icon';
// 之后可直接在模板里用 <iconify-icon>
```

**不打包**（脚本标签）：

```html
<script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
```

### 基础用法

```html
<iconify-icon icon="mdi:home"></iconify-icon>
<iconify-icon icon="heroicons:user" width="24" height="24"></iconify-icon>
<iconify-icon icon="mdi:alert" style="color: #ba3329; font-size: 48px"></iconify-icon>
```

### 常用属性

| 属性 | 说明 |
|------|------|
| **icon** | 必填，图标名或图标数据（JSON 字符串） |
| **width** / **height** | 宽高，数字或带单位字符串；只设一个时另一个按比例算 |
| **inline** | 布尔，内联对齐 |
| **flip** | 翻转：`horizontal`、`vertical`、`horizontal,vertical` |
| **rotate** | 旋转：`90deg`、`180deg`、`270deg` 等 |
| **mode** | 渲染模式（见官方文档） |
| **noobserver** | 禁用“仅可见时渲染”，长列表需全部渲染时可加 |

### 避免布局偏移（CLS）

图标加载有短暂延迟，可先占位：

```css
iconify-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}
```

### 从包内调用 API

```javascript
import 'iconify-icon';
import { loadIcon, loadIcons, addCollection } from 'iconify-icon';

// 预加载单个
loadIcon('mdi:home').then((data) => console.log('loaded', data));

// 预加载多个
loadIcons(['mdi:home', 'mdi:settings'], (loaded, missing, pending, unsubscribe) => {
  console.log('loaded', loaded, 'missing', missing);
});

// 离线：添加本地图标集
addCollection({
  prefix: 'custom',
  icons: {
    myIcon: { body: '<path d="..." fill="currentColor"/>' },
  },
  width: 24,
  height: 24,
});
```

---

## React 组件

### 安装

```bash
pnpm add @iconify/react
```

### 基础用法

```jsx
import { Icon } from '@iconify/react';

<Icon icon="mdi:home" />
<Icon icon="mdi:home" width={24} height={24} />
<Icon icon="mdi:home" style={{ color: 'red' }} />
<Icon icon="mdi:home" flip="horizontal" rotate={90} />
```

### 常用 Props

| Prop | 说明 |
|------|------|
| **icon** | 图标名或 IconifyIcon 数据 |
| **inline** | 布尔，内联对齐 |
| **width** / **height** | 宽高 |
| **color** / **style** | 颜色（单色图标用 CSS 颜色即可） |
| **flip** | `horizontal`、`vertical` 等 |
| **rotate** | 数字（度）或字符串如 `90deg` |
| **onLoad** | 图标数据加载完成回调 |

### Next.js 注意

- 组件依赖客户端状态，**建议包在 client 组件里**，或改用 **iconify-icon** Web 组件以避免水合问题。
- 若要在服务端就渲染出 SVG，可传**图标数据对象**而不是图标名，或改用 [Iconify Icon Web 组件](https://iconify.design/docs/iconify-icon/)、[Unplugin Icons](https://iconify.design/docs/usage/svg/unplugin/) 等。

### 预加载与离线（React）

```javascript
import { loadIcons, addCollection } from '@iconify/react';

loadIcons(['mdi:home', 'mdi:settings']);
addCollection({ prefix: 'custom', icons: { ... }, width: 24, height: 24 });
```

---

## Vue / Svelte

- **Vue 3**：`@iconify/vue`，使用方式与 React 类似，`<Icon icon="mdi:home" />`。
- **Svelte**：`@iconify/svelte`，同上。
- **Nuxt**：使用 Web 组件时需在 `nuxt.config` 里把 `iconify-icon` 标为自定义元素，见官方文档。

---

## 按需加载与 Iconify API

### 流程简述

1. 页面里写 `<iconify-icon icon="mdi:home">` 或 `<Icon icon="mdi:home" />`。
2. 组件向 **Iconify API** 请求该图标数据（按 prefix 请求，如 `mdi.json?icons=home,...`）。
3. API 返回 SVG 描述（JSON），组件在本地渲染成 `<svg>`。

因此：**需要能访问 Iconify API（或自建 API）**；离线环境需用 `addCollection` 等提前注入图标数据。

### 公共 API

- 默认请求：`https://api.iconify.design/`。
- 图标数据接口：`/{prefix}.json?icons={name1,name2,...}`，一个 prefix 一次请求。

### 自建 API / 离线

- 自建：见 [Iconify API 部署文档](https://iconify.design/docs/api/hosting.html)。
- 前端离线：用 `addCollection` / `addIcon` 把图标集或单个图标注入，不请求网络。

### loadIcons / loadIcon

- **loadIcon(name)**：返回 Promise，拉取一个图标数据。
- **loadIcons(names, callback?)**：批量拉取，callback 参数为 `(loaded, missing, pending, unsubscribe)`，返回取消函数。

---

## 离线与自定义图标

### addIcon（单个）

```javascript
import { addIcon } from 'iconify-icon'; // 或 @iconify/react

addIcon('my-icon', {
  body: '<path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="currentColor"/>',
  width: 24,
  height: 24,
});
```

使用：`icon="my-icon"`（若 prefix 与现有集不冲突）或按你定义的 prefix。

### addCollection（图标集）

```javascript
import { addCollection } from 'iconify-icon';

addCollection({
  prefix: 'custom',
  icons: {
    'home': { body: '<path d="..." fill="currentColor"/>' },
    'settings': { body: '<path d="..." fill="currentColor"/>' },
  },
  width: 24,
  height: 24,
});
```

使用：`icon="custom:home"`、`icon="custom:settings"`。

### 自定义 Loader（自定义来源）

用 **setCustomIconLoader** / **setCustomIconsLoader** 为某个 prefix 指定从自建 API 或本地资源拉取，详见官方 [Custom loaders](https://iconify.design/docs/iconify-icon/custom-loaders.html)。

---

## 尺寸、颜色与变换

### 尺寸

- **Web 组件**：默认约 1em 高，宽按比例。可用 `width`、`height` 或 `style="font-size: 24px"` 控制。
- **React**：同理会继承字体大小；也可传 `width`、`height`（数字或字符串）。

### 颜色

- **单色图标**：用 `color`、`style={{ color }}` 或父级 `color` 即可，图标多用 `currentColor`。
- **多色/表情类图标**：颜色写死在 SVG 里，一般不能通过 CSS 改。

### 变换

- **flip**：`horizontal`、`vertical`、`horizontal,vertical`。
- **rotate**：`90`、`180`、`270`（数字度）或 `"90deg"` 等，在 SVG 内部变换，影响 viewBox。

---

## CSS 方式（Tailwind / UnoCSS）

不引入 JS 组件时，可用「图标 → CSS 背景/遮罩」的方式，通过类名使用。

### Tailwind + Iconify 插件

- 安装对应插件后，类名形式通常为：`i-{prefix}-{icon}`，例如 `i-mdi-home`。
- 文档见：[Tailwind with Iconify](https://iconify.design/docs/usage/css/tailwind/iconify/)。

### UnoCSS Icons 预设

- 使用 `@unocss/preset-icons`，配合 Iconify 集。
- 类名示例：`i-mdi-home`、`i-ph-anchor-simple-thin`。
- 文档见：[UnoCSS Icons](https://iconify.design/docs/usage/css/unocss/)。

---

## 设计工具与图标浏览

### 设计工具

- **Figma**：[Iconify 插件](https://iconify.design/docs/design/figma/)
- **Sketch**：[Iconify 插件](https://iconify.design/docs/design/sketch/)

可从 Iconify 搜索、预览并插入到设计中。

### 图标浏览与复制

- [icon-sets.iconify.design](https://icon-sets.iconify.design/)：按集浏览，可复制图标名或 SVG。
- [icones.js.org](https://icones.js.org/)：搜索、筛选，复制代码片段或 SVG。

---

## 最佳实践与参考

### 实践建议

1. **优先 Web 组件**：新项目或 SSR 项目优先用 `<iconify-icon>`，减少框架绑定与水合问题。
2. **预加载关键图标**：首屏图标用 `loadIcons([...])` 提前拉取，减少闪烁。
3. **离线/内网**：用 `addCollection` 预置图标集，或自建 API + 自定义 loader。
4. **控制布局偏移**：为 `iconify-icon` 预留宽高（如 1em），或使用 `noobserver` 等按需。
5. **不推荐图标字体**：Iconify 使用 SVG，清晰且可调色；图标字体易糊、难维护。

### 速查表

| 需求 | 做法 |
|------|------|
| HTML / 任意框架 | `<iconify-icon icon="mdi:home"></iconify-icon>`，并 `import 'iconify-icon'` |
| React | `import { Icon } from '@iconify/react'`，`<Icon icon="mdi:home" />` |
| 预加载 | `loadIcons(['mdi:home', 'mdi:settings'])` |
| 离线使用 | `addCollection({ prefix, icons, width, height })` |
| 自建 API | 部署 Iconify API，`addAPIProvider()` 指向自建地址 |
| 查图标 | [icon-sets.iconify.design](https://icon-sets.iconify.design/) / [icones.js.org](https://icones.js.org/) |
| 尺寸/颜色 | `width`/`height`、`style`/`color`；单色用 `currentColor` |

### Vue 图标选择器（IconPicker.vue）

本目录提供基于 **Vue 3 + Element Plus + Iconify** 的图标选择器组件，可直接在已有 Vue 项目中使用。

**依赖（由使用方安装）：** Vue 3、Element Plus、`iconify-icon`（或 `@iconify/vue`，需在模板中改为对应组件）。若使用自定义元素 `iconify-icon`，Vue 3.3+ 默认会当作自定义元素；否则在 Vite 中可配置：

```js
// vite.config.js
export default {
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'iconify-icon',
      },
    },
  },
}
```

**用法示例：**

```vue
<template>
  <IconPicker v-model="iconName" placeholder="点击选择图标" />
  <p>当前: {{ iconName }}</p>
</template>
<script setup>
import { ref } from 'vue';
import IconPicker from './29_iconify/IconPicker.vue';
import 'iconify-icon'; // 确保 Web 组件已加载

const iconName = ref('mdi:home');
</script>
```

**Props：** `modelValue`（当前图标名，如 `mdi:home`）、`placeholder`、`triggerIconSize`、`gridIconSize`、`prefixes`（可选，预设图标集 prefix 数组，不传则从 Iconify API 拉取 `/collections`）。  
**事件：** 通过 `v-model` 更新选中的图标名（格式 `prefix:name`）。弹窗内支持切换图标集、搜索图标名、点击选中。

### 本目录示例

- **example.html** — 在浏览器中打开即可看到 Web 组件示例（使用 CDN，需联网）。若用打包工具，可 `import 'iconify-icon'` 后使用 `<iconify-icon icon="mdi:home">`。
- **IconPicker.vue** — Vue 图标选择器组件，见上文「Vue 图标选择器」。

### 参考链接

- [Iconify 官网](https://iconify.design/)
- [Iconify 文档首页](https://iconify.design/docs/)
- [如何使用图标](https://iconify.design/docs/usage/)
- [Web 组件 iconify-icon](https://iconify.design/docs/iconify-icon/)
- [React 组件](https://iconify.design/docs/icon-components/react/)
- [Iconify API（图标数据）](https://iconify.design/docs/api/icon-data.html)
- [自建 / 托管 API](https://iconify.design/docs/api/hosting.html)
- [图标集浏览](https://icon-sets.iconify.design/)
- [Icones 搜索](https://icones.js.org/)
- [Figma 插件](https://iconify.design/docs/design/figma/)
- [Tailwind + Iconify](https://iconify.design/docs/usage/css/tailwind/iconify/)
- [UnoCSS Icons](https://iconify.design/docs/usage/css/unocss/)
