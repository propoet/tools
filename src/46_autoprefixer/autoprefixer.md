# autoprefixer 学习文档

> 根据目标浏览器自动给 CSS 加厂商前缀的 PostCSS 插件

## 📚 目录

1. [用大白话说：autoprefixer 是啥](#用大白话说autoprefixer-是啥)
2. [原理：PostCSS AST 与 Can I Use 数据](#原理postcss-ast-与-can-i-use-数据)
3. [安装与使用方式](#安装与使用方式)
4. [与 PostCSS、browserslist 的关系](#与-postcssbrowserslist-的关系)
5. [配置方式](#配置方式)
6. [支持的属性与示例](#支持的属性与示例)
7. [常见坑与最佳实践](#常见坑与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：autoprefixer 是啥

### 你遇到的问题（手写前缀时）

- **兼容老浏览器**：`display: flex`、`user-select`、`backdrop-filter` 等需要 `-webkit-`、`-moz-` 等前缀，不同属性、不同浏览器要加的不一样。
- **前缀会变**：浏览器更新后，有的前缀可以去掉，手写容易漏改或写多。
- **维护成本高**：要查 Can I Use、自己记哪些要加、加多少，代码又丑又难维护。

也就是说：**按「目标浏览器」自动加/删前缀**，就是 autoprefixer 要解决的问题。

### autoprefixer 帮你做啥

**autoprefixer** 是一个 **PostCSS 插件**：

1. **自动加前缀**：根据「目标浏览器」配置（browserslist），给需要的属性、值、@规则加 `-webkit-`、`-moz-`、`-ms-` 等。
2. **基于 Can I Use**：用 [Can I Use](https://caniuse.com/) 的数据决定加不加、加哪些。
3. **也会删前缀**：目标浏览器已支持无前缀写法时，会去掉多余前缀，保持输出干净。
4. **不写死浏览器**：目标通过 **browserslist**（如 `> 1%`、`last 2 versions`）配置，和 Babel、PostCSS 等共用一套。

一句话：**autoprefixer = 读你的 CSS + 读目标浏览器列表 → 自动加/删厂商前缀**，你只管写标准 CSS。

---

## 原理：PostCSS AST 与 Can I Use 数据

**核心思路**：autoprefixer 是 **PostCSS 插件**：先把 CSS 解析成 PostCSS AST，再根据「目标浏览器」和 **Can I Use** 数据，在需要加前缀的声明前插入带前缀的声明，在已无需前缀的声明上删掉多余前缀；目标浏览器来自 **browserslist** 配置。

- **解析与遍历**：PostCSS 把 CSS 解析成 AST（Rule、Declaration、AtRule 等）；autoprefixer 在 Declaration 上工作，根据属性名、属性值查「该属性/值在哪些浏览器需要前缀」。
- **Can I Use**：用 caniuse 数据库（或内置的 Browserslist 兼容数据）判断「某属性在 Chrome 50、Safari 12 等是否需要 -webkit-」；browserslist 把「> 1%」等转成具体浏览器版本列表，autoprefixer 只对目标列表里的浏览器加前缀。
- **加/删规则**：需要前缀时，在当前 Declaration 前插入一条或多条带前缀的 Declaration；目标浏览器已支持无前缀时，可配置移除多余前缀，保持输出干净。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D autoprefixer postcss
# 或
npm i -D autoprefixer postcss
```

- **PostCSS**：autoprefixer 是 PostCSS 的插件，构建链路里要有 PostCSS；Vite、Webpack、Tailwind 等通常已带 PostCSS，只需加 autoprefixer 插件即可。

### 使用方式

- **不单独运行**：不提供 CLI，只在 **PostCSS 管线**里作为插件使用。
- **在 PostCSS 配置里**：在 `postcss.config.js` 或构建工具（Vite/Webpack）的 PostCSS 配置里加入 `autoprefixer`。

---

## 与 PostCSS、browserslist 的关系

| 角色 | 作用 |
|------|------|
| **PostCSS** | 用 JS 转换 CSS 的引擎，按插件顺序处理 CSS；autoprefixer 是其中一个插件。 |
| **autoprefixer** | 根据目标浏览器给 CSS 加/删前缀；目标浏览器来自 browserslist。 |
| **browserslist** | 定义「目标浏览器」的配置（如 `> 1%`、`last 2 versions`），可放在 package.json、.browserslistrc 等；被 autoprefixer、Babel 等共用。 |

**简单记**：  
- 你用 **browserslist** 说「要兼容哪些浏览器」。  
- **autoprefixer** 在 **PostCSS** 里读这份配置，对 CSS 做前缀的加/删。

---

## 配置方式

### 1. PostCSS 配置（postcss.config.js）

在项目根目录建 `postcss.config.js`（或 .cjs / .mjs）：

```javascript
module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
```

- 若用 **postcss-load-config**，也会自动读该文件；Vite、Vue CLI、Next 等默认会读。

### 2. 在 Vite 里配 PostCSS

Vite 会读根目录的 `postcss.config.js`；也可在 `vite.config.ts` 里显式写：

```typescript
import { defineConfig } from 'vite';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
});
```

### 3. 目标浏览器：browserslist

autoprefixer 会读 **browserslist** 的配置，常见两种写法：

**方式一：package.json**

```json
{
  "browserslist": [
    "defaults",
    "not IE 11"
  ]
}
```

**方式二：.browserslistrc（项目根目录）**

```text
# 支持的浏览器
defaults
not IE 11
```

**常用查询示例**：

| 查询 | 含义 |
|------|------|
| **defaults** | 等价于 > 0.5%, last 2 versions, Firefox ESR, not dead |
| **> 1%** | 全球使用率 > 1% 的浏览器 |
| **last 2 versions** | 各浏览器最近 2 个版本 |
| **not dead** | 排除官方已不再维护的浏览器 |
| **not IE 11** | 排除 IE 11 |
| **Chrome >= 80** | 指定 Chrome 80+ |

**查看当前生效的浏览器列表**：

```bash
npx browserslist
```

### 4. autoprefixer 的选项（可选）

在插件里传配置对象，例如：

```javascript
module.exports = {
  plugins: {
    autoprefixer: {
      grid: true,        // 为 Grid 布局加 IE 所需前缀
      overrideBrowserslist: ['> 1%', 'last 2 versions'], // 覆盖 browserslist，一般不推荐，优先用 browserslist 统一配
    },
  },
};
```

- **overrideBrowserslist**：可覆盖从环境读到的 browserslist，但建议统一用 package.json 或 .browserslistrc，方便 Babel 等共用。

---

## 支持的属性与示例

### 会加前缀的常见类型

- **Flexbox**：`display: flex`、`flex`、`align-items` 等  
- **Grid**：`display: grid`、`grid-template-columns` 等（需目标含旧版浏览器且 `grid: true`）  
- **过渡与动画**：`transition`、`animation`、`transform`  
- **其他**：`user-select`、`appearance`、`backdrop-filter`、`mask`、`clip-path` 等  

具体以 [Can I Use](https://caniuse.com/) 为准，autoprefixer 按目标浏览器自动判断。

### 输入 / 输出示例

**输入（标准 CSS）**：

```css
.box {
  display: flex;
  user-select: none;
  backdrop-filter: blur(10px);
}
```

**输出（目标含较老 WebKit 时）**：

```css
.box {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
  -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
}
```

- 目标浏览器越新，输出越接近「无前缀」；目标含 IE 或老版本时，会多出 `-ms-`、`-webkit-` 等。

---

## 常见坑与最佳实践

1. **用 browserslist 配目标**：不要再在 autoprefixer 里写死 `overrideBrowserslist`（除非有特殊需求），统一用 package.json 或 .browserslistrc，和 Babel 等一致。
2. **不要用已废弃的 browsers 选项**：旧版 autoprefixer 的 `browsers` 选项已废弃，若看到「Replace Autoprefixer browsers option to Browserslist config」警告，删掉 `browsers`，改用 browserslist 即可。
3. **插件顺序**：PostCSS 里若有多个插件，一般把 autoprefixer 放在**后面**（先做其他转换，最后加前缀），具体看是否依赖其它插件输出。
4. **Tailwind 项目**：Tailwind 3+ 自带 PostCSS，且通常已包含 autoprefixer；若已能正确加前缀，可不重复配置。
5. **Grid 兼容 IE**：要兼容 IE 10/11 的 Grid，需在 autoprefixer 里开启 `grid: true`，并保证 browserslist 包含这些浏览器。
6. **在线调试**：可用 [Autoprefixer CSS Online](https://autoprefixer.github.io/) 贴 CSS 看输出，验证目标浏览器下的效果。

---

## 参考与延伸阅读

- [autoprefixer GitHub](https://github.com/postcss/autoprefixer)
- [Autoprefixer 在线](https://autoprefixer.github.io/)
- [PostCSS](https://postcss.org/)
- [Browserslist](https://github.com/browserslist/browserslist)
- [Can I Use](https://caniuse.com/)

---

**文档版本**：针对 autoprefixer 当前用法与 browserslist 配置整理；具体支持属性以 Can I Use 与官方文档为准。
