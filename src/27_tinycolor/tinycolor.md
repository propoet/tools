# @ctrl/tinycolor 从零开始学习指南

## 📚 目录
1. [什么是 @ctrl/tinycolor](#什么是-ctrltinycolor)
2. [原理：颜色空间与解析流程](#原理颜色空间与解析流程)
3. [安装与引入](#安装与引入)
3. [输入格式与解析](#输入格式与解析)
4. [输出格式与转换](#输出格式与转换)
5. [属性与校验](#属性与校验)
6. [颜色修改方法](#颜色修改方法)
7. [配色与关系色](#配色与关系色)
8. [工具函数](#工具函数)
9. [最佳实践与参考](#最佳实践与参考)

---

## 什么是 @ctrl/tinycolor

**@ctrl/tinycolor** 是用于**颜色解析、转换与操作**的 TypeScript/JavaScript 库，是 [tinycolor2](https://github.com/bgrins/TinyColor) 的现代分支，支持多种输入格式、多种输出格式，以及变亮、变暗、饱和度、色相旋转、配色方案等操作。

### 为什么选择 @ctrl/tinycolor？
- ✅ 输入宽松：支持 hex、rgb、hsl、hsv、cmyk、颜色名、数字等
- ✅ 输出丰富：toHex、toRgb、toHsl、toHsv、toCmyk、toName 等
- ✅ 链式操作：lighten、darken、saturate、spin、tint、shade 等返回新 TinyColor
- ✅ TypeScript 支持，支持 tree-shaking
- ✅ 体积小，无依赖
- ✅ 工具函数：readability、mostReadable、random、fromRatio 等

### 典型场景
- 主题/主题色生成（变亮、变暗、饱和度）
- 颜色格式转换（hex ↔ rgb ↔ hsl）
- 配色方案（triad、tetrad、analogous、monochromatic）
- 可读性判断（isReadable、mostReadable）
- 与 Chalk、CSS、Canvas 等配合使用

---

## 原理：颜色空间与解析流程

**核心思路**：颜色有多种表示方式（hex、rgb、hsl、hsv、cmyk 等），本质都是对「光的三原色 + 透明度」的不同编码。tinycolor 在内部统一成一种中间表示（通常是 0–255 的 R/G/B 和 0–1 的 alpha），再据此做解析、转换和运算。

- **解析流程**：输入字符串或对象 → 用正则或类型判断识别格式（hex/rgb/hsl/颜色名等）→ 按该格式规则解析出数值 → 归一化到内部表示（如 RGB 0–255、alpha 0–1）。
- **颜色空间**：RGB 是设备/屏幕常用；HSL/HSV 把「色相 H、饱和度 S、明度 L 或亮度 V」分离，便于做 lighten/darken/saturate/spin 等操作（改 L/V 即调明暗，改 H 即旋转色相）。
- **输出与操作**：内部始终维护同一份数据，toHex/toRgb/toHsl 只是对同一数据做不同公式换算；lighten/darken 等先转 HSL，改 L 再转回 RGB，保证链式调用结果一致且可预测。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add @ctrl/tinycolor
# 或 npm install @ctrl/tinycolor
```

### 2. ESM 引入

```javascript
import { TinyColor } from '@ctrl/tinycolor';

const color = new TinyColor('red');
console.log(color.toHexString()); // '#ff0000'
```

### 3. 工具函数（按需引入）

```javascript
import { TinyColor, random, fromRatio, isReadable, mostReadable } from '@ctrl/tinycolor';
```

---

## 输入格式与解析

### 支持的输入类型

| 类型 | 示例 |
|------|------|
| **Hex** | `'#000'`、`'#f0f0f6'`、`'#f0f0f688'`（带 alpha） |
| **RGB/RGBA** | `'rgb(255, 0, 0)'`、`{ r: 255, g: 0, b: 0, a: 0.5 }` |
| **HSL/HSLA** | `'hsl(0, 100%, 50%)'`、`{ h: 0, s: 100, l: 50 }` |
| **HSV** | `{ h: 0, s: 100, v: 100 }` |
| **CMYK** | `'cmyk(0, 25, 20, 0)'` |
| **颜色名** | `'red'`、`'blanchedalmond'` |
| **数字** | `0xaabbcc` |

### 创建实例

```javascript
import { TinyColor } from '@ctrl/tinycolor';

// 字符串
new TinyColor('#ff0000');
new TinyColor('red');
new TinyColor('rgb(255, 0, 0)');
new TinyColor('hsl(0, 100%, 50%)');

// 对象
new TinyColor({ r: 255, g: 0, b: 0 });
new TinyColor({ h: 0, s: 100, l: 50 });

// 数字
new TinyColor(0xff0000);
```

### 解析失败

若输入无法解析，实例的 **isValid** 为 `false`，后续转换可能得到不可预期结果，使用前建议判断 `color.isValid`。

---

## 输出格式与转换

### 常用输出方法

| 方法 | 说明 | 示例 |
|------|------|------|
| **toHexString()** | 带 `#` 的六位 hex | `'#ff0000'` |
| **toHex(allow3Char?)** | 无 `#` 的 hex，可选 3 位短写 | `'ff0000'` |
| **toHex8String(allow4Char?)** | 带 `#` 的 8 位 hex（含 alpha） | `'#ff0000ff'` |
| **toRgb()** | RGBA 对象 | `{ r: 255, g: 0, b: 0, a: 1 }` |
| **toRgbString()** | `rgba(r, g, b, a)` 字符串 | `'rgba(255, 0, 0, 1)'` |
| **toHsl()** | HSLA 对象 | `{ h: 0, s: 100, l: 50, a: 1 }` |
| **toHslString()** | `hsla(...)` 字符串 | `'hsla(0, 100%, 50%, 1)'` |
| **toHsv()** | HSVA 对象 | `{ h: 0, s: 100, v: 100, a: 1 }` |
| **toHsvString()** | `hsva(...)` 字符串 | `'hsva(0, 100%, 100%, 1)'` |
| **toCmyk()** | CMYK 对象 | `{ c: 0, m: 100, y: 100, k: 0 }` |
| **toCmykString()** | `cmyk(...)` 字符串 | `'cmyk(0, 100, 100, 0)'` |
| **toName()** | 颜色名（若有） | `'red'` 或 `false` |
| **toNumber()** | 数字（0xRRGGBB） | `16711680` |

### 示例

```javascript
import { TinyColor } from '@ctrl/tinycolor';

const c = new TinyColor('#ff0000');

c.toHexString();    // '#ff0000'
c.toRgbString();    // 'rgba(255, 0, 0, 1)'
c.toHslString();    // 'hsla(0, 100%, 50%, 1)'
c.toRgb();          // { r: 255, g: 0, b: 0, a: 1 }
c.toHsl();          // { h: 0, s: 100, l: 50, a: 1 }
c.toName();         // 'red'
```

---

## 属性与校验

### 实例属性

| 属性 | 类型 | 说明 |
|------|------|------|
| **r, g, b** | number | 红、绿、蓝（0–255） |
| **a** | number | 透明度（0–1） |
| **format** | string | 解析时识别的格式（如 `'hex'`、`'rgb'`） |
| **originalInput** | ColorInput | 原始输入 |
| **isValid** | boolean | 是否解析成功 |

### 判断与亮度

| 方法 | 说明 |
|------|------|
| **getAlpha()** | 返回 alpha（0–1） |
| **getBrightness()** | 感知亮度（0–255） |
| **getLuminance()** | 感知亮度（0–1） |
| **isDark()** | 是否偏暗 |
| **isLight()** | 是否偏亮 |
| **isMonochrome()** | 是否单色（灰） |
| **equals(color)** | 与另一颜色是否相等 |

### 示例

```javascript
const c = new TinyColor('#333');
c.isValid;           // true
c.getBrightness();   // 约 51
c.getLuminance();    // 约 0.05
c.isDark();          // true
c.isLight();         // false
c.equals('#333333'); // true
```

---

## 颜色修改方法

以下方法**返回新的 TinyColor 实例**，不修改原实例。

### 明暗与饱和度

| 方法 | 说明 | 参数 |
|------|------|------|
| **lighten(amount?)** | 变亮 | amount 1–100，默认 10 |
| **darken(amount?)** | 变暗 | amount 1–100，默认 10 |
| **brighten(amount?)** | 变亮（算法与 lighten 不同） | amount 1–100，默认 10 |
| **saturate(amount?)** | 提高饱和度 | amount 1–100，默认 10 |
| **desaturate(amount?)** | 降低饱和度 | amount 1–100，默认 10 |
| **greyscale()** | 完全去饱和（灰） | 无 |
| **tint(amount?)** | 与白色混合 | amount 1–100，默认 10 |
| **shade(amount?)** | 与黑色混合 | amount 1–100，默认 10 |

### 色相与混合

| 方法 | 说明 | 参数 |
|------|------|------|
| **spin(amount)** | 色相旋转（度） | -360 ～ 360 |
| **mix(color, amount?)** | 与另一颜色混合 | color：ColorInput，amount 0–100，默认 50 |
| **setAlpha(alpha)** | 设置透明度 | 0–1，返回 this |
| **clone()** | 克隆当前颜色 | 无 |

### 示例

```javascript
import { TinyColor } from '@ctrl/tinycolor';

const c = new TinyColor('#ff0000');

c.lighten(20).toHexString();   // 更亮的红
c.darken(20).toHexString();   // 更暗的红
c.saturate(20).toHexString(); // 更饱和
c.greyscale().toHexString();  // 灰色
c.spin(120).toHexString();    // 色相旋转 120°（如变绿）
c.tint(50).toHexString();    // 与白混合 50%
c.shade(50).toHexString();    // 与黑混合 50%
c.mix('#00ff00', 50).toHexString(); // 与绿混合 50%
c.clone().setAlpha(0.5).toRgbString(); // 克隆并设透明度
```

---

## 配色与关系色

以下方法返回 **TinyColor 数组**，用于配色方案。

| 方法 | 说明 | 参数/返回值 |
|------|------|-------------|
| **complement()** | 补色（一个） | 返回一个 TinyColor |
| **triad()** | 三色组 | 3 个 TinyColor |
| **tetrad()** | 四色组（等同 polyad(4)） | 4 个 TinyColor |
| **splitcomplement()** | 分裂补色 | 3 个 TinyColor |
| **analogous(results?, slices?)** | 近似色 | results 默认 6，slices 默认 30 |
| **monochromatic(results?)** | 单色深浅 | results 默认 6 |
| **polyad(n)** | n 色组（1=单色, 2=双色, 3=triad, 4=tetrad…） | n 个 TinyColor |

### 示例

```javascript
const c = new TinyColor('#ff0000');

c.complement().toHexString();       // 补色
c.triad().map(t => t.toHexString());    // 三色组
c.tetrad().map(t => t.toHexString());   // 四色组
c.analogous(6, 30).map(t => t.toHexString()); // 近似色 6 个
c.monochromatic(5).map(t => t.toHexString());  // 单色 5 档
```

### 叠加背景

**onBackground(background)**：计算当前色在给定背景上的「看起来」颜色（考虑混合），返回新的 TinyColor。

```javascript
c.onBackground('#ffffff').toRgbString();
```

---

## 工具函数

这些函数从包内直接导入，不属于 TinyColor 实例方法。

### random()

生成随机颜色。

```javascript
import { random } from '@ctrl/tinycolor';

const c = random();
c.toHexString(); // 如 '#a1b2c3'
```

### fromRatio(obj)

从 0–1 比例的对象创建颜色（如 `{ r: 1, g: 0, b: 0 }`）。

```javascript
import { fromRatio } from '@ctrl/tinycolor';

const c = fromRatio({ r: 1, g: 0, b: 0 });
c.toHexString(); // '#ff0000'
```

### inputToRGB(input)

将任意 ColorInput 转为 RGB 对象（内部格式），一般不直接使用，用 `new TinyColor(input)` 即可。

### isReadable(color1, color2, options?)

判断两色对比是否满足可读性（如 WCAG）。

```javascript
import { TinyColor, isReadable } from '@ctrl/tinycolor';

isReadable('#000', '#fff');  // true
isReadable('#333', '#444');  // false
```

### mostReadable(base, colorList, options?)

在给定背景色下，从颜色列表中选出最易读的一个。

```javascript
import { mostReadable } from '@ctrl/tinycolor';

const base = new TinyColor('#fff');
const list = ['#000', '#333', '#666', '#999'];
const best = mostReadable(base, list);
// 返回对比度最好的那个 TinyColor
```

### 转换函数（按需使用）

- **rgbToHex**、**rgbToHsl**、**rgbToHsv**、**rgbToCmyk**
- **hslToRgb**、**hsvToRgb**、**cmykToRgb**
- **convertDecimalToHex**、**convertHexToDecimal**、**parseIntFromHex**
- **isValidCSSUnit**、**toMsFilter**（IE 滤镜用）

---

## 最佳实践与参考

### 实践建议

1. **先判断 isValid**：解析用户输入或外部数据时，用 `color.isValid` 再继续。
2. **链式不修改原实例**：lighten、darken、mix 等返回新实例，原色不变。
3. **需要字符串时**：用 toHexString、toRgbString 等，便于写 CSS 或 Chalk。
4. **主题色扩展**：用 lighten/darken/tint/shade 生成一组主题色。
5. **可读性**：做 UI 时用 isReadable、mostReadable 选文字/背景组合。

### 速查表

| 需求 | 写法 |
|------|------|
| 解析颜色 | `new TinyColor(input)` |
| 转 hex 字符串 | `color.toHexString()` |
| 转 rgb 字符串 | `color.toRgbString()` |
| 变亮/变暗 | `color.lighten(20)` / `color.darken(20)` |
| 饱和度 | `color.saturate(20)` / `color.desaturate(20)` / `color.greyscale()` |
| 与白/黑混合 | `color.tint(50)` / `color.shade(50)` |
| 色相旋转 | `color.spin(120)` |
| 与另一色混合 | `color.mix(other, 50)` |
| 补色/三色/四色 | `color.complement()` / `color.triad()` / `color.tetrad()` |
| 近似色/单色系 | `color.analogous(6)` / `color.monochromatic(5)` |
| 随机色 | `random()` |
| 可读性 | `isReadable(c1, c2)` / `mostReadable(base, list)` |

### 参考链接

- [npm @ctrl/tinycolor](https://www.npmjs.com/package/@ctrl/tinycolor)
- [TinyColor 文档与 Demo](https://tinycolor.vercel.app/)
- [API 文档（Classes / Functions）](https://tinycolor.vercel.app/docs/modules.html)
- [W3C CSS Color](https://www.w3.org/TR/css-color/)
- 本目录 **1.base.js** — 可直接运行的入门示例
