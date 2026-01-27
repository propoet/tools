# cross-env 从零开始学习指南

## 📚 目录
1. [什么是 cross-env](#什么是-cross-env)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 cross-env

cross-env 是一个**跨平台设置环境变量的 CLI 工具**，在 npm scripts 里用统一写法设置 `NODE_ENV`、`BABEL_ENV` 等，避免在 Windows 上因 `SET NODE_ENV=production` 与 Unix 的 `NODE_ENV=production` 写法不同导致脚本无法复用。

### 为什么选择 cross-env？
- ✅ 一套写法，Windows / macOS / Linux 都能用
- ✅ 只做“设环境变量再执行命令”，不改业务代码
- ✅ 通常作为 devDependency 装在项目里，在 npm scripts 里用

### 典型场景
- `"build": "cross-env NODE_ENV=production webpack"`
- `"test": "cross-env NODE_ENV=test jest"`
- 团队里有人用 Windows、有人用 Unix，scripts 里统一用 cross-env 避免平台差异

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add -D cross-env
# 或 npm install -D cross-env / yarn add -D cross-env
```

### 2. 使用方式

cross-env 是 **CLI 工具**，不写 `import`，只在 **package.json 的 scripts** 或命令行里调用：

```bash
cross-env NODE_ENV=production node build.js
```

---

## 基础用法

### 1. 在 package.json scripts 里用

```json
{
  "scripts": {
    "build": "cross-env NODE_ENV=production webpack",
    "dev": "cross-env NODE_ENV=development webpack serve",
    "test": "cross-env NODE_ENV=test jest"
  }
}
```

### 2. 多个环境变量

```json
"build": "cross-env NODE_ENV=production API_URL=https://api.example.com node build.js"
```

或：

```bash
cross-env NODE_ENV=production API_URL=https://api.example.com node build.js
```

### 3. 带空格的变量值

在 Unix 下需加引号，cross-env 统一处理：

```json
"script": "cross-env MESSAGE=\"hello world\" node run.js"
```

---

## 示例与组合

### 1. 与 Vite/Webpack 等结合

```json
"build": "cross-env NODE_ENV=production vite build",
"dev": "cross-env NODE_ENV=development vite"
```

### 2. 与 Jest/Vitest 结合

```json
"test": "cross-env NODE_ENV=test jest",
"test:ci": "cross-env CI=true jest --ci"
```

### 3. 与 dotenv 等一起用

cross-env 只负责“设环境变量再执行命令”；若脚本里再用 `dotenv.config()`，会先有 cross-env 设的变量，再被 .env 覆盖（除非 dotenv 设了 override: false）。一般顺序是：cross-env 设“顶层”环境，.env 设“本地/项目级”环境。

---

## 高级特性

### 1. 不支持的功能

cross-env 不做：  
- 读 .env 文件（由 dotenv / dotenv-cli 等负责）  
- 复杂 shell 语法（管道、`&&` 等由 npm/shell 解析）  
- 条件分支、循环等（用脚本或 task runner 做）

### 2. 与其他工具分工

| 工具 | 作用 |
|------|------|
| **cross-env** | 在 scripts 里跨平台设环境变量再执行命令 |
| **dotenv** | 在代码里从 .env 加载到 process.env |
| **dotenv-cli** | 在命令行里带 .env 再执行命令（如 `dotenv -e .env -- node run.js`） |

---

## 最佳实践

- 需要“在 npm script 里设 NODE_ENV 等再跑命令”时，用 cross-env，保证 Win/Mac/Linux 一致。
- 仅开发/构建脚本里用即可，一般装成 devDependency。
- 敏感变量不要写在 package.json 里，用 .env + dotenv 或 CI 环境变量。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 单变量 | `cross-env NODE_ENV=production node x.js` |
| 多变量 | `cross-env A=1 B=2 node x.js` |
| 在 scripts | `"build": "cross-env NODE_ENV=production vite build"` |

---

## 参考与延伸

- [cross-env npm](https://www.npmjs.com/package/cross-env)
- [dotenv](https://github.com/motdotla/dotenv) - 代码内加载 .env
- [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) - 命令行带 .env 执行
