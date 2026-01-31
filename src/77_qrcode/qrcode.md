# qrcode 学习文档

> Node.js 与浏览器可用的 QR 码/二维码生成库，支持 PNG、SVG、UTF-8 终端输出

## 📚 目录

1. [用大白话说：qrcode 是啥](#用大白话说qrcode-是啥)
2. [原理：QR 码编码与输出格式](#原理qr-码编码与输出格式)
3. [安装与使用方式](#安装与使用方式)
4. [核心 API：toDataURL、toCanvas、toString、create](#核心-apitodataurltocanvastostringcreate)
5. [选项：纠错级别、尺寸、颜色](#选项纠错级别尺寸颜色)
6. [CLI 与常见场景](#cli-与常见场景)
7. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：qrcode 是啥

### 你遇到的问题（要生成二维码时）

- **把链接/文本变成二维码**：用户扫码即可打开链接或看到文本，需要服务端或前端生成 QR 码图片。
- **多端一致**：希望在 Node 服务端和浏览器里用同一套 API，输出 PNG、SVG 或终端可显示的字符。
- **可配置**：纠错级别、尺寸、颜色、边距等需要可调，以适配不同场景。

也就是说：**在「把字符串/URL 转成 QR 码图像或字符」这件事上，提供跨端、多格式的 API**，就是 qrcode 要解决的问题。

### qrcode 帮你做啥

**qrcode**（node-qrcode）是一个 **QR 码生成库**：

1. **多格式输出**：PNG（DataURL 或 Buffer）、SVG 字符串、UTF-8 字符（终端显示）、Canvas 绘制。
2. **Node 与浏览器**：同一套 API，在 Node 中可写文件或返回 Buffer，在浏览器中可画到 Canvas 或转 DataURL 给 `<img>`。
3. **编码与纠错**：支持数字、字母数字、字节、汉字等；纠错级别 L/M/Q/H 可配置，便于在部分损坏时仍可识别。
4. **CLI**：命令行可直接生成并保存二维码图片。

一句话：**qrcode = 输入字符串 → 按选项生成 QR 矩阵 → 输出 PNG/SVG/UTF-8/Canvas**，跨端可用。

---

## 原理：QR 码编码与输出格式

- **QR 码规范**：按 QR 码标准把文本编码成黑白矩阵（模块），再根据纠错级别加入纠错码；库内部完成编码与矩阵生成。
- **输出层**：同一矩阵可渲染为 PNG（像素图）、SVG（矢量）、UTF-8 字符（▀▄ 等）、或画到 Canvas；你选格式即可。
- **纠错**：L（约 7%）、M（约 15%）、Q（约 25%）、H（约 30%）表示可恢复的损坏比例，级别越高码图越密。

---

## 安装与使用方式

### 安装

```bash
pnpm add qrcode
# 或
npm i qrcode
```

### 使用方式

- **编程**：`import QRCode from 'qrcode'`，调用 `toDataURL`、`toCanvas`、`toString`、`create` 等。
- **CLI**：`npx qrcode "https://example.com" -o out.png`（见官方文档）。

---

## 核心 API：toDataURL、toCanvas、toString、create

### toDataURL(text[, options])

返回 Promise\<string\>，为 Data URL（`data:image/png;base64,...`），可直接赋给 `<img src>` 或保存。

```javascript
import QRCode from 'qrcode';

const url = await QRCode.toDataURL('https://example.com', { width: 200 });
console.log(url); // data:image/png;base64,...
```

### toCanvas(canvas, text[, options])

在已有 Canvas 元素上绘制二维码，浏览器或 node-canvas 可用。

```javascript
await QRCode.toCanvas(canvasElement, 'https://example.com', { width: 200 });
```

### toString(text[, options])

返回 Promise\<string\>，为 UTF-8 字符绘制的二维码，适合终端输出。

```javascript
const str = await QRCode.toString('Hello', { type: 'terminal' });
console.log(str);
```

### toFile / toFileSync(path, text[, options])

将二维码写入文件（Node 环境），如 PNG 文件。

```javascript
await QRCode.toFile('./qrcode.png', 'https://example.com', { width: 256 });
```

### create(text[, options])

返回 Promise\<QRCodeSegment[]\> 或矩阵数据，用于自定义渲染；一般用 toDataURL/toCanvas 即可。

---

## 选项：纠错级别、尺寸、颜色

常用选项（以官方文档为准）：

| 选项 | 说明 |
|------|------|
| **errorCorrectionLevel** | `'L' \| 'M' \| 'Q' \| 'H'`，纠错级别，默认 `'M'` |
| **width** | 输出图像宽度（像素），默认自动 |
| **margin** | 白边宽度（模块数），默认 4 |
| **color.dark** | 前景色，默认 `#000000` |
| **color.light** | 背景色，默认 `#ffffff` |
| **type** | `'png' \| 'svg' \| 'utf8'` 等，输出类型 |

---

## CLI 与常见场景

- **CLI**：`qrcode <内容> [-o 输出文件]`，可指定格式、尺寸等（见 `qrcode --help`）。
- **场景**：登录页展示绑定二维码、生成签到/票据二维码、终端工具输出短链接二维码等。

---

## 参考与延伸阅读

- [qrcode npm](https://www.npmjs.com/package/qrcode)
- [node-qrcode GitHub](https://github.com/soldair/node-qrcode)
