# standard-version 从零开始学习指南

## 📚 目录
1. [什么是 standard-version](#什么是-standard-version)
2. [原理：如何从提交历史生成版本与 CHANGELOG](#原理如何从提交历史生成版本与-changelog)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 standard-version

standard-version 是一个**基于 Conventional Commits 的自动发版工具**：根据 git 提交历史生成新版本号、更新 CHANGELOG、打 git tag，并可执行自定义脚本，适合“约定式提交 + 自动版本 + 单 CHANGELOG”的发布流程。

### 为什么选择 standard-version？
- ✅ 按 Conventional Commits（feat/fix/breaking 等）自动决定 bump 类型（minor/patch/major）
- ✅ 自动生成或追加 CHANGELOG.md
- ✅ 更新 package.json version、打 git tag、可选 commit
- ✅ 可配置 first-release、prerelease、scripts 等，与 CI 结合方便

### 典型场景
- 团队使用 feat/fix/BREAKING CHANGE 等约定式提交，希望自动生成版本与 CHANGELOG
- 单包或简单 Monorepo 的“发布前一条命令搞定版本+CHANGELOG+tag”
- 与 conventional-changelog 生态一致，可被 GitHub Actions 等调用

### 与 changesets 的区别
- **standard-version**：根据**已有 git 提交**自动算版本和 CHANGELOG，适合“先提交、再发布”。
- **changesets**：开发者**先写 changeset 文件**，再集中 version/publish，更适合 Monorepo 多包、需要精确控制每个包版本与 CHANGELOG 的场景。

---

## 原理：如何从提交历史生成版本与 CHANGELOG

standard-version 的核心是：**读取 git 提交历史 → 按 Conventional Commits 解析出 feat/fix/breaking 等 → 根据规则决定 bump 类型（major/minor/patch）→ 更新 package.json version、生成或追加 CHANGELOG、打 git tag**。

1. **读取提交**：从当前分支读取自上次 tag（或首次 commit）以来的提交信息，通常用 `git log` 或 git 库（如 simple-git）获取。
2. **解析约定式提交**：按 Conventional Commits 解析每条提交的 type（feat、fix、BREAKING CHANGE 等）；feat → minor bump，fix → patch，BREAKING CHANGE 或 major 类型 → major bump；取「最高」bump 决定新版本号。
3. **更新文件**：根据新版本号更新 package.json 的 version 字段；根据提交列表生成或追加 CHANGELOG.md（按 type 分组、格式化）。
4. **打 tag 与 commit**：用新版本号打 git tag（如 `v1.2.0`），可选地自动 commit 上述变更（version + CHANGELOG），便于与 CI 的「发布前一步」结合。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add -D standard-version
# 或 npm install -D standard-version
```

### 2. 使用方式

standard-version 是 **CLI 工具**，在 package.json scripts 或命令行里调用，无需在业务代码里 `import`：

```bash
npx standard-version
# 或
pnpm exec standard-version
```

---

## 基础用法

### 1. 首次发版（不依赖既有 tag）

```bash
npx standard-version --first-release
```

会根据当前提交算出版本、写 CHANGELOG、更新 package.json，但**不打 tag、不 commit**（常用于“从无到有”的第一次发版）。

### 2. 常规发版

```bash
npx standard-version
```

会：  
- 根据上次 tag 到 HEAD 的 conventional commits 决定 bump 类型  
- 更新 package.json 的 version  
- 追加或生成 CHANGELOG.md  
- 生成 git commit（可配置）、打 tag（默认 `v{version}`）

### 3. 预发布版本

```bash
npx standard-version --prerelease alpha
# 例如 1.2.0 -> 1.3.0-alpha.0
```

---

## 示例与组合

### 1. 在 package.json 里写 scripts

```json
{
  "scripts": {
    "release": "standard-version",
    "release:first": "standard-version --first-release",
    "release:alpha": "standard-version --prerelease alpha"
  }
}
```

### 2. 只生成 CHANGELOG、不 bump 版本

```bash
npx standard-version --release-as 1.0.0 --skip.tag --skip.commit
```

或通过 `.standard-version.json` / `versionrc` 配置 `skip.changelog`、`skip.bump` 等。

### 3. 指定本次版本号

```bash
npx standard-version --release-as 2.0.0
```

### 4. 与 CI 结合

在 CI 里在目标分支上执行 `standard-version`，再 `git push && git push --tags`；若希望“只在 main 且无未提交变更时发布”，可先做分支与 `git status` 检查（见 @changesets/git 或脚本）。

---

## 高级特性

### 1. 常用 CLI 参数

| 参数 | 说明 |
|------|------|
| `--first-release` | 首次发版，不依赖旧 tag，可选不打 tag/不 commit |
| `--release-as <version\|major\|minor\|patch>` | 指定版本或类型 |
| `--prerelease <id>` | 预发布，如 alpha、beta |
| `--skip.tag` / `--skip.commit` / `--skip.changelog` | 跳过某一步 |
| `--dry-run` | 只输出将要做的变更，不写文件、不 commit、不打 tag |

### 2. 配置文件

可在项目根目录使用：  
- `.standard-version.json`  
- 或 `versionrc` / `.versionrc.json` / `.versionrc.js`

配置项包括：  
- `types`：对应 conventional commits 类型与 bump 规则  
- `releaseCommitMessageFormat`：生成时用的 commit message  
- `scripts.preReleaseScript` 等：在 bump 前后执行自定义脚本  

详见 [standard-version 文档](https://github.com/conventional-changelog/standard-version)。

### 3. Conventional Commits 简记

- `feat:` → minor
- `fix:`、`perf:` 等 → patch
- `BREAKING CHANGE:` 或 `feat!:` → major

---

## 最佳实践

- 提交信息尽量符合 Conventional Commits，以便 standard-version 正确算版本和 CHANGELOG。
- 首次使用可用 `--dry-run` 看效果，再用 `--first-release` 做第一次发布。
- 在 CI 里使用时，确保在“允许发布”的分支上、且工作区干净，再执行 standard-version 并 push。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 常规发版 | `npx standard-version` |
| 首次发版 | `npx standard-version --first-release` |
| 指定版本 | `npx standard-version --release-as 2.0.0` |
| 预发布 | `npx standard-version --prerelease alpha` |
| 试跑 | `npx standard-version --dry-run` |

---

## 参考与延伸

- [standard-version GitHub](https://github.com/conventional-changelog/standard-version)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)
- [changesets](https://github.com/changesets/changesets) - 另一种发版与 CHANGELOG 方案
