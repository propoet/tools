# medium-zoom 学习文档

> 仿 Medium 的图片点击放大库；轻量、无依赖、框架无关，支持 HD 图、自定义遮罩与容器，适合文章/文档里的图片预览

## 📚 目录

1. [用大白话说：medium-zoom 是啥](#用大白话说medium-zoom-是啥)
2. [原理：点击放大怎么实现](#原理点击放大怎么实现)
3. [与 lightbox、photo-view 的对比](#与-lightboxphoto-view-的对比)
4. [安装与使用方式](#安装与使用方式)
5. [API：selector 与 options](#apiselector-与-options)
6. [方法：open / close / attach / detach](#方法open--close--attach--detach)
7. [HD 图与 data-zoom-src](#hd-图与-data-zoom-src)
8. [事件与自定义模板](#事件与自定义模板)
9. [常见场景与最佳实践](#常见场景与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：medium-zoom 是啥

### 你遇到的问题（文章/文档里图片要放大时）

- **点击图片想看大图**：文章、博客、文档里的图片希望「点击后全屏/遮罩放大」，类似 Medium 的体验。
- **不想写一堆 DOM/动画**：自己写 overlay、缩放、关闭逻辑麻烦，且要兼顾键盘、滚动、手势。
- **要轻量、无依赖**：不想引入大型 lightbox 或 jQuery。
- **要框架无关**：Vue、React、纯 HTML 都能用。

也就是说：**在「点击图片放大、点击/滚动/按键关闭、可配遮罩与 HD 图」这件事上，提供轻量、框架无关的方案**，就是 medium-zoom 要解决的问题。

### medium-zoom 帮你做啥

**medium-zoom**（François Chalifour）是一个 **仿 Medium 的图片放大库**：

1. **按选择器绑定**：`mediumZoom(selector, options)` 把指定图片绑上点击放大；selector 可以是 CSS 选择器、HTMLElement、NodeList、数组。
2. **轻量、无依赖**：纯 JS，零依赖，体积小；默认构建内联样式，无需单独 import CSS（可选 pure 构建 + 自己引入 CSS）。
3. **交互**：点击图片打开放大；点击遮罩、按 Esc、滚动一定距离可关闭；支持触摸/手势。
4. **可配置**：**margin**、**background**（遮罩色）、**scrollOffset**（滚动多少像素关闭）、**container**、**template** 等。
5. **HD 图**：通过 **data-zoom-src** 指定放大时加载的高清图，点击后再请求，省首屏流量。
6. **方法**：**open**、**close**、**toggle**、**attach**、**detach**、**update**、**clone**；**on**/**off** 监听事件。

一句话：**medium-zoom = 轻量、仿 Medium 的图片点击放大**，适合博客、文档、图集里的图片预览。

---

## 原理：点击放大怎么实现

### 1. 绑定与点击

- **mediumZoom(selector)** 会找到匹配的 **img** 元素，给它们绑定 **click** 等事件。
- 点击时：根据图片的 **src**（或 **data-zoom-src**）创建/显示一个**遮罩层**，在其中渲染放大后的图片，并做**位移动画**（从原图位置过渡到居中放大）。

### 2. 关闭

- 点击遮罩、按 **Esc**、**滚动超过 scrollOffset** 等会触发关闭；关闭时做缩小动画并移除遮罩。
- 库内部处理 overlay、z-index、焦点与键盘事件，无需自己写。

### 3. 性能

- 针对 60fps 优化；HD 图在**打开时**再加载（data-zoom-src），避免首屏请求大图。

可以简单记：**绑定 img → 点击时创建 overlay + 放大图 + 动画 → 关闭时动画 + 移除**。

---

## 与 lightbox、photo-view 的对比

| 对比项       | medium-zoom           | lightbox2 / 各类 lightbox | photo-view 等        |
|--------------|------------------------|----------------------------|-----------------------|
| **定位**     | 仿 Medium、单图放大    | 常见为相册/多图切换        | 多图、手势、缩放      |
| **依赖**     | 无                     | 部分依赖 jQuery 或较重     | 视实现而定            |
| **体积**     | 小                     | 中等                       | 中等偏大              |
| **HD 图**    | data-zoom-src          | 部分支持                   | 部分支持              |
| **框架**     | 框架无关               | 多数框架无关               | 有 React/Vue 封装版   |
| **典型用途** | 文章内图片点击放大     | 相册、多图轮播             | 相册、复杂手势        |

**简单记**：**文章/文档里「点击图片放大」、要轻量** → **medium-zoom**；**多图相册、轮播、复杂手势** → 选专用 lightbox/photo-view。

---

## 安装与使用方式

### 安装

```bash
pnpm add medium-zoom
# 或
npm i medium-zoom
```

### 使用方式概览

- **默认**：`import mediumZoom from 'medium-zoom'`，无需单独引入 CSS；调用 `mediumZoom(selector, options)` 即可。
- **纯 JS + 自控样式**：`import mediumZoom from 'medium-zoom/dist/pure'` 且 `import 'medium-zoom/dist/style.css'`，便于自己控制注入时机。

---

## API：selector 与 options

### mediumZoom(selector?, options?)

- **selector**（可选）：要绑定的图片，可以是：
  - **字符串**：CSS 选择器，如 `'[data-zoomable]'`、`'.post img'`
  - **HTMLElement**：单个 img
  - **NodeList** / **Array**：多个元素
- **options**（可选）：配置对象，见下。
- **返回值**：**Zoom** 实例，有 open、close、attach、on 等方法。

### 常用 options

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| **margin** | number | 0 | 放大图与视口边缘的间距（px） |
| **background** | string | "#fff" | 遮罩层背景色 |
| **scrollOffset** | number | 40 | 垂直滚动超过该像素数时关闭放大 |
| **container** | string \| HTMLElement \| object | null | 放大图渲染的容器（视口） |
| **template** | string \| HTMLTemplateElement | null | 自定义遮罩/放大区域的 HTML 模板 |

示例：

```js
mediumZoom("[data-zoomable]", {
  margin: 24,
  background: "rgba(0,0,0,0.8)",
  scrollOffset: 0,
});
```

---

## 方法：open / close / attach / detach

### open / close / toggle

- **zoom.open({ target?: HTMLElement })**：打开放大；无 target 时打开当前绑定的第一张或当前打开的那张；返回 **Promise&lt;Zoom&gt;**。
- **zoom.close()**：关闭放大，返回 **Promise&lt;Zoom&gt;**。
- **zoom.toggle({ target?: HTMLElement })**：若当前关闭则打开，若打开则关闭，返回 **Promise&lt;Zoom&gt;**。

### attach / detach

- **zoom.attach(...selectors)**：给更多图片绑定放大，参数类型同 `mediumZoom(selector)`；返回 Zoom，可链式。
- **zoom.detach(...selectors)**：解除部分或全部图片的绑定；不传参则解除全部。返回 Zoom。

### update / clone / getOptions / getImages / getZoomedImage

- **zoom.update(options)**：合并更新配置，返回 Zoom。
- **zoom.clone(options)**：克隆当前 Zoom 实例并合并新 options，返回新 Zoom。
- **zoom.getOptions()**：当前配置对象。
- **zoom.getImages()**：当前绑定的所有 img 元素数组。
- **zoom.getZoomedImage()**：当前处于放大状态的 img，未打开时为 null。

---

## HD 图与 data-zoom-src

- 若希望**放大时加载更高清图**，在 **img** 上增加 **data-zoom-src**，值为高清图 URL。
- 点击时库会优先用 **data-zoom-src** 的图做放大显示，从而首屏只加载缩略图，放大再加载大图。

```html
<img src="thumb.jpg" data-zoom-src="full.jpg" data-zoomable alt="" />
```

```js
mediumZoom("[data-zoomable]");
```

---

## 事件与自定义模板

### 事件

| 事件名 | 说明 |
|--------|------|
| **open** | 调用 open 后、动画开始前触发 |
| **opened** | 放大动画结束后触发 |
| **close** | 调用 close 后、动画开始前触发 |
| **closed** | 缩小动画结束后触发 |
| **detach** | 某张图被 detach 时触发 |
| **update** | 调用 update 时在每张图上触发 |

- 监听：**zoom.on(type, listener)**；移除：**zoom.off(type, listener)**。
- 回调里可通过 **event.detail.zoom** 拿到 Zoom 实例。

### 自定义模板（template / container）

- **options.template**：自定义遮罩/放大区域的 HTML 结构（字符串或 &lt;template&gt;），详见[文档](https://github.com/francoischalifour/medium-zoom/blob/HEAD/docs/template.md)。
- **options.container**：指定放大图渲染在哪个容器内，详见[文档](https://github.com/francoischalifour/medium-zoom/blob/HEAD/docs/container.md)。

---

## 常见场景与最佳实践

### 1. 文章内所有图片可放大

```js
mediumZoom(".article img");
// 或给需要放大的图加 data-zoomable，避免头像等被放大
mediumZoom("[data-zoomable]");
```

### 2. 动态插入的图片（如 Markdown 渲染后）

- 先 `const zoom = mediumZoom()` 不传 selector，在内容渲染后再 **zoom.attach(selector)**；若整块替换 DOM，需对新区块重新 **attach**，或 detach 旧图再 attach 新图。

### 3. Vue / React 中

- 在 **mounted** / **useEffect** 里根据当前 DOM 调用 `mediumZoom(selector)` 或 `zoom.attach(...)`；组件卸载时调用 **zoom.detach()** 或销毁实例，避免内存泄漏。
- 官方提供 [Vue](https://github.com/francoischalifour/medium-zoom/tree/master/examples/vue)、[React](https://github.com/francoischalifour/medium-zoom/tree/master/examples/react) 示例可参考。

### 4. 遮罩被其他层挡住

- 库不设 z-index，若框架或全局样式导致遮罩在下层，可在 CSS 里提高层级：

```css
.medium-zoom-overlay,
.medium-zoom-image--opened {
  z-index: 999;
}
```

### 5. 需要自己控制样式注入时机

- 使用 **pure** 构建：`import mediumZoom from 'medium-zoom/dist/pure'`，并手动 `import 'medium-zoom/dist/style.css'`。

---

## 参考与延伸阅读

- [medium-zoom npm](https://www.npmjs.com/package/medium-zoom)
- [medium-zoom GitHub](https://github.com/francoischalifour/medium-zoom)
- [template 文档](https://github.com/francoischalifour/medium-zoom/blob/HEAD/docs/template.md)
- [container 文档](https://github.com/francoischalifour/medium-zoom/blob/HEAD/docs/container.md)
- [Vue / React 示例](https://github.com/francoischalifour/medium-zoom/tree/master/examples)

---

**小结**：medium-zoom 用 `mediumZoom(selector, options)` 绑定图片，点击放大、点击/ Esc/ 滚动关闭；支持 margin、background、scrollOffset、container、template；HD 图用 data-zoom-src；通过 open/close/attach/detach/on/off 控制与监听，框架无关、轻量无依赖。
