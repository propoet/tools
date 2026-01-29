# @pnpm/workspace.read-manifest 从零开始学习指南

## 📚 目录
1. [什么是 workspace.read-manifest](#什么是-workspace-read-manifest)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [API 与类型](#api-与类型)
5. [pnpm-workspace.yaml 结构](#pnpm-workspaceyaml-结构)
6. [示例与组合](#示例与组合)
7. [与其它 pnpm workspace 包配合](#与其它-pnpm-workspace-包配合)
8. [最佳实践](#最佳实践)

---

## 什么是 workspace.read-manifest

`@pnpm/workspace.read-manifest` 是 pnpm 官方提供的**读取 pnpm 工作区清单文件**的库，用于在给定目录下读取并解析 `pnpm-workspace.yaml`，得到 `packages` 列表、`catalog` / `catalogs` 以及其它 pnpm 配置（如 `overrides`、`packageExtensions` 等）。适合在脚本、CLI 或工具中需要「仅知道 workspace 定义、不实际解析各子包 package.json」的场景。

### 为什么选择它？
- ✅ **官方包**：与 pnpm 自身逻辑一致，随 pnpm 主版本更新（当前为 pnpm10 系列）
- ✅ **类型完整**：内置 TypeScript 类型（`WorkspaceManifest`、`WorkspaceCatalog` 等）
- ✅ **轻量**：只读 YAML 清单，不拉取依赖、不遍历子包
- ✅ **与 find-packages 互补**：先读 manifest 得到 `packages` 通配符，再用 `@pnpm/workspace.find-packages` 解析出具体包路径

### 典型场景
- 工具需要判断当前目录是否为 pnpm workspace 根，并读取 `packages` / `catalog`
- 批量脚本：先读 manifest 再根据 `packages` 做 glob 或交给 find-packages
- 校验或生成 `pnpm-workspace.yaml`：读出现有配置再合并或校验

### 前置条件
- **Node.js**：>= 18.12（见包内 `engines`）
- 读取的目录下应有 `pnpm-workspace.yaml`，否则会报错（包会从给定 `dir` 查找该文件）

---

## 安装与引入

### 1. 安装依赖

```bash
npm i @pnpm/workspace.read-manifest
# 或
pnpm add @pnpm/workspace.read-manifest
# 或
yarn add @pnpm/workspace.read-manifest
```

### 2. 引入

包为 CommonJS，在 ESM 项目中可用 `import` 或 `createRequire`：

```javascript
import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest';
```

TypeScript / JSDoc 类型：

```javascript
import {
  readWorkspaceManifest,
  type WorkspaceManifest,
  type WorkspaceCatalog,
  type WorkspaceNamedCatalogs,
} from '@pnpm/workspace.read-manifest';
```

### 3. 项目结构示例

```
tools/
├── pnpm-workspace.yaml   # 工作区根目录下的清单
├── package.json
├── src/
│   └── 36_pnpm_workspace_read_manifest/
│       ├── workspace-read-manifest.md
│       └── 1.base.js
```

---

## 基础用法

### 读取工作区根目录的清单

`readWorkspaceManifest(dir)` 会从 `dir` 下读取 `pnpm-workspace.yaml` 并解析为 `WorkspaceManifest`。通常传入 **workspace 根目录**的绝对或相对路径。

```javascript
import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest';
import path from 'node:path';

const workspaceRoot = process.cwd(); // 或 path.resolve(__dirname, '../..')
const manifest = await readWorkspaceManifest(workspaceRoot);

console.log('packages 通配符:', manifest.packages);
if (manifest.catalog) {
  console.log('默认 catalog:', manifest.catalog);
}
if (manifest.catalogs) {
  console.log('命名 catalogs:', Object.keys(manifest.catalogs));
}
```

- **返回值**：`Promise<WorkspaceManifest>`，包含 `packages`（必填）以及可选的 `catalog`、`catalogs` 和 [PnpmSettings](https://github.com/pnpm/pnpm/blob/main/packages/types) 中的字段（如 `overrides`、`packageExtensions` 等）。
- **异常**：若 `dir` 下没有 `pnpm-workspace.yaml` 或内容不合法，会抛出错误，需在调用处 try/catch。

---

## API 与类型

### readWorkspaceManifest(dir: string): Promise\<WorkspaceManifest\>

- **参数**：`dir` — 查找 `pnpm-workspace.yaml` 的目录（一般为 workspace 根）。
- **返回**：解析后的工作区清单对象。

### WorkspaceManifest

继承自 `PnpmSettings`，并包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `packages` | `string[]` | **必填**。包路径通配符列表，如 `['packages/*', 'apps/*']` |
| `catalog` | `WorkspaceCatalog \| undefined` | 默认 catalog，包内可用 `catalog:` 或 `catalog:default` 引用 |
| `catalogs` | `WorkspaceNamedCatalogs \| undefined` | 命名 catalog 集合，包内用 `catalog:<name>` 引用 |

其它在 `pnpm-workspace.yaml` 中支持的 pnpm 配置（如 `overrides`、`packageExtensions` 等）会出现在返回对象上，类型来自 `@pnpm/types` 的 `PnpmSettings`。

### WorkspaceCatalog

```ts
interface WorkspaceCatalog {
  [dependencyName: string]: string;  // 依赖名 -> 版本范围
}
```

例如：`{ "chalk": "^5.0.0", "lodash": "4.17.21" }`。

### WorkspaceNamedCatalogs

```ts
interface WorkspaceNamedCatalogs {
  [catalogName: string]: WorkspaceCatalog;
}
```

即「catalog 名称 -> 依赖名到版本的映射」。

### 其它导出（校验用）

- `assertValidWorkspaceManifestCatalog(manifest)`：断言 `manifest.catalog` 类型合法。
- `assertValidWorkspaceManifestCatalogs(manifest)`：断言 `manifest.catalogs` 类型合法。

一般直接使用 `readWorkspaceManifest` 即可；校验函数多用于内部或自定义工具中做类型收窄。

---

## pnpm-workspace.yaml 结构

与该包解析结果对应的常见 YAML 结构如下（仅作参考，以 [pnpm 官方文档](https://pnpm.io/pnpm-workspace_yaml) 为准）：

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'

catalog:
  chalk: ^5.0.0
  lodash: 4.17.21

catalogs:
  react18:
    react: ^18.0.0
    react-dom: ^18.0.0
  react19:
    react: ^19.0.0
    react-dom: ^19.0.0
```

- **packages**：必填，字符串数组，支持 glob；根包默认始终在 workspace 内。
- **catalog**：可选，默认 catalog，子包可用 `catalog:` 引用。
- **catalogs**：可选，命名 catalog，子包用 `catalog:react18` 等形式引用。

---

## 示例与组合

### 1. 判断当前目录是否为 workspace 根并读取 packages

```javascript
import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest';
import path from 'node:path';

async function getWorkspacePackagesGlobs(dir = process.cwd()) {
  try {
    const manifest = await readWorkspaceManifest(dir);
    return manifest.packages;
  } catch {
    return null;
  }
}

const globs = await getWorkspacePackagesGlobs();
if (globs) {
  console.log('Workspace packages 通配符:', globs);
} else {
  console.log('当前目录不是 pnpm workspace 根或没有 pnpm-workspace.yaml');
}
```

### 2. 读取默认 catalog 用于脚本

```javascript
const manifest = await readWorkspaceManifest(process.cwd());
const catalog = manifest.catalog ?? {};
console.log('默认 catalog 依赖:', catalog);
// 例如：{ chalk: '^5.0.0', lodash: '4.17.21' }
```

### 3. 与 @pnpm/workspace.find-packages 配合

先读 manifest 得到 `packages` 定义，再交给 find-packages 解析出实际包路径与 package.json（需单独安装 `@pnpm/workspace.find-packages`）：

```javascript
import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest';
import { findPackages } from '@pnpm/workspace.find-packages';

const root = process.cwd();
const manifest = await readWorkspaceManifest(root);
const { packages } = await findPackages(root, manifest);
packages.forEach((pkg) => {
  console.log(pkg.manifest.name, pkg.dir);
});
```

### 4. 向上查找 workspace 根再读

若脚本可能从子目录执行，可先解析出 workspace 根（例如用 `@manypkg/find-root` 或自己向上找包含 `pnpm-workspace.yaml` 的目录），再对该根目录调用 `readWorkspaceManifest`。

---

## 与其它 pnpm workspace 包配合

| 包 | 用途 |
|------|------|
| `@pnpm/workspace.read-manifest` | 只读 `pnpm-workspace.yaml`，得到 `packages`、`catalog`、`catalogs` 等 |
| `@pnpm/workspace.find-packages` | 根据 manifest 的 `packages` 解析出所有子包路径和 package.json |
| `@manypkg/get-packages` | 跨包管理器（Yarn/npm/pnpm/Lerna 等）获取包列表，不限于 pnpm |

需要「仅 workspace 定义」时用 read-manifest；需要「具体包列表 + manifest」时用 find-packages 或 get-packages。

---

## 最佳实践

1. **传入明确的 workspace 根**：`readWorkspaceManifest` 不会自动向上查找根目录，调用方应传入包含 `pnpm-workspace.yaml` 的目录（如 `process.cwd()` 在根目录执行，或先 resolve 出根再传）。
2. **错误处理**：文件不存在或 YAML 无效时会抛错，建议 try/catch 并给出友好提示。
3. **Node 版本**：确保运行环境 Node >= 18.12。
4. **类型**：使用 TypeScript 或 JSDoc 时直接使用包导出的 `WorkspaceManifest`、`WorkspaceCatalog` 等类型，便于与 find-packages 或自定义逻辑对接。

---

## 参考链接

- [npm: @pnpm/workspace.read-manifest](https://www.npmjs.com/package/@pnpm/workspace.read-manifest)
- [pnpm 仓库: workspace/read-manifest](https://github.com/pnpm/pnpm/tree/main/workspace/read-manifest)
- [pnpm-workspace.yaml 官方说明](https://pnpm.io/pnpm-workspace_yaml)
- [Workspaces | pnpm](https://pnpm.io/workspaces)
