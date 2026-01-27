# dotenv-cli 从零开始学习指南

## 📚 目录
1. [什么是 dotenv-cli](#什么是-dotenv-cli)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 dotenv-cli

dotenv-cli 是一个**在命令行里加载 .env 再执行后续命令**的工具，不写代码就能“带环境变量跑脚本”，适合在 npm scripts、CI、本地调试里用。

### 为什么选择 dotenv-cli？
- ✅ 不改业务代码，在“命令前”注入 .env
- ✅ 支持指定 .env 文件（如 `.env.production`）
- ✅ 可与 cross-env、npm-run-all 等一起用在 scripts 里

### 与 dotenv 的区别
- **dotenv**：在 **Node 代码里** `import 'dotenv/config'` 或 `dotenv.config()`，从 .env 加载到 process.env。
- **dotenv-cli**：在 **命令行** 里先加载 .env，再执行后面的命令（如 `dotenv -e .env -- node app.js`），进程一启动就有这些变量。

### 典型场景
- `"dev": "dotenv -e .env.local -- vite"`
- CI 里用 `dotenv -e .env.production -- node build.js`
- 本地快速切换 `.env.development` / `.env.test` 跑不同环境

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add -D dotenv-cli
# 或 npm install -D dotenv-cli
```

### 2. 使用方式

dotenv-cli 是 **CLI**，只在命令行或 package.json scripts 里调用，不在业务代码里 `import`：

```bash
dotenv -e .env -- node app.js
# 或
npx dotenv -e .env -- node app.js
```

---

## 基础用法

### 1. 加载默认 .env 再执行命令

```bash
dotenv -- node app.js
```

会从当前目录找 `.env`，加载后执行 `node app.js`。

### 2. 指定 .env 文件（-e / --env）

```bash
dotenv -e .env.local -- node app.js
dotenv -e .env.production -- pnpm run build
```

### 3. 在 package.json scripts 里用

```json
{
  "scripts": {
    "dev": "dotenv -e .env.local -- vite",
    "build": "dotenv -e .env.production -- vite build",
    "test": "dotenv -e .env.test -- jest"
  }
}
```

---

## 示例与组合

### 1. 多个 .env 文件（按顺序）

部分版本支持多个 `-e`，后加载的覆盖先加载的同名变量：

```bash
dotenv -e .env -e .env.local -- node app.js
```

以官方文档为准。

### 2. 与 cross-env 一起用

先 dotenv 从文件注入，再 cross-env 覆盖或补充环境变量：

```json
"build": "dotenv -e .env.production -- cross-env NODE_ENV=production vite build"
```

### 3. 不覆盖已有环境变量

dotenv-cli 默认是否会覆盖已存在的环境变量，取决于实现；若需“只补充、不覆盖”，要看是否支持类似 dotenv 的 override: false 的选项（以文档为准）。多数用法是“进程启动时还没有这些变量”，由 dotenv-cli 注入。

---

## 高级特性

### 1. 常用参数

| 参数 | 说明 |
|------|------|
| `-e <file>` / `--env=<file>` | 指定 .env 文件路径 |
| `--` | 其后为要执行的命令（必需） |
| 其他 | 见 `dotenv --help` |

### 2. 与 dotenv 在代码里用的选择

- **业务代码里**已经 `import 'dotenv/config'`：  
  - 本地/CI 仍可用 `dotenv -e .env.xxx -- node app.js` 指定不同文件，且一般会在 Node 启动前就注入，代码里的 dotenv 会再加载一份（若路径相同会重复，通常无妨；若希望“只用 CLI 的”，可不在代码里调 dotenv）。
- **不想改代码**、只在 scripts/CI 里带环境变量：  
  - 用 dotenv-cli 即可，业务代码不 import dotenv。

---

## 最佳实践

- 敏感信息不要提交到仓库，.env 加 .gitignore；CI 里用“密钥/变量” + dotenv-cli 的 `-e` 或环境变量注入。
- scripts 里统一用 `dotenv -e .env.环境名 -- 命令`，便于不同环境复用同一套脚本。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 默认 .env | `dotenv -- node app.js` |
| 指定文件 | `dotenv -e .env.prod -- node app.js` |
| 在 scripts | `"dev": "dotenv -e .env.local -- vite"` |

---

## 参考与延伸

- [dotenv-cli npm](https://www.npmjs.com/package/dotenv-cli)
- [dotenv](https://github.com/motdotla/dotenv) - 代码内加载 .env
- [cross-env](https://www.npmjs.com/package/cross-env) - 跨平台设环境变量
