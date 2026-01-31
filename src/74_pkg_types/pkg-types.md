# pkg-types 学习文档

> Node 下读写 package.json、tsconfig.json、.git/config 的工具与 TypeScript 类型定义；UnJS 维护，Nuxt/Nitro 等常用

## 📚 目录

1. [用大白话说：pkg-types 是啥](#用大白话说pkg-types-是啥)
2. [原理：为什么用工具而不是手写 readFile](#原理为什么用工具而不是手写-readfile)
3. [与 read-pkg、cosmiconfig 的关系](#与-read-pkgcosmiconfig-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [package.json：读 / 写 / 解析路径](#packagejson读--写--解析路径)
6. [tsconfig.json：读 / 写 / 解析路径](#tsconfigjson读--写--解析路径)
7. [resolveFile、resolveLockFile、findWorkspaceDir](#resolvefileresolvelockfilefindworkspacedir)
8. [Git 配置：resolve / read / write / parse](#git-配置resolve--read--write--parse)
9. [类型与 define 工具](#类型与-define-工具)
10. [常见场景与最佳实践](#常见场景与最佳实践)
11. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：pkg-types 是啥

### 你遇到的问题（脚本里要读 package.json 时）

- **要读当前项目的 package.json**：构建脚本、CLI、工具链里经常要读 name、version、dependencies 等，手写 `fs.readFile` + `JSON.parse` 还要处理路径和编码。
- **要向上找 package.json**：从子目录往上找根目录的 package.json，或找 workspace 根，手写循环麻烦。
- **要读 tsconfig.json**：工具要读 TS 配置，路径、extends 解析要自己处理。
- **要类型**：package.json、tsconfig 的字段很多，希望有 TypeScript 类型或 IDE 提示。

也就是说：**在「读/写 package.json、tsconfig.json 及解析路径、找 workspace、读 .git/config」这件事上，提供统一 API 和类型**，就是 pkg-types 要解决的问题。

### pkg-types 帮你做啥

**pkg-types**（[UnJS](https://unjs.io/) 维护）是一个 **读写 package.json / tsconfig.json / .git/config 的工具库**：

1. **readPackageJSON / writePackageJSON / resolvePackageJSON**：读、写、解析 package.json 路径；可从指定目录向上查找。
2. **readTSConfig / writeTSConfig / resolveTSConfig**：读、写、解析 tsconfig.json 路径；支持 extends 等。
3. **resolveFile**：按文件名和可选条件（startingFrom、rootPattern、matcher）向上查找文件。
4. **resolveLockFile**：解析 lock 文件路径（pnpm-lock.yaml、package-lock.json、yarn.lock 等）。
5. **findWorkspaceDir**：检测 workspace 根目录（pnpm-workspace.yaml、lerna.json、.git、lockfile、package.json 等）。
6. **resolveGitConfig / readGitConfig / writeGitConfig / parseGitConfig / stringifyGitConfig**：解析、读、写、解析/序列化 .git/config（INI 格式）。
7. **类型**：**PackageJSON**、**TSConfig**、**GitConfig** 等 TypeScript 接口；**definePackageJSON**、**defineTSConfig**、**defineGitConfig** 便于在 .js 里获得类型提示。

一句话：**pkg-types = 读/写 package.json、tsconfig.json、.git/config 的工具 + 类型定义**，适合构建脚本、CLI、工具链；Nuxt、Nitro 等都在用。

---

## 原理：为什么用工具而不是手写 readFile

### 1. 路径解析

- **resolvePackageJSON(cwd)** 会从 **cwd** 向上遍历目录，找到 **package.json** 的绝对路径；**readPackageJSON(cwd)** 会先解析路径再读文件，避免手写「从当前目录往上找」的逻辑。
- **resolveTSConfig**、**resolveLockFile**、**findWorkspaceDir** 同理，都是「从某目录向上/向根」的查找规则，封装成统一 API。

### 2. 解析与兼容

- **readPackageJSON** 读的是 JSON，但 package.json 可能带注释（如 JSONC）；库会按规范解析，减少手写 `JSON.parse` 的边界问题。
- **readTSConfig** 会处理 **extends** 等，返回合并后的配置或路径信息，便于工具消费。

### 3. 类型

- **PackageJSON**、**TSConfig** 等类型与 Node/npm、TypeScript 官方约定对齐，写脚本时字段有提示、少拼写错误。

可以简单记：**封装「向上查找 + 读文件 + 解析」+ 类型 = 少写样板、少踩坑**。

---

## 与 read-pkg、cosmiconfig 的关系

| 角色 | 作用 |
|------|------|
| **pkg-types** | 读/写 package.json、tsconfig.json、.git/config，解析路径、lockfile、workspace 根；带类型。 |
| **read-pkg** | 主要读 package.json，带 normalize；不负责 tsconfig、git、workspace。 |
| **cosmiconfig** | 按「约定文件名」查找并解析配置（如 .env、.prettierrc），支持多种格式；不专门管 package.json 结构。 |

- **只读 package.json、要路径解析和类型** → **pkg-types**。  
- **要读任意约定配置文件（多格式）** → **cosmiconfig**。  
- **只读 package.json、不需要 workspace/tsconfig** → **read-pkg** 也可。

---

## 安装与使用方式

### 安装

```bash
pnpm add pkg-types
# 或
npm i pkg-types
```

- 若只用在构建/脚本里，可放 **devDependencies**；若运行时也要读 package.json，放 **dependencies**。
- 使用 **类型**（PackageJSON、TSConfig 等）时，项目里需有 **typescript**（devDependency 即可）。

### 使用方式概览

- **读**：`readPackageJSON()`、`readTSConfig()`、`readGitConfig()` 等，可从当前目录或传入路径。
- **写**：`writePackageJSON(path, pkg)`、`writeTSConfig(path, config)`、`writeGitConfig(path, obj)`。
- **解析路径**：`resolvePackageJSON()`、`resolveTSConfig()`、`resolveLockFile()`、`resolveFile()`、`findWorkspaceDir()`。

---

## package.json：读 / 写 / 解析路径

### readPackageJSON

```js
import { readPackageJSON, resolvePackageJSON } from "pkg-types";

// 从当前工作目录向上找 package.json 并读取
const pkg = await readPackageJSON();
console.log(pkg.name, pkg.version);

// 从指定目录向上找并读取
const pkg2 = await readPackageJSON("/path/to/project");
```

- **readPackageJSON(cwd?)**：**cwd** 默认为当前工作目录；向上查找 **package.json** 并读取，返回解析后的对象。
- 未找到会抛错。

### resolvePackageJSON

```js
const path = await resolvePackageJSON();
// 或
const path2 = await resolvePackageJSON("/path/to/subdir");
```

- **resolvePackageJSON(cwd?)**：只解析 **package.json** 的绝对路径，不读内容。
- 未找到会抛错。

### writePackageJSON

```js
import { writePackageJSON } from "pkg-types";

await writePackageJSON("path/to/package.json", {
  name: "my-pkg",
  version: "1.0.0",
});
```

- **writePackageJSON(path, pkg)**：将对象序列化为 JSON 并写入 **path**。

---

## tsconfig.json：读 / 写 / 解析路径

### readTSConfig / resolveTSConfig / writeTSConfig

```js
import { readTSConfig, resolveTSConfig, writeTSConfig } from "pkg-types";

const tsconfig = await readTSConfig();
const tsconfigPath = await resolveTSConfig("/path/to/project");

await writeTSConfig("path/to/tsconfig.json", { compilerOptions: { strict: true } });
```

- **readTSConfig(cwd?)**：从 **cwd** 向上找 **tsconfig.json** 并读取（会处理 **extends** 等）。
- **resolveTSConfig(cwd?)**：只解析 **tsconfig.json** 的绝对路径。
- **writeTSConfig(path, config)**：将配置对象写入 **path**。

---

## resolveFile、resolveLockFile、findWorkspaceDir

### resolveFile

```js
import { resolveFile } from "pkg-types";

const readmePath = await resolveFile("README.md", {
  startingFrom: "/path/to/start",
  rootPattern: /^node_modules$/,
  matcher: (filename) => filename.endsWith(".md"),
});
```

- **resolveFile(name, options?)**：从 **startingFrom**（默认 cwd）向上查找文件；**rootPattern** 为遇到该目录时停止；**matcher** 可对文件名做额外过滤。

### resolveLockFile

```js
import { resolveLockFile } from "pkg-types";

const lockPath = await resolveLockFile(".");
// 返回 pnpm-lock.yaml、package-lock.json、yarn.lock 等路径
```

- **resolveLockFile(cwd?)**：从 **cwd** 向上找 lock 文件（pnpm-lock.yaml、package-lock.json、yarn.lock、bun.lock 等），返回绝对路径；未找到抛错。

### findWorkspaceDir

```js
import { findWorkspaceDir } from "pkg-types";

const workspaceRoot = await findWorkspaceDir(".");
```

- **findWorkspaceDir(cwd?)**：检测 workspace 根目录；查找顺序一般为：workspace 配置文件（pnpm-workspace.yaml、lerna.json、turbo.json、rush.json）、.git/config、lockfile、package.json；返回根目录路径；未找到抛错。

---

## Git 配置：resolve / read / write / parse

### resolveGitConfig / readGitConfig

```js
import { resolveGitConfig, readGitConfig } from "pkg-types";

const gitConfigPath = await resolveGitConfig(".");
const gitConfig = await readGitConfig(".");
// gitConfig 为解析后的 JS 对象（INI → 对象）
```

### writeGitConfig / parseGitConfig / stringifyGitConfig

- **writeGitConfig(path, obj)**：将 Git 配置对象序列化为 INI 并写入 **path**。
- **parseGitConfig(iniText)**：将 INI 文本解析为对象。
- **stringifyGitConfig(obj)**：将对象序列化为 INI 文本。

---

## 类型与 define 工具

### 类型

```ts
import type { PackageJSON, TSConfig, GitConfig } from "pkg-types";

const pkg: PackageJSON = await readPackageJSON();
const ts: TSConfig = await readTSConfig();
```

- **PackageJSON**、**TSConfig**、**GitConfig** 等可直接用作类型注解。

### define 工具（.js 里也能有提示）

```js
import { definePackageJSON, defineTSConfig } from "pkg-types";

const pkg = definePackageJSON({ name: "my-pkg", version: "1.0.0" });
const ts = defineTSConfig({ compilerOptions: { strict: true } });
```

- **definePackageJSON**、**defineTSConfig**、**defineGitConfig** 返回传入对象，但带类型，在 IDE 里写时有补全和类型检查。

---

## 常见场景与最佳实践

### 1. 构建脚本里读项目 name、version

```js
const pkg = await readPackageJSON();
console.log(`Building ${pkg.name}@${pkg.version}`);
```

### 2. 从子目录找 monorepo 根

```js
const root = await findWorkspaceDir(import.meta.dirname);
const rootPkg = await readPackageJSON(root);
```

### 3. 判断是否有 lockfile、在哪

```js
try {
  const lockPath = await resolveLockFile(".");
  console.log("Lockfile:", lockPath);
} catch {
  console.log("No lockfile found");
}
```

### 4. 写 package.json（如自动改 version）

```js
const pkg = await readPackageJSON();
pkg.version = "2.0.0";
await writePackageJSON(await resolvePackageJSON(), pkg);
```

### 5. 类型安全

- 读出的对象用 **PackageJSON**、**TSConfig** 注解，或使用 **definePackageJSON** 等，避免字段拼写错误。

---

## 参考与延伸阅读

- [pkg-types npm](https://www.npmjs.com/package/pkg-types)
- [pkg-types GitHub](https://github.com/unjs/pkg-types)
- [UnJS - pkg-types](https://unjs.io/packages/pkg-types/)

---

**小结**：pkg-types 提供 read/write/resolve 系列 API 操作 package.json、tsconfig.json、.git/config，以及 resolveFile、resolveLockFile、findWorkspaceDir；带 PackageJSON、TSConfig、GitConfig 类型与 define 工具，适合构建脚本、CLI 和工具链。
