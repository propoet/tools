# @changesets/git 从零开始学习指南

> **结合使用**：CLI、changelog-github、git 的一体化流程与配置见同目录 **[changesets.md](./changesets.md)**。

## 📚 目录
1. [什么是 @changesets/git](#什么是-changesetsgit)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 @changesets/git

@changesets/git 是 **Changesets 生态**里专门封装 **Git 操作**的库，在 Node 里执行 git 命令（如获取当前分支、未提交变更、打 tag 等），供 changesets 的版本与发布流程使用，也可在自定义脚本里复用。

### 为什么选择 @changesets/git？
- ✅ 为 changesets 设计，与 @changesets/cli、@changesets/apply-release-plan 等配套
- ✅ 封装 git 调用，统一错误与输出格式，便于在脚本里判断“是否有未提交、是否在 main 上”等
- ✅ 适合在 Monorepo 发版、CI 里做“发版前检查、打 tag、推分支”等

### 典型场景
- 发版前检查是否有未提交变更、是否在允许的分支上
- 在 CI 里获取当前分支、commit、tag，决定是否发布
- 与 @changesets/cli 一起用，实现“生成 changeset → 更新版本 → 发布”的自动化

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add @changesets/git
# 或 npm install @changesets/git
```

### 2. ESM 引入

```javascript
import * as git from '@changesets/git';
// 常用： getCurrentBranch, getCommitsThatAddChangesets, getChangedPackagesSinceRef, etc.
```

---

## 基础用法

### 1. 获取当前分支

```javascript
import { getCurrentBranch } from '@changesets/git';

const branch = await getCurrentBranch(cwd);
console.log(branch); // 'main' | 'develop' | ...
```

### 2. 获取“自从某 ref 以来有变更的包”（Monorepo）

```javascript
import { getChangedPackagesSinceRef } from '@changesets/git';

const changed = await getChangedPackagesSinceRef({
  cwd,
  ref: 'main',
});
// 返回 { name, dir }[] 等
```

### 3. 获取“新增了 changeset 的 commit”

```javascript
import { getCommitsThatAddChangesets } from '@changesets/git';

const commits = await getCommitsThatAddChangesets({ cwd });
// 用于判断是否有待应用的 changeset
```

### 4. 检查是否有未提交变更

常通过执行 `git status --porcelain` 或封装好的 API（若提供）判断工作区/暂存区是否干净，用于“发版前必须干净”的检查。

---

## 示例与组合

### 1. 发版前检查

```javascript
import { getCurrentBranch } from '@changesets/git';

const branch = await getCurrentBranch(process.cwd());
if (branch !== 'main') {
  console.error('请在 main 分支执行发布');
  process.exit(1);
}
```

### 2. 与 @changesets/cli 结合

changesets 的 `version`、`publish` 等命令内部会调用 @changesets/git 获取分支、变更包、changeset 提交等，一般无需手写；只有在写“自定义发布脚本”或 CI 条件判断时才直接调用 @changesets/git。

### 3. Monorepo 中“自上次发布以来的变更包”

```javascript
const changed = await getChangedPackagesSinceRef({
  cwd: process.cwd(),
  ref: 'origin/main',
});
// 据此决定哪些包需要发布、或跑哪些包的测试
```

---

## 高级特性

### 1. 常用 API（以官方文档为准）

| API | 说明 |
|-----|------|
| `getCurrentBranch(cwd)` | 当前分支名 |
| `getChangedPackagesSinceRef({ cwd, ref })` | 自某 ref 以来有变更的包列表 |
| `getCommitsThatAddChangesets({ cwd })` | 新增了 changeset 文件的 commit |
| 其他 | 见 [changesets 文档](https://github.com/changesets/changesets) |

### 2. cwd

多数接口接受 `cwd`，为仓库根目录（或 Monorepo 根），默认可传 `process.cwd()`。

---

## 最佳实践

- 与 @changesets/cli、@changesets/apply-release-plan 等一起用时，以官方推荐流程为主，@changesets/git 用于“需要自定义判断”的场景。
- 在 CI 里做“仅 main 可发布、有未提交就失败”等检查时，可直接调用 getCurrentBranch、git status 封装等。
- 不单独把 @changesets/git 当“通用 git 库”用，若只需要执行任意 git 命令，用 execa/shelljs 更合适。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 当前分支 | `await getCurrentBranch(cwd)` |
| 自某 ref 变更的包 | `await getChangedPackagesSinceRef({ cwd, ref })` |
| 新增 changeset 的 commit | `await getCommitsThatAddChangesets({ cwd })` |

---

## 参考与延伸

- [Changesets 官方](https://github.com/changesets/changesets)
- [@changesets/cli](https://www.npmjs.com/package/@changesets/cli) - changeset 生成、version、publish
- [execa](https://github.com/sindresorhus/execa) - 通用子进程/命令执行
