# Changesets 一体化学习指南（CLI + changelog-github + git）

## 📚 目录
1. [三者是什么](#三者是什么)
2. [安装与初始化](#安装与初始化)
3. [@changesets/cli：主流程](#changesetscli主流程)
4. [@changesets/changelog-github：CHANGELOG 生成](#changesetschangelog-githubchangelog-生成)
5. [@changesets/git：Git 能力与脚本用法](#changesetsgitgit-能力与脚本用法)
6. [完整工作流示例](#完整工作流示例)
7. [CI / GitHub Actions](#ci--github-actions)
8. [最佳实践与速查](#最佳实践与速查)
9. [参考链接](#参考链接)

---

## 三者是什么

| 包 | 职责 | 何时用到 |
|----|------|----------|
| **@changesets/cli** | 版本与发布主流程：`changeset add`、`changeset version`、`changeset publish`，以及 `.changeset/config.json` | 日常写变更、升版本、发版 |
| **@changesets/changelog-github** | 作为 **changelog 生成器**：在 `version` 时把 changeset 描述写成「带 PR/作者链接」的 GitHub 风格 CHANGELOG | 在 config 里配 `changelog` 即可，无需手写 |
| **@changesets/git** | 封装 Git（当前分支、自某 ref 变更的包、新增 changeset 的 commit 等），供 CLI 内部和**自定义发版/CI 脚本**使用 | 发版前检查分支、在 CI 里判断是否要发布、写自定义发布逻辑 |

三者关系简述：

- **CLI** 是入口：负责「声明变更 → 升版本 → 写 CHANGELOG → 发布」整条链路。
- **changelog-github** 是 CLI 的**可选插件**：通过 `config.json` 的 `changelog` 接入，只参与「怎么写 CHANGELOG」。
- **git** 被 CLI 内部使用，你在「自定义脚本 / CI 检查」里也会直接调用。

---

## 安装与初始化

### 1. 一次性装齐三个包（推荐）

在仓库根目录（或 Monorepo 根）执行：

```bash
pnpm add -Dw @changesets/cli @changesets/changelog-github @changesets/git
# 或
npm install -D @changesets/cli @changesets/changelog-github @changesets/git
```

- `@changesets/cli`：必装，提供 `changeset` 命令。
- `@changesets/changelog-github`：若要用「GitHub 风格 CHANGELOG」，必装；否则可只装 cli。
- `@changesets/git`：CLI 内部会用到；若你在自己的脚本里做分支/变更检查，也需要单独依赖它。

### 2. 初始化 Changesets

```bash
pnpm changeset init
# 或 npx changeset init
```

会生成：

- `.changeset/config.json` — 主配置（changelog 写这里）
- `.changeset/README.md` — 给贡献者的说明（可选维护）

---

## @changesets/cli：主流程

### 核心命令

| 命令 | 作用 |
|------|------|
| `changeset init` | 生成 `.changeset` 与默认 config |
| `changeset` / `changeset add` | 交互式新增一个 changeset（选包、选 bump 类型、写摘要） |
| `changeset version` | 根据未消费的 changeset 升版本、更新 CHANGELOG、删除已用掉的 changeset 文件 |
| `changeset publish` | 把已升版本的包发布到 registry（如 npm） |
| `changeset status` | 查看当前未应用的 changeset、会受影响的包（CI 里常用来检查 PR 是否带 changeset） |

### 流程简述

1. **开发时**：改完代码后执行 `pnpm changeset`，按提示选包、选 major/minor/patch、写一句变更说明，得到 `.changeset/xxx.md`。
2. **发版前**：在要发版的分支（如 `main`）上执行 `pnpm changeset version`，自动改各包版本、生成/追加 CHANGELOG、删掉已用的 changeset 文件。
3. **发版**：执行 `pnpm changeset publish`（或先 `pnpm build` 再 publish），把更新过的包发到 npm 等。

### `.changeset/config.json` 常见字段

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- **changelog**：CHANGELOG 生成方式。用 GitHub 风格时，会改成下面「changelog-github」那一节里的写法。
- **commit**：是否在 `version` 时自动 git commit，一般写 `false`，由 CI 或你自己 commit。
- **access**：发到 npm 时，若为公开包需改为 `"public"`，否则容易发布失败。
- **baseBranch**：主分支名，默认 `main`，影响 bot/CI 判断。
- **ignore**：不参与 changeset 的包名数组，例如文档站、示例 app。

---

## @changesets/changelog-github：CHANGELOG 生成

### 作用

在执行 `changeset version` 时，把每个 changeset 的说明转成「带 GitHub PR / 作者链接」的 CHANGELOG 条目，而不是纯文本。

### 安装与配置

已按上文安装好 `@changesets/changelog-github` 后，在 `.changeset/config.json` 里把 `changelog` 改为数组形式，并传入仓库名：

```json
{
  "changelog": ["@changesets/changelog-github", { "repo": "你的用户名/你的仓库名" }],
  "commit": false,
  "access": "public",
  "baseBranch": "main"
}
```

例如仓库地址为 `https://github.com/foo/my-app`，则：

```json
"changelog": ["@changesets/changelog-github", { "repo": "foo/my-app" }]
```

之后每次 `changeset version`，生成的 CHANGELOG 会使用该仓库的 PR/作者信息（在 changeset 能被关联到 PR 的情况下）。

### 注意

- **无需在业务代码里 import**：仅通过 config 挂到 CLI 即可。
- 若不需要 GitHub 链接，可继续用默认 `"changelog": "@changesets/cli/changelog"`，不必装 changelog-github。

---

## @changesets/git：Git 能力与脚本用法

CLI 在执行 `version` / `publish` 和 CI 相关逻辑时，内部会调用 **@changesets/git**。除此之外，你在**自定义发版脚本或 CI 检查**里也会用到。

### 安装与引入

若只装了 `@changesets/cli`，其依赖里已包含 `@changesets/git`；若要在自己的脚本里直接调用，需在根或工具包中安装：

```bash
pnpm add -Dw @changesets/git
```

```javascript
import { getCurrentBranch, getChangedPackagesSinceRef, getCommitsThatAddChangesets } from '@changesets/git';
```

### 常用 API

| API | 说明 | 典型用法 |
|-----|------|----------|
| `getCurrentBranch(cwd)` | 当前分支名 | 发版前检查是否在 `main` |
| `getChangedPackagesSinceRef({ cwd, ref })` | 自某 ref（如 `main`）以来有变更的包列表 | 决定要跑哪些包测试、是否发布 |
| `getCommitsThatAddChangesets({ cwd })` | 新增了 changeset 文件的 commit | 判断是否有待应用的 changeset |

### 在自定义脚本里做「发版前检查」

```javascript
import { getCurrentBranch } from '@changesets/git';

const cwd = process.cwd();
const branch = await getCurrentBranch(cwd);
if (branch !== 'main') {
  console.error('请在 main 分支执行发布');
  process.exit(1);
}
```

### 和 CLI 的分工

- **不需要自己写**：正常用 `changeset version`、`changeset publish` 时，分支与变更包等由 CLI 内部通过 @changesets/git 处理。
- **需要自己写**：在 CI 里「仅 main 可发布、未提交就失败」、或写「只发布某 ref 之后改过的包」等定制逻辑时，直接调 @changesets/git。

更细的 API 与用法见同目录 [changesets-git.md](./changesets-git.md)。

---

## 完整工作流示例

### 1. 首次安装与配置

```bash
pnpm add -Dw @changesets/cli @changesets/changelog-github @changesets/git
pnpm changeset init
```

编辑 `.changeset/config.json`，例如：

```json
{
  "changelog": ["@changesets/changelog-github", { "repo": "your-org/your-repo" }],
  "commit": false,
  "access": "public",
  "baseBranch": "main"
}
```

### 2. 日常开发：加 changeset

```bash
pnpm changeset
# 或 pnpm changeset add
```

按提示选择要发版的包、bump 类型（major/minor/patch）、写一句变更说明，确认后生成 `.changeset/xxx.md`，**把该文件一并提交**。

### 3. 发版：升版本并写 CHANGELOG

在目标分支（如 `main`）上：

```bash
pnpm changeset version
```

会：提升各包版本、按 config 的 changelog 生成/更新 CHANGELOG、删除已消费的 changeset 文件。

### 4. 安装依赖并发布

```bash
pnpm install
git add -A && git commit -m "chore: update versions" && git push
pnpm changeset publish
# 若需先构建： pnpm build && pnpm changeset publish
```

若 Monorepo 用 `pnpm publish -r` 且希望统一由脚本执行，可在根 `package.json` 里加：

```json
{
  "scripts": {
    "ci:publish": "pnpm publish -r"
  }
}
```

之后发布时可执行 `pnpm ci:publish`（CI 里常用）。

---

## CI / GitHub Actions

### 1. 检查 PR 是否带 changeset

在 CI 里跑：

```bash
pnpm changeset status
```

若要求「每个 PR 都要有 changeset」，可在此步骤失败时直接让流水线失败；也可用 [Changeset Bot](https://github.com/apps/changeset-bot) 在 PR 里做提醒。

### 2. 用 changesets/action 自动 version + 发版

在 `.github/workflows/changesets.yml` 中示例：

```yaml
name: Changesets
on:
  push:
    branches: [main]
env:
  CI: true
jobs:
  version:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - name: 检出
        uses: actions/checkout@v4

      - name: 设置 pnpm
        uses: pnpm/action-setup@v4

      - name: 设置 Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: 安装依赖
        run: pnpm install

      - name: 创建版本并发布
        uses: changesets/action@v1
        with:
          commit: "chore: update versions"
          title: "chore: update versions"
          publish: pnpm ci:publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- 需在仓库设置里给 Actions **读+写** 权限；若发布到 npm，需配置 `NPM_TOKEN`。
- `publish: pnpm ci:publish` 表示在 version PR 合并后，由该步骤执行 `pnpm ci:publish`（即上面的 `pnpm publish -r`）。若包为 public，需在 npm 或 `publishConfig` 里设 `"access": "public"`。

---

## 最佳实践与速查

### 三者分工速查

| 需求 | 用的包 | 做法 |
|------|--------|------|
| 新增变更说明、升版本、发版 | @changesets/cli | `changeset` → `changeset version` → `changeset publish` |
| CHANGELOG 带 GitHub PR/作者链接 | @changesets/changelog-github | 在 config 里设 `changelog: ["@changesets/changelog-github", { "repo": "owner/repo" }]` |
| 在脚本/CI 里查分支、变更包、changeset 提交 | @changesets/git | `getCurrentBranch` / `getChangedPackagesSinceRef` / `getCommitsThatAddChangesets` |

### 建议

- changeset 文件（`.changeset/*.md`）**务必随 PR 一起提交**，否则 `changeset version` 不会包含这次变更。
- 发版前用 @changesets/git 做「是否在 main、工作区是否干净」等检查，可减少误发。
- 若发布到 npm 且为公开包，把 `config.json` 的 `access` 设为 `"public"`，或在各包 `publishConfig.access` 里设置。
- CI 里用 `changeset status` 或 Bot 保证「有代码改动就有 changeset」。

---

## 参考链接

- [Changesets 官网与文档](https://github.com/changesets/changesets)
- [Changesets 文档站（含 intro、CI）](https://changesets-docs.vercel.app/)
- [@changesets/cli（npm）](https://www.npmjs.com/package/@changesets/cli)
- [@changesets/changelog-github（npm）](https://www.npmjs.com/package/@changesets/changelog-github)
- [@changesets/git（npm）](https://www.npmjs.com/package/@changesets/git)
- [changesets/action（GitHub）](https://github.com/changesets/action)
- [pnpm + Changesets](https://pnpm.io/zh/using-changesets)
- 本目录 [changesets-git.md](./changesets-git.md) — @changesets/git 的 API 与用法细说
