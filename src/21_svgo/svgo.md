# SVGO 从零开始学习指南

## 📚 目录
1. [什么是 SVGO](#什么是-svgo)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 SVGO

SVGO（SVG Optimizer）是 Node.js 里常用的 **SVG 压缩与优化工具**，通过移除冗余元数据、合并路径、简化变换等，在尽量保持视觉一致的前提下减小 SVG 体积，适合在构建管线里对图标、插画等 SVG 做自动化优化。

### 为什么选择 SVGO？
- ✅ 专门针对 SVG，压缩率和可控性都很好
- ✅ 支持 CLI 与 API，可集成到 Vite/Webpack 等构建流程
- ✅ 插件化，可开关各类优化项（如 removeViewBox、cleanupIds 等）
- ✅ 前端工程化里图标优化、静态资源压缩都会用到

### 典型场景
- 构建前/后对 `assets/*.svg`、`icons/*.svg` 做批量优化
- 与 vite-plugin-svgo、svgr 等配合，在打包时自动优化内联或引用的 SVG
- 设计稿导出的 SVG 去元数据、统一 viewBox、精简 path

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add svgo
# 或 npm install svgo
```

### 2. ESM 引入（API）

```javascript
import { optimize } from 'svgo';
```

### 3. CLI 使用

```bash
npx svgo -f ./src/icons -o ./dist/icons
npx svgo input.svg -o output.svg
```

---

## 基础用法

### 1. 单文件优化（API）

```javascript
import { optimize } from 'svgo';
import fs from 'fs';

const input = fs.readFileSync('icon.svg', 'utf8');
const result = optimize(input);
console.log(result.data);   // 优化后的 SVG 字符串
console.log(result.info);   // 如 width/height 等
console.log(result.path);   // 若传了 path
```

### 2. 带配置

```javascript
const result = optimize(input, {
  path: 'icon.svg',
  multipass: true,
  plugins: [
    'preset-default',
    { name: 'removeViewBox', fn: () => ({}) }, // 保留 viewBox 示例：关闭默认的 removeViewBox
  ],
});
```

### 3. 预设与插件

- `preset-default`：包含一整套常用插件（removeDoctype、removeComments、removeMetadata、minifyStyles 等）。
- 可在 `plugins` 数组里覆盖或增删插件，每个插件可为字符串名或 `{ name, params }` / `{ name, fn }`。

---

## 示例与组合

### 1. 批量优化目录

```javascript
import { optimize } from 'svgo';
import fs from 'fs';
import path from 'path';

const dir = 'src/icons';
const outDir = 'dist/icons';
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.svg')) continue;
  const input = fs.readFileSync(path.join(dir, name), 'utf8');
  const result = optimize(input, { path: name });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), result.data);
}
```

### 2. 与构建结合（Vite 示例）

使用 `vite-plugin-svgo` 或类似插件，在构建时对 import 的 SVG 做 optimize，具体见各插件文档。

### 3. CLI 常用参数

```bash
svgo -f ./in -o ./out           # 目录
svgo input.svg -o output.svg   # 单文件
svgo --config svgo.config.js   # 指定配置
svgo -i i.svg -o o.svg -m      # -m 多轮优化
```

### 4. 保留/删除某些属性

通过插件配置，例如保留 viewBox、统一 className、移除 fill 等，需查 SVGO 插件列表与文档（如 removeViewBox、cleanupIds、prefixIds 等）。

---

## 高级特性

### 1. 常用插件（preset-default 内含）

| 插件 | 说明 |
|------|------|
| removeDoctype / removeComments | 删 DOCTYPE、注释 |
| removeMetadata | 删 metadata |
| removeEditorsNSData | 删编辑器命名空间 |
| cleanupIds | 简化 id |
| minifyStyles | 压缩 style |
| removeViewBox | 默认移除 viewBox（有时需关掉以保留响应式） |
| 等 | 见 [SVGO 文档](https://github.com/svg/svgo) |

### 2. multipass

多次执行插件，可进一步缩小体积，耗时略增。

### 3. 自定义插件

```javascript
{
  name: 'myPlugin',
  fn: (root, params) => {
    // 遍历 AST，修改 root
    return {};
  },
}
```

---

## 最佳实践

- 图标/通用 SVG 可用 preset-default；若发现视觉异常，再逐个关掉相关插件或调参数。
- 需要响应式时，通常保留 viewBox，关闭或调整 removeViewBox。
- 在构建里用 API 或 vite-plugin-svgo 等统一处理，避免手工改大量文件。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| API 优化 | `optimize(svgString, { path, plugins })` |
| 默认预设 | `plugins: ['preset-default']` |
| 多轮 | `multipass: true` |
| CLI 目录 | `svgo -f ./in -o ./out` |
| CLI 单文件 | `svgo i.svg -o o.svg` |

---

## 参考与延伸

- [SVGO GitHub](https://github.com/svg/svgo)
- [vite-plugin-svgo](https://www.npmjs.com/package/vite-plugin-svgo) - Vite 中集成 SVGO
- [SVGO 插件列表](https://github.com/svg/svgo/blob/main/README.md) - 官方插件说明
