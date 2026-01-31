# publint 学习文档

> 针对 npm 包发布的 lint 工具：检查打包配置与多环境兼容性，支持 CLI 与 JavaScript API

## 📚 目录

1. [用大白话说：publint 是啥](#用大白话说publint-是啥)
2. [原理：为什么需要「包发布」专用 lint](#原理为什么需要包发布专用-lint)
3. [与 ESLint、npm pack 的关系](#与-eslintnpm-pack-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [CLI 用法与选项](#cli-用法与选项)
6. [JavaScript API 与 formatMessage](#javascript-api-与-formatmessage)
7. [选项：level、pack、strict](#选项levelpackstrict)
8. [常见场景与最佳实践](#常见场景与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：publint 是啥

### 你遇到的问题（发 npm 包时）

- **exports / main / module**：package.json 里 `exports`、`main`、`module`、`types` 配错，导致 ESM/CJS/TypeScript 在不同环境（Node、Vite、Webpack、ts-node）下解析不到入口或类型。
- **files 与实际发布内容**：`files` 没包含入口文件，或入口在 package.json 里声明了但没被打进包，发布后用户装到的是「缺文件」的包。
- **依赖与 peerDependencies**：该写 `dependencies` 的写了 `peerDependencies`，或反过来，导致安装行为异常。
- **多包管理器**：用 pnpm/yarn 开发，用户用 npm 装，打包结果不一致，希望在上传前用「和发布一致」的方式 pack 一遍再检查。

也就是说：**在「发 npm 包前，按「真实发布内容」检查配置与多环境兼容」这件事上，提供专用 lint**，就是 publint 要解决的问题。

### publint 帮你做啥

**publint** 是一个 **针对 npm 包的 lint 工具**：

1. **检查打包配置**：读 package.json（exports、main、module、types、files 等），结合「实际 pack 出的文件列表」，检查入口是否可解析、类型是否暴露、files 是否包含该有的文件。
2. **多环境兼容**：按 Node ESM/CJS、打包器（Vite/Webpack 等）、TypeScript 等场景，判断包能否被正确解析，并给出 suggestion / warning / error。
3. **CLI 与 API**：支持命令行 `publint [path] [options]` 和 JavaScript API `publint({ pkgDir, pack, level, strict })`，可集成进 CI 或本地脚本。
4. **pack 可选**：可指定用 npm/yarn/pnpm/bun 对目录做一次 pack，用「和发布一致」的文件列表做检查；也可传已有 tarball 或手动解包的文件列表。

一句话：**publint = 读 package.json +（可选）pack 出发布内容 → 按规则检查「包能否被各环境正确使用」**，在发包前发现配置问题。

---

## 原理：为什么需要「包发布」专用 lint

- **ESLint 不管「发布结果」**：ESLint 检查的是源码风格与逻辑，不关心 package.json 的 exports、main、files 与「实际发布出去的文件」是否一致。
- **npm pack 只打包不检查**：`npm pack` 会按 `files` 和默认规则打出 tarball，但不会告诉你「exports 指向的文件是否在 tarball 里」「各环境能否正确解析入口」。
- **publint 的做法**：结合 package.json 的**声明**与（通过 pack 或传入的）**实际文件列表**，用一套规则检查：入口是否存在、exports 的 key/value 是否可解析、类型入口是否暴露、依赖声明是否合理等；并区分 suggestion / warning / error，便于逐步修复。

通俗讲：**publint 专门盯「这个目录/这个 tarball 作为 npm 包发出去后，会不会在 Node、Vite、Webpack、TS 下出问题」**。

---

## 与 ESLint、npm pack 的关系

| 角色 | 作用 |
|------|------|
| **publint** | 针对「npm 包发布」的 lint：检查 package.json 与（pack 出的）文件是否一致、多环境能否正确解析；不检查源码风格。 |
| **ESLint** | 检查 JS/TS 源码风格与逻辑；不关心 exports、main、files、pack 结果。 |
| **npm pack** | 按 package.json 打出 tarball；不检查配置是否正确、入口是否可解析。 |

**简单记**：ESLint 管「代码怎么写」；publint 管「包怎么配、发出去能不能用」；npm pack 只管「打成包」。

---

## 安装与使用方式

### 安装

```bash
pnpm add -D publint
# 或
npm i -D publint
```

### 使用方式

- **CLI**：在包目录下执行 `pnpm publint` 或 `npx publint [path]`，可传目录或 tarball 路径，配合 `--level`、`--pack`、`--strict`。
- **JavaScript API**：`import { publint } from 'publint'`，`const { messages, pkg } = await publint({ pkgDir, pack, level, strict })`，可用 `formatMessage` 格式化输出。

---

## CLI 用法与选项

### 基本语法

```bash
publint [path] [options]
```

- **path**：要检查的目录路径，或 tarball 文件路径（如 `./mylib-1.0.0.tgz`）；不传则默认当前目录。
- **options**：见下表。

### 常用选项

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `--level` | `'suggestion' \| 'warning' \| 'error'` | `'suggestion'` | 只输出该级别及以上的消息（suggestion 含全部）。 |
| `--pack` | `'auto' \| 'npm' \| 'yarn' \| 'pnpm' \| 'bun' \| false` | `'auto'` | 用哪个包管理器做 pack；`false` 表示不 pack，仅用目录内文件检查。 |
| `--strict` | `boolean` | `false` | 把 warning 当 error 处理（CI 里常用）。 |

### 示例

```bash
# 检查当前目录
publint

# 检查指定目录
publint ./packages/mylib

# 检查 tarball
publint ./mylib-1.0.0.tgz

# 只显示 warning 和 error
publint --level warning

# 把 warning 当 error（CI 严格模式）
publint --strict

# 指定用 npm 做 pack
publint --pack npm
```

---

## JavaScript API 与 formatMessage

### 基本用法

```javascript
import { publint } from 'publint';

const { messages, pkg } = await publint({
  pkgDir: './packages/mylib',  // 含 package.json 的目录；Node 下默认 process.cwd()
  level: 'suggestion',
  pack: 'auto',                 // 或 'npm' | 'yarn' | 'pnpm' | 'bun' | false
  strict: false,
});

// messages 为问题列表，可配合 formatMessage 输出
```

- **messages**：数组，每项描述一个问题（代码、严重程度、位置等）。
- **pkg**：解析到的包信息，供 `formatMessage` 等使用。

### 格式化输出

```javascript
import { publint } from 'publint';
import { formatMessage } from 'publint/utils';

const { messages, pkg } = await publint({ pkgDir: process.cwd() });

for (const message of messages) {
  console.log(formatMessage(message, pkg));
}
```

### 检查 tarball（Node 或浏览器）

```javascript
import { publint } from 'publint';

// 从网络拉 tarball
const response = await fetch('https://registry.npmjs.org/mylib/-/mylib-1.0.0.tgz');
if (!response.body) throw new Error('Failed to fetch tarball');

const result = await publint({ pack: { tarball: response.body } });
```

- 浏览器下无法访问文件系统，**必须**传 `pack: { tarball }` 或 `pack: { files }`（需先自行 unpack）。

---

## 选项：level、pack、strict

### level

- **suggestion**：输出所有消息（建议、警告、错误）。
- **warning**：只输出 warning 和 error。
- **error**：只输出 error。

### pack

- **auto**（默认）：根据项目自动检测包管理器（如 package-manager-detector），用其 pack。
- **npm / yarn / pnpm / bun**：强制用指定包管理器 pack。
- **{ tarball: ArrayBuffer | ReadableStream }**：直接传已打好的 tarball（Node 或浏览器均可）。
- **{ files: PackFile[] }**：传手动解包后的文件列表，需配合 `pkgDir`（为这些文件的公共根目录）。
- **false**：不 pack，仅用 `pkgDir` 下现有文件检查；适合已确定「目录即发布内容」的场景（如 node_modules 里的包）。

Node 下默认 `'auto'`；浏览器下只支持 `{ tarball }` 或 `{ files }`，且必须传其一。

### strict

- **true**：把 warning 视为 error（例如 CI 里希望「有 warning 就失败」）。

---

## 常见场景与最佳实践

1. **发包前本地检查**：在包目录执行 `publint` 或 `publint --strict`，修掉 suggestion/warning/error 再 `npm publish`。
2. **CI 集成**：在 CI 里对每个要发布的包跑 `publint --strict`，或在脚本里 `const { messages } = await publint({ pkgDir, strict: true })`，根据 `messages.length` 决定是否失败。
3. **检查 tarball**：发布前用 `npm pack` 打出 tgz，再 `publint ./xxx.tgz`，确保检查的是「真正要上传」的内容。
4. **多包仓库**：对每个子包分别指定 `pkgDir` 跑 publint，或写脚本循环调用 API。
5. **与 ESLint 分工**：ESLint 管代码质量，publint 管包配置与发布兼容性，两者可同时使用。

---

## 参考与延伸阅读

- [publint 官网与文档](https://publint.dev/)
- [CLI 文档](https://publint.dev/docs/cli)
- [JavaScript API 文档](https://publint.dev/docs/javascript-api)
- [publint GitHub](https://github.com/publint/publint)
- [npm 包](https://www.npmjs.com/package/publint)
