# theme-colors 学习文档

> 根据一个基色生成 11 档色阶（50～950）的工具库，灵感来自 Tailwind 色板，UnJS 维护

## 📚 目录

1. [用大白话说：theme-colors 是啥](#用大白话说theme-colors-是啥)
2. [原理：色阶如何生成](#原理色阶如何生成)
3. [与 Tailwind、设计系统的关系](#与-tailwind设计系统的关系)
4. [安装与使用方式](#安装与使用方式)
5. [核心 API：getColors](#核心-apigetcolors)
6. [输入格式：hex、RGB](#输入格式hexrgb)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：theme-colors 是啥

### 你遇到的问题（做主题色板时）

- **需要多档深浅**：设计系统或 UI 库常用 50、100、200…900、950 等多档色阶，手算或手写很麻烦。
- **只给一个主色**：希望只指定一个基色（如品牌主色），自动生成整条色阶，保证视觉一致。
- **零依赖、可编程**：希望在 Node 或构建脚本里生成，不绑死框架，输出可写进 CSS 变量或配置文件。

也就是说：**在「从一个基色生成整条色阶」这件事上，提供简单、可编程的 API**，就是 theme-colors 要解决的问题。

### theme-colors 帮你做啥

**theme-colors**（[UnJS](https://unjs.io/) 维护）是一个 **色阶生成工具**：

1. **getColors(baseColor)**：传入一个基色（hex 或 RGB），返回 11 档色阶对象：`50`、`100`、`200`、`300`、`400`、`500`、`600`、`700`、`800`、`900`、`950`。
2. **输入格式**：支持 hex（如 `#3B82F6`）或 RGB 字符串（如 `59, 130, 246`）。
3. **零依赖**：无运行时依赖，适合 Node 与构建环境。
4. **TypeScript**：内置类型声明。

一句话：**theme-colors = 输入一个基色 → 输出 11 档色阶对象**，便于做主题、设计系统或接 Tailwind。

---

## 原理：色阶如何生成

- **Tailwind 风格**：色阶 50 最浅、500 通常为「主色」、950 最深；库内部按亮度/饱和度等算法从基色推导各档，保证过渡自然。
- **输出结构**：返回对象 key 为 `'50'`～`'950'`，value 为 hex 字符串（如 `#eff6ff`），可直接用于 CSS 变量或 Tailwind 配置。
- **无副作用**：纯函数，不读文件、不写 DOM，只做颜色计算。

---

## 与 Tailwind、设计系统的关系

| 角色 | 作用 |
|------|------|
| **theme-colors** | 从单色生成 11 档色阶；不依赖 Tailwind，输出可写入 tailwind.config 或 CSS 变量。 |
| **Tailwind** | 预设多套色板（如 blue-500）；可配合 theme-colors 动态生成自定义色板再写入 theme.extend.colors。 |
| **设计系统** | 主色 + theme-colors 可生成完整色板，再导出为 CSS 变量或设计令牌。 |

**简单记**：theme-colors 负责「色阶生成」；Tailwind/设计系统负责「使用这些颜色」。

---

## 安装与使用方式

### 安装

```bash
pnpm add theme-colors
# 或
npm i theme-colors
```

### 使用方式

- **编程**：`import { getColors } from 'theme-colors'`，`const colors = getColors('#3B82F6')`，得到 `{ 50: '...', 100: '...', ..., 950: '...' }`。
- **Node / 构建**：在脚本里生成色板，写入 CSS 变量或 tailwind 配置。

---

## 核心 API：getColors

### getColors(baseColor)

根据基色生成 11 档色阶。

- **baseColor**：字符串，hex（`#3B82F6`）或 RGB（`59, 130, 246`）。
- **返回值**：对象，key 为 `'50'`、`'100'`、…、`'950'`，value 为 hex 字符串。

```javascript
import { getColors } from 'theme-colors';

const blue = getColors('#3B82F6');
console.log(blue[50]);   // 最浅
console.log(blue[500]);  // 主色档
console.log(blue[950]);  // 最深
```

---

## 输入格式：hex、RGB

- **hex**：`'#3B82F6'`、`'#abc'`（简写）等。
- **RGB**：`'59, 130, 246'`（逗号分隔，无 `rgb()` 包裹），库会按 RGB 计算色阶。

---

## 常见场景与最佳实践

1. **Tailwind 扩展**：`getColors('#xxx')` 得到对象，写入 `tailwind.config.js` 的 `theme.extend.colors.primary`。
2. **CSS 变量**：遍历 `getColors('#xxx')`，生成 `--color-primary-50`～`--color-primary-950`。
3. **设计系统**：主色由设计给出，构建时用 theme-colors 生成色板，再导出为 JSON/SCSS 等。
4. **单色主题**：只改一个主色即可整站色阶联动，便于换肤。

---

## 参考与延伸阅读

- [theme-colors npm](https://www.npmjs.com/package/theme-colors)
- [theme-colors GitHub](https://github.com/unjs/theme-colors)
- [Tailwind 颜色](https://tailwindcss.com/docs/customizing-colors)
