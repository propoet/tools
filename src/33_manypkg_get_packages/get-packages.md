# @manypkg/get-packages 从零开始学习指南

## 📚 目录
1. [什么是 @manypkg/get-packages](#什么是-manypkgget-packages)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [API 与类型](#api-与类型)
5. [示例与组合](#示例与组合)
6. [错误处理](#错误处理)
7. [最佳实践](#最佳实践)

---

## 什么是 @manypkg/get-packages

@manypkg/get-packages 是一个**从 monorepo 中获取所有包信息**的工具库，不关心你用的是 Yarn、npm、Lerna、pnpm 还是 Rush，统一用同一套 API 拿到「根目录 + 所有子包」信息，适合写跨包管理器的工具（如批量发布、依赖检查、workspace 脚本等）。

### 为什么选择它？
- ✅ **包管理器无关**：一套代码支持 Yarn / npm / Lerna / pnpm / Rush / Bolt 及单包仓库
- ✅ **自动找根目录**：从任意子目录向上查找 monorepo 根（基于 @manypkg/find-root）
- ✅ **同步/异步双版本**：`getPackages`（异步）与 `getPackagesSync`（同步）
- ✅ **内置 TypeScript 类型**：`Tool`、`Package`、`Packages` 等开箱即用
- ✅ **被广泛使用**：Changesets、Turborepo 等生态常用，周下载量百万级

### 典型场景
- 写 CLI 或脚本时，需要「当前 monorepo 里有哪些包、各自 package.json 和路径」
- 批量执行：对每个 workspace 包执行 build / test / publish
- 依赖/版本检查：遍历所有包的 `dependencies`、`version` 等
- 单包仓库也能用：只有一个包时，会返回根包 + `rootPackage`，行为一致

---

## 安装与引入

### 1. 安装依赖

```bash
npm i @manypkg/get-packages
# 或
pnpm add @manypkg/get-packages
# 或
yarn add @manypkg/get-packages
```

### 2. ESM 引入

```javascript
import { getPackages, getPackagesSync } from '@manypkg/get-packages';
```

如需使用类型（TypeScript 或 JSDoc）：

```javascript
import {
  getPackages,
  getPackagesSync,
  type Tool,
  type Package,
  type Packages,
  type GetPackagesOptions,
  PackageJsonMissingNameError,
} from '@manypkg/get-packages';
```

### 3. 项目结构示例

```
tools/
├── package.json
├── src/
│   ├── 33_manypkg_get_packages/
│   │   ├── get-packages.md   # 本学习文档
│   │   └── 1.base.js         # 示例脚本（可选）
```

---

## 基础用法

### 1. 异步获取包列表（getPackages）

从某目录向上找到 monorepo 根，并返回该根下的所有包。

```javascript
import { getPackages } from '@manypkg/get-packages';

const { tool, packages, rootPackage, rootDir } = await getPackages(process.cwd());

console.log('包管理工具类型:', tool.type);       // 如 'yarn' | 'pnpm' | 'npm' | 'lerna' | 'rush' | 'bolt' 等
console.log('根目录:', rootDir);
console.log('包数量:', packages.length);
packages.forEach((pkg) => {
  console.log(pkg.packageJson.name, '->', pkg.dir);
});
// 若有根 package（单包或 monorepo 根 package.json）
if (rootPackage) {
  console.log('根包:', rootPackage.packageJson.name);
}
```

### 2. 同步获取（getPackagesSync）

适用于同步脚本或不能使用 async 的环境。

```javascript
import { getPackagesSync } from '@manypkg/get-packages';

const { tool, packages, rootPackage, rootDir } = getPackagesSync(process.cwd());
console.log(tool.type, packages.length, rootDir);
```

### 3. 指定起始目录

不一定是 `process.cwd()`，可以是任意子目录，会从该目录向上查找根。

```javascript
const { packages, rootDir } = await getPackages('/path/to/monorepo/apps/web');
```

---

## API 与类型

### 返回值：Packages

| 字段 | 类型 | 说明 |
|------|------|------|
| `tool` | `Tool` | 检测到的 monorepo 工具（Yarn / pnpm / npm / Lerna / Rush / Bolt 等） |
| `packages` | `Package[]` | 所有包（含根包若存在） |
| `rootPackage?` | `Package \| undefined` | 根目录的 package（若存在） |
| `rootDir` | `string` | monorepo 根目录绝对路径 |

### Package

| 字段 | 类型 | 说明 |
|------|------|------|
| `packageJson` | `PackageJSON` | 该包目录下的 package.json 解析结果 |
| `dir` | `string` | 包所在目录的绝对路径 |
| `relativeDir` | `string` | 相对于 monorepo 根目录的路径 |

### Tool（来自 @manypkg/tools）

- `type: string`：工具类型
- `isMonorepoRoot(directory: string): Promise<boolean>`
- `isMonorepoRootSync(directory: string): boolean`
- `getPackages(directory: string): Promise<Packages>`
- `getPackagesSync(directory: string): Packages`

### 支持的 monorepo 类型

- **Yarn**（Workspaces）
- **npm**（workspaces）
- **pnpm**（workspaces）
- **Lerna**
- **Rush**
- **Bolt**
- **单包仓库**（仅根目录一个 package.json，也算一种「工具」）

### 可选参数：GetPackagesOptions

`getPackages(dir, options?)` / `getPackagesSync(dir, options?)` 的第二个参数继承自 `@manypkg/find-root` 的 `FindRootOptions`，例如：

- **tools**：自定义或限制要识别的 `Tool` 列表，用于只认某几种 monorepo 或接入自定义 Tool。

```javascript
const { getPackages } = require('@manypkg/get-packages');
const { packages } = await getPackages(process.cwd(), {
  // 若提供 tools，则只使用这些工具去识别根
  // tools: [yarnTool, pnpmTool, ...],
});
```

---

## 示例与组合

### 1. 列出所有包名与版本

```javascript
import { getPackages } from '@manypkg/get-packages';

const { packages } = await getPackages(process.cwd());
for (const pkg of packages) {
  const { name, version } = pkg.packageJson;
  console.log(`${name}@${version}  ${pkg.relativeDir}`);
}
```

### 2. 按目录过滤（只处理 apps 下的包）

```javascript
const { packages } = await getPackages(process.cwd());
const appPackages = packages.filter((p) => p.relativeDir.startsWith('apps/'));
console.log('Apps 包:', appPackages.map((p) => p.packageJson.name));
```

### 3. 检查是否有私有包

```javascript
const { packages } = await getPackages(process.cwd());
const privatePackages = packages.filter((p) => p.packageJson.private === true);
console.log('私有包:', privatePackages.map((p) => p.packageJson.name));
```

### 4. 与 Commander 结合（CLI 中获取 workspace 包）

```javascript
import { Command } from 'commander';
import { getPackagesSync } from '@manypkg/get-packages';

const program = new Command();
program
  .option('-C, --cwd <path>', 'monorepo 子目录')
  .action(async (options) => {
    const cwd = options.cwd || process.cwd();
    const { packages, rootDir, tool } = getPackagesSync(cwd);
    console.log(`根目录: ${rootDir} (${tool.type}), 共 ${packages.length} 个包`);
    // 后续对 packages 做批量操作...
  });
program.parse();
```

### 5. 判断当前是否为 monorepo

```javascript
const { packages, rootPackage } = await getPackages(process.cwd());
const isMonorepo = packages.length > 1 || (packages.length === 1 && !rootPackage);
console.log('是否 monorepo:', isMonorepo);
```

---

## 错误处理

### PackageJsonMissingNameError

若某个包的 `package.json` 缺少 `name` 字段，会抛出 `PackageJsonMissingNameError`，其 `directories` 为缺少 `name` 的 package.json 路径列表。

```javascript
import { getPackages, PackageJsonMissingNameError } from '@manypkg/get-packages';

try {
  const { packages } = await getPackages(process.cwd());
} catch (err) {
  if (err instanceof PackageJsonMissingNameError) {
    console.error('以下 package.json 缺少 name 字段:', err.directories);
  } else {
    throw err;
  }
}
```

### 未找到 monorepo 根

若从给定目录向上找不到支持的 monorepo 根，底层 `@manypkg/find-root` 会抛出错误，可在调用处用 try/catch 捕获。

---

## 最佳实践

1. **优先用异步 `getPackages`**：在 Node 脚本、CLI 中默认 `await getPackages(cwd)`，避免阻塞事件循环。
2. **明确起始目录**：脚本若可能从子目录执行，建议用 `process.cwd()` 或通过 `-C/--cwd` 传入，保证从正确位置向上找根。
3. **善用 `relativeDir`**：做过滤（如只处理 `packages/`、`apps/`）或按目录分组时，用 `pkg.relativeDir` 比 `pkg.dir` 更稳定。
4. **类型安全**：若用 TypeScript，直接使用导出的 `Package`、`Packages`、`Tool` 类型，减少手写类型。
5. **校验 name 字段**：库已对缺少 `name` 的 package.json 抛错，发布前保证每个包都有 `name`，可减少运行时错误。
6. **与 Changesets / Turborepo 等配合**：这些工具内部也使用 manypkg 系库，你的脚本用同一套 API 可保持行为一致（如包列表、根目录认定）。

---

## 参考链接

- [npm: @manypkg/get-packages](https://www.npmjs.com/package/@manypkg/get-packages)
- [GitHub: Thinkmill/manypkg](https://github.com/Thinkmill/manypkg)
- 依赖：[@manypkg/find-root](https://www.npmjs.com/package/@manypkg/find-root)、[@manypkg/tools](https://www.npmjs.com/package/@manypkg/tools)
