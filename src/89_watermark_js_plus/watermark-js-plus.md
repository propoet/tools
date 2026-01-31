# watermark-js-plus 学习文档

> 轻量 DOM 水印插件：支持文本、多行文本、图片、富文本水印，可配置布局、旋转、样式与子容器

## 📚 目录

1. [用大白话说：watermark-js-plus 是啥](#用大白话说watermark-js-plus-是啥)
2. [原理：水印如何实现](#原理水印如何实现)
3. [与 watermark-dom、canvas 水印的关系](#与-watermark-domcanvas-水印的关系)
4. [安装与使用方式](#安装与使用方式)
5. [核心 API：Watermark、create、destroy](#核心-apiwatermarkcreatedestroy)
6. [配置：content、width、height、rotate、layout](#配置contentwidthheightrotatelayout)
7. [水印类型：文本、图片、富文本](#水印类型文本图片富文本)
8. [常见场景与最佳实践](#常见场景与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：watermark-js-plus 是啥

### 你遇到的问题（要加页面水印时）

- **防截图/录屏**：希望页面上有重复的文案或图片水印，降低直接截图盗用价值。
- **可配置**：水印文字、大小、旋转、密度、颜色要可调，且不阻塞页面交互。
- **DOM 层**：希望水印是 DOM 层（如 div 铺满），便于响应式、不依赖 canvas 导出。

也就是说：**在「给页面或指定容器加可配置的 DOM 水印」这件事上，提供轻量、可编程的 API**，就是 watermark-js-plus 要解决的问题。

### watermark-js-plus 帮你做啥

**watermark-js-plus**（zhensherlock 维护）是一个 **DOM 水印库**：

1. **多种水印类型**：纯文本、多行文本、图片、富文本（HTML）、子元素水印。
2. **布局与样式**：默认平铺或 grid 矩阵；可配置 width、height、rotate、translate、透明度、阴影、渐变等。
3. **create / destroy**：`watermark.create()` 挂载水印，`watermark.destroy()` 移除，便于单页内切换或卸载。
4. **轻量**：体积约 5kb，TypeScript 类型完整。
5. **容器**：可指定挂载到某 DOM 节点，不一定是 body。

一句话：**watermark-js-plus = 可配置的 DOM 水印**，文本/图片/富文本、平铺/grid、create/destroy。

---

## 原理：水印如何实现

- **DOM 层**：在容器内创建一层铺满的 wrapper（如 div），内部为重复的水印单元（文本节点或图片等）；通过 CSS 定位、旋转、透明度等实现效果。
- **防删**：可选 MutationObserver 监听水印节点被删或改，自动恢复；具体以库文档为准。
- **不阻塞交互**：水印层通常 `pointer-events: none`，点击穿透到下方内容。

---

## 与 watermark-dom、canvas 水印的关系

| 角色 | 作用 |
|------|------|
| **watermark-js-plus** | 功能更全的 DOM 水印：多类型、grid、样式丰富；API 为 Watermark 类 + create/destroy。 |
| **watermark-dom** | 较早的 DOM 水印库；watermark-js-plus 为其增强版或 fork。 |
| **Canvas 水印** | 用 canvas 绘制整屏水印再导出图；DOM 水印不改变页面结构，易响应式与动态更新。 |

**简单记**：要 DOM 水印、多类型、可配置用 watermark-js-plus；要导出图为图加水印用 canvas 方案。

---

## 安装与使用方式

### 安装

```bash
pnpm add watermark-js-plus
# 或
npm i watermark-js-plus
```

### 使用方式

- **编程**：`import { Watermark } from 'watermark-js-plus'`，`const wm = new Watermark(options)`，`wm.create()` 挂载，`wm.destroy()` 移除。
- **浏览器**：在页面或 SPA 里初始化；可挂到 body 或指定容器。

---

## 核心 API：Watermark、create、destroy

### Watermark(options)

创建水印实例，不立即挂载。

- **options**：见下节；常用 `content`、`width`、`height`、`rotate`、`container` 等。
- **返回值**：Watermark 实例。

### create()

将水印挂载到配置的容器（默认 body）；重复调用行为以文档为准（可能先销毁再创建）。

```javascript
const watermark = new Watermark({ content: '内部使用', width: 200, height: 200, rotate: 22 });
watermark.create();
```

### destroy()

移除水印 DOM 与监听，释放资源。

```javascript
watermark.destroy();
```

---

## 配置：content、width、height、rotate、layout

| 选项 | 说明 |
|------|------|
| **content** | 文本内容（单行）；多行或富文本见文档。 |
| **width** | 单个水印单元宽度（px），默认 200。 |
| **height** | 单个水印单元高度（px），默认 200。 |
| **rotate** | 旋转角度（度），默认 -22。 |
| **container** | 挂载的 DOM 节点，默认 document.body。 |
| **layout** | 布局模式，如 `'default'`、`'grid'`。 |
| **translatePlacement** | 平铺时的偏移方式。 |
| **zIndex** | 水印层 z-index。 |
| **alpha** | 透明度，0～1。 |
| **style** | 自定义样式对象或 CSS 字符串。 |

具体以 [watermark-js-plus 文档](https://zhensherlock.github.io/watermark-js-plus/) 为准。

---

## 水印类型：文本、图片、富文本

### watermark-js-plus 支持的四种类型（contentType）

通过 **contentType** 指定水印内容类型（不传默认 `'text'`）：

| contentType | 说明 | 常用配置 |
|-------------|------|----------|
| **text** | 单行文本（默认） | `content: '水印文字'`，可配 `fontSize`、`fontColor`、`fontFamily` 等 |
| **multi-line-text** | 多行文本 | `contentType: 'multi-line-text'`，`content` 支持换行或数组 |
| **image** | 图片水印 | `contentType: 'image'`，`image: 'url'` 或 data URL，可配 `imageWidth`、`imageHeight` |
| **rich-text** | 富文本（HTML） | `contentType: 'rich-text'`，`content` 为 HTML 字符串或 DOM，可混排文字与图片 |

### 示例

```javascript
// 单行文本（默认）
new Watermark({ content: '内部使用', width: 200, height: 200 });

// 多行文本
new Watermark({
  contentType: 'multi-line-text',
  content: '第一行\n第二行',
  fontSize: '14px',
  width: 200,
  height: 200,
});

// 图片水印
new Watermark({
  contentType: 'image',
  image: 'https://example.com/logo.png',
  width: 300,
  height: 300,
  imageWidth: 80,
});

// 富文本（HTML）
new Watermark({
  contentType: 'rich-text',
  content: '<span style="color:red">重要</span> 仅供内部',
  width: 200,
  height: 200,
});
```

### 业界常见水印分类（按实现/用途）

除库内「内容类型」外，水印还可按**实现方式**和**用途**区分：

| 分类维度 | 类型 | 说明 |
|----------|------|------|
| **按实现** | DOM 水印 | 用 div 等铺满页面，如 watermark-js-plus；易响应式、可动态更新，可被删节点 |
| | Canvas 水印 | 用 canvas 绘制文字/图再导出为图或叠在页面上；适合「给图片/PDF 加水印」 |
| | 服务端水印 | 在服务端对图片/视频/PDF 渲染时叠加水印，用户拿到已是带水印文件 |
| **按可见性** | 可见水印 | 肉眼可见的文字或 logo，防截图、标明出处 |
| | 不可见/盲水印 | 信息藏在像素或频域里，肉眼难辨，需专门提取；用于溯源、版权 |
| **按载体** | 页面水印 | 铺在网页上，防截屏、录屏；DOM 或 Canvas 实现 |
| | 图片水印 | 叠加在图片上，通常服务端或 Canvas 实现 |
| | 视频/PDF 水印 | 在视频帧或 PDF 页面上叠加，多由服务端或专用工具实现 |

**简单记**：watermark-js-plus 管的是「**页面上的可见 DOM 水印**」，内容可以是文本、多行文本、图片、富文本；要给**图片/视频/PDF 文件**加水印或做**不可见盲水印**，需用其他方案（服务端、Canvas 导出、盲水印算法等）。

### 不可见水印（盲水印）

**有**，不可见水印是真实存在的，通常叫「盲水印」（invisible / blind watermark）：肉眼几乎看不出，但通过专门算法可以提取出嵌入的信息，用于**溯源、版权、防泄密**等。

| 方面 | 说明 |
|------|------|
| **原理** | 把信息编码进载体（图片/视频/音频）的**像素低位**、**频域（DCT/DWT）**或**噪声**里，不改变肉眼观感，只有用对应密钥或算法才能解码。 |
| **常见技术** | 空域（LSB 等）、频域（DCT、DWT、傅里叶）、扩频、深度学习嵌入等。 |
| **载体** | 多为**图片**、**视频帧**、**PDF 页面**、少数场景下**音频**；网页 DOM 本身不适合做盲水印（DOM 是结构，不是像素/频域）。 |
| **谁来做** | 多为**服务端**（对图片/视频/PDF 做编码）或**专用库/算法**（如 OpenCV、各语言 steganography 库）；前端浏览器里一般不做真正的盲水印。 |
| **与 watermark-js-plus** | **不做**不可见水印；本库只做「页面上的可见 DOM 水印」。要做不可见水印需用：服务端图片/视频处理、盲水印算法库、或专业 DRM/溯源方案。 |

**总结**：不可见水印 = 盲水印，存在且常用于图片/视频溯源与版权；实现上依赖**像素/频域编码**，通常由**服务端或专用算法**完成，**watermark-js-plus 不提供**此类能力。

---

## 常见场景与最佳实践

1. **后台/内部系统**：页面加载后 `new Watermark({ content: '内部使用', ... }).create()`，降低截图外泄价值。
2. **防删**：若库支持 MutationObserver 恢复，开启后可防止简单删除水印节点。
3. **容器**：只给某块区域加水印时，传 `container: document.querySelector('#area')`。
4. **单页切换**：路由离开时 `destroy()`，进入时再 `create()`，避免重复叠加。
5. **样式**：用 `alpha`、`style` 控制不透明度与颜色，避免过重影响阅读。

---

## 参考与延伸阅读

- [watermark-js-plus 官网](https://zhensherlock.github.io/watermark-js-plus/)
- [watermark-js-plus GitHub](https://github.com/zhensherlock/watermark-js-plus)
- [watermark-js-plus npm](https://www.npmjs.com/package/watermark-js-plus)
