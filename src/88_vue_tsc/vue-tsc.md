# vue-tsc 学习文档

> Vue 官方的 TypeScript 类型检查 CLI：在 Vue SFC 与 TS 文件上跑类型检查，支持 watch 与声明文件生成

## 📚 目录

1. [用大白话说：vue-tsc 是啥](#用大白话说vue-tsc-是啥)
2. [原理：为什么 Vite 不跑类型检查](#原理为什么-vite-不跑类型检查)
3. [与 tsc、Volar 的关系](#与-tscvolar-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [CLI 用法与常用命令](#cli-用法与常用命令)
6. [与 Vite、CI 的集成](#与-viteci-的集成)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：vue-tsc 是啥

### 你遇到的问题（Vue + TypeScript 时）

- **Vite 只转译不检查类型**：`vite build` 和 `vite dev` 只做转译，不跑 TypeScript 类型检查，类型错误可能直到运行时或 CI 才暴露。
- **tsc 不认 .vue**：原生 `tsc` 不解析 `.vue` 单文件组件里的 `<script lang="ts">`，直接 `tsc --noEmit` 会报错或跳过 SFC。
- **需要命令行检查**：希望在 CI 或本地用一条命令对整项目做类型检查，并可选生成 .d.ts。

也就是说：**在「对 Vue 项目做 TypeScript 类型检查」这件事上，提供能处理 .vue 的 CLI 工具**，就是 vue-tsc 要解决的问题。

### vue-tsc 帮你做啥

**vue-tsc**（Vue 官方维护）是一个 **TypeScript 类型检查 CLI**：

1. **包装 tsc**：行为类似 `tsc`，但能解析 `.vue` 单文件组件中的 `<script lang="ts">` 与模板类型。
2. **命令行检查**：`vue-tsc --noEmit` 对项目做类型检查，不生成 JS；`vue-tsc --emit` 可生成 JS 与 .d.ts。
3. **Watch 模式**：`vue-tsc --watch` 可监听文件变化持续检查；可与 Vite dev 并行。
4. **声明文件**：库项目可用 `vue-tsc --emit` 生成 .d.ts，供下游使用。
5. **读 tsconfig**：使用项目中的 `tsconfig.json`（或通过 `-p` 指定），与 tsc 一致。

一句话：**vue-tsc = 能处理 .vue 的 tsc**，用于 Vue 项目的类型检查与声明生成。

---

## 原理：为什么 Vite 不跑类型检查

- **Vite**：开发与构建时用 esbuild 做 TS 转译，速度极快但不做类型检查；类型错误不会阻塞构建。
- **vue-tsc**：基于 TypeScript 编译器 API，对 .ts 与 .vue 做完整类型检查；速度较慢，适合单独在 CI 或 watch 里跑。
- **分工**：Vite 负责转译与打包；vue-tsc 负责类型正确性；两者可同时使用。

---

## 与 tsc、Volar 的关系

| 角色 | 作用 |
|------|------|
| **vue-tsc** | 命令行类型检查与 .d.ts 生成；能处理 .vue；Vue 官方。 |
| **tsc** | TypeScript 官方 CLI；不解析 .vue，只处理 .ts。 |
| **Volar** | VS Code 的 Vue 语言支持；在 IDE 里做实时类型检查与提示；不替代 vue-tsc 命令行。 |

**简单记**：IDE 里类型体验用 Volar；命令行与 CI 用 vue-tsc。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D vue-tsc
# 或
npm i -D vue-tsc
```

### 使用方式

- **仅检查**：`npx vue-tsc --noEmit`，不生成文件，只报类型错误。
- **检查 + 生成**：`npx vue-tsc --emit`，生成 JS 与 .d.ts（依 tsconfig）；库项目常用。
- **Watch**：`npx vue-tsc --watch --noEmit`，文件变更时持续检查。

---

## CLI 用法与常用命令

### 基本语法

```bash
vue-tsc [options]
```

- 选项与 `tsc` 基本一致：`--noEmit`、`--watch`、`-p tsconfig.json`、`--emitDeclarationOnly` 等。
- **--noEmit**：只做类型检查，不生成任何文件；CI 与日常检查常用。
- **--watch**：监听文件变化，持续检查。
- **-p / --project**：指定 tsconfig 路径，默认当前目录 tsconfig.json。

### 示例

```bash
# 仅类型检查
vue-tsc --noEmit

# 指定 tsconfig
vue-tsc --noEmit -p ./tsconfig.app.json

# Watch 模式（与 vite 并行时常用）
vue-tsc --watch --noEmit

# 库项目：生成声明文件
vue-tsc --emit
```

---

## 与 Vite、CI 的集成

### package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "type-check": "vue-tsc --noEmit"
  }
}
```

- **build 前检查**：`vue-tsc --noEmit && vite build`，类型错误则中断构建。
- **单独检查**：`pnpm type-check` 或 `npm run type-check`，本地或 CI 执行。

### CI（如 GitHub Actions）

```yaml
- run: pnpm install
- run: pnpm run type-check
- run: pnpm run build
```

### Vite 插件（可选）

- **vite-plugin-checker**：在 dev 时在单独 worker 里跑 vue-tsc，把类型错误 overlay 到浏览器；不阻塞 dev 启动。

---

## 常见场景与最佳实践

1. **CI 必跑**：在 CI 里执行 `vue-tsc --noEmit`，类型错误即失败。
2. **build 前检查**：`vue-tsc --noEmit && vite build`，避免打出有类型问题的包。
3. **库项目**：用 `vue-tsc --emit` 或 `--emitDeclarationOnly` 生成 .d.ts，供消费者获得类型提示。
4. **与 Volar 并用**：IDE 用 Volar 实时提示；命令行用 vue-tsc 做权威检查。
5. **大项目**：可用 `vue-tsc --watch` 在另一终端持续检查，或交给 vite-plugin-checker。

---

## 参考与延伸阅读

- [Vue TypeScript 指南](https://vuejs.org/guide/typescript/overview.html)
- [vue-tsc npm](https://www.npmjs.com/package/vue-tsc)
- [vue-tsc GitHub](https://github.com/vuejs/language-tools/tree/master/packages/vue-tsc)
- [vite-plugin-checker](https://github.com/fi3ework/vite-plugin-checker)（可选）
