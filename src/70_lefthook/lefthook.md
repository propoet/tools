# lefthook 学习文档

> Git hooks 管理器，用配置文件定义 pre-commit、pre-push、commit-msg 等要执行的命令；Go 编写、单二进制、支持并行与文件过滤，Evil Martians 维护

## 📚 目录

1. [用大白话说：lefthook 是啥](#用大白话说lefthook-是啥)
2. [原理：Git hooks 与 lefthook 的角色](#原理git-hooks-与-lefthook-的角色)
3. [与 husky、lint-staged 的对比](#与-huskylint-staged-的对比)
4. [安装与使用方式](#安装与使用方式)
5. [配置文件与格式](#配置文件与格式)
6. [Hook 与 run：命令与文件占位符](#hook-与-run命令与文件占位符)
7. [过滤与执行控制](#过滤与执行控制)
8. [本地覆盖与 remotes](#本地覆盖与-remotes)
9. [常见场景与最佳实践](#常见场景与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：lefthook 是啥

### 你遇到的问题（想在 git 操作时自动跑检查时）

- **commit 前想自动 lint/格式化**：每次 commit 前跑 ESLint、Prettier、测试等，避免把坏代码推进仓库。
- **不想手写 .git/hooks 脚本**：原生 hooks 是每个开发者本地的脚本，难以统一、难版本化管理。
- **希望只检查本次改动的文件**：全量 lint 太慢，只想对 **staged** 或 **push 涉及** 的文件跑命令。
- **多语言/多工具**：项目里既有 JS/TS 又有 Go/Ruby，希望一套配置管所有 hooks，且执行快。

也就是说：**在「用一份配置统一管理 Git hooks、按需跑命令、支持并行与过滤」这件事上，提供轻量、跨语言的方案**，就是 lefthook 要解决的问题。

### lefthook 帮你做啥

**lefthook**（[Evil Martians](https://evilmartians.com/) 维护）是一个 **Git hooks 管理器**：

1. **配置驱动**：用 **lefthook.yml**（或 .toml/.json/.jsonc）定义各 hook（pre-commit、pre-push、commit-msg 等）要执行的 **commands**，无需手写 shell。
2. **文件占位符**：支持 **{staged_files}**、**{push_files}**、**{all_files}** 等，命令里只传入相关文件，配合 **glob**、**exclude** 做过滤。
3. **并行执行**：同一 hook 下多个命令可 **parallel: true** 并行跑，比串行快。
4. **单二进制**：Go 编译的单个可执行文件，无 Node 依赖，适合多语言项目；也可通过 npm 以 devDependency 安装并在 postinstall 里 `lefthook install`。
5. **本地覆盖**：**lefthook-local.yml** 可覆盖/追加配置，适合个人习惯且可加入 .gitignore。

一句话：**lefthook = 用 YAML/TOML/JSON 配置 Git hooks，支持按文件过滤、并行、本地覆盖**，适合多语言与 monorepo。

---

## 原理：Git hooks 与 lefthook 的角色

### 1. Git 原生 hooks

- Git 在 **.git/hooks/** 下提供一系列钩子（pre-commit、commit-msg、pre-push 等），对应脚本在特定时机被调用（如 commit 前执行 pre-commit）。
- 默认脚本是示例，需替换成实际逻辑；且 .git 不提交，无法靠仓库共享配置。

### 2. lefthook 做的事

- **lefthook install**：在 **.git/hooks/** 里写入「调用 lefthook」的脚本（如 pre-commit 里执行 `lefthook run pre-commit`），这样真正逻辑由 **配置文件** 决定。
- **lefthook run &lt;hook&gt;**：根据 **lefthook.yml** 里该 hook 的 **commands**，依次或并行执行 **run** 指定的命令，并把 **{staged_files}** 等替换成实际文件列表。
- 若某命令退出码非 0，hook 失败，Git 操作（如 commit）被中止。

可以简单记：**lefthook 把「要跑什么」从 .git/hooks 脚本移到配置文件，并统一处理文件列表与并行**。

---

## 与 husky、lint-staged 的对比

| 对比项       | lefthook              | husky                 | lint-staged           |
|--------------|------------------------|------------------------|------------------------|
| **实现**     | Go 单二进制            | Node，.husky/ 脚本     | Node，常与 husky 配合  |
| **配置**     | YAML/TOML/JSON 单文件  | .husky/*.sh 或 package.json | package.json 的 lint-staged |
| **依赖**     | 无 Node 依赖（或 npm 装一层） | 需 Node，依赖较多      | 需 Node                |
| **并行**     | 支持 parallel          | 需自己写               | 主要管「跑谁」         |
| **文件过滤** | 内置 glob/exclude      | 需配合 lint-staged 等  | 专门做「只跑 staged」  |
| **多语言**   | 语言无关               | 偏 JS 生态             | 偏 JS 生态             |
| **典型用途** | monorepo、多语言、要快 | 纯 JS/TS 项目          | 只对 staged 跑 lint    |

**简单记**：**要跨语言、要并行、要单文件配置** → **lefthook**；**纯 JS、习惯 husky** → **husky + lint-staged**。

---

## 安装与使用方式

### 安装（Node 项目）

```bash
pnpm add -D @evilmartians/lefthook
# 或
npm i -D @evilmartians/lefthook
```

安装后在 **package.json** 的 **scripts** 里加 **postinstall**（或手动执行一次）：

```json
{
  "scripts": {
    "postinstall": "lefthook install"
  }
}
```

这样 `pnpm install` 后会自动把 Git hooks 指向 lefthook。

### 其他安装方式

- **Go**：`go install github.com/evilmartians/lefthook@latest`
- **Homebrew**：`brew install lefthook`
- **npm 全局**：`npm i -g @evilmartians/lefthook`

### 常用命令

- **lefthook install**：安装/更新 .git/hooks，使各 hook 调用 lefthook。
- **lefthook run pre-commit**：手动跑 pre-commit（不依赖 git commit）。
- **lefthook run pre-push**：手动跑 pre-push。
- **lefthook uninstall**：移除 lefthook 安装的 hooks。

---

## 配置文件与格式

### 文件名（任选其一，项目内统一）

| 格式 | 文件名示例 |
|------|------------|
| YAML | `lefthook.yml`、`.lefthook.yml`、`.config/lefthook.yml` |
| TOML | `lefthook.toml`、`.lefthook.toml` |
| JSON | `lefthook.json`、`.lefthook.json` |
| JSONC | `lefthook.jsonc`、`.lefthook.jsonc` |

- 同一项目只用一种格式；若多处存在，只会有其中一个生效。
- **lefthook-local.\*** 可与主配置并存，用于本地覆盖（可加入 .gitignore）。

---

## Hook 与 run：命令与文件占位符

### 基本结构（YAML 示例）

```yaml
pre-commit:
  parallel: true
  commands:
    eslint:
      glob: "*.{js,ts,jsx,tsx}"
      run: pnpm eslint --fix {staged_files}
      stage_fixed: true
    stylelint:
      glob: "*.css"
      run: pnpm stylelint --fix {staged_files}
      stage_fixed: true
```

- **pre-commit**：对应 Git 的 pre-commit hook。
- **commands**：该 hook 下多个「任务」，每个有 **run**（必填）和可选 **glob**、**stage_fixed** 等。
- **run**：实际要执行的 shell 命令；其中的占位符会被替换。

### 文件占位符

| 占位符 | 含义 |
|--------|------|
| **{staged_files}** | 当前暂存区（staged）文件列表，用于 pre-commit 等 |
| **{push_files}** | 本次 push 涉及的文件，用于 pre-push |
| **{all_files}** | 当前被 git 跟踪的所有文件 |
| **{files}** | 由该 command 的 **files** 选项产生的文件列表（如 `files: git ls-files -m`） |
| **{1}**、**{2}**… | Git 传给该 hook 的参数（如 commit-msg 时 {1} 是提交信息文件路径） |

- 若文件很多，lefthook 会按命令行长度限制拆成多批依次执行。
- 需要带引号时可用 `"{staged_files}"` 或 `'{staged_files}'`（Windows 下双引号更稳妥）。

### 常用 command 选项

| 选项 | 说明 |
|------|------|
| **run** | 要执行的命令（必填），可含占位符 |
| **glob** | 只对匹配的文件执行（如 `*.js`、`*.{ts,tsx}`） |
| **exclude** | 排除某些路径/文件 |
| **stage_fixed** | 若命令修改了文件（如 --fix），是否自动 `git add` 这些文件 |
| **fail_text** | 失败时展示的自定义提示 |
| **root** | 在指定子目录下执行命令（如 monorepo 的 package） |

---

## 过滤与执行控制

### 过滤

- **glob**：只对匹配 glob 的文件执行该 command；未匹配到时可能不执行或传空列表（视版本而定）。
- **exclude**：排除路径，可与 **all_files** 等配合。
- **files**：自定义「文件列表」命令（如 `git diff --name-only --cached`），再在 run 里用 **{files}**。

### 执行控制

- **parallel: true**（hook 级）：该 hook 下多个 commands 并行执行。
- **piped**：前一个 command 的 stdout 作为下一个的 stdin（较少用）。
- **skip** / **only**：按环境、分支等条件跳过或只跑部分 command（见文档）。
- **tags**：给 command 打标签，便于用 **exclude_tags** 等批量控制。

---

## 本地覆盖与 remotes

### lefthook-local

- 新建 **lefthook-local.yml**（与主配置同格式），其中内容会**覆盖或合并**主配置。
- 可把 **lefthook-local.yml** 加入 **.gitignore**，这样每人本地配置不同也不会提交。
- 适合：本地多加一个 lint、本地用 Docker 跑命令等。

### remotes（远程配置）

- 在配置里通过 **remotes** 引用远程 YAML/TOML（如公司统一配置的 URL），lefthook 会拉取并合并。
- 优先级一般为：**本地主配置 > remotes > lefthook-local**（以文档为准）。

---

## 常见场景与最佳实践

### 1. pre-commit：只对 staged 的 JS/TS 跑 ESLint

```yaml
pre-commit:
  commands:
    eslint:
      glob: "*.{js,ts,jsx,tsx}"
      run: pnpm eslint --fix "{staged_files}"
      stage_fixed: true
```

### 2. pre-commit：并行跑 ESLint + Stylelint

```yaml
pre-commit:
  parallel: true
  commands:
    eslint:
      glob: "*.{js,ts,jsx,tsx}"
      run: pnpm eslint --fix {staged_files}
      stage_fixed: true
    stylelint:
      glob: "*.css"
      run: pnpm stylelint --fix {staged_files}
      stage_fixed: true
```

### 3. commit-msg：校验提交信息（如 Conventional Commits）

```yaml
commit-msg:
  commands:
    commitlint:
      run: pnpm exec commitlint --edit {1}
```

- **{1}** 是 Git 传入的提交信息文件路径。

### 4. pre-push：对将要 push 的代码跑测试

```yaml
pre-push:
  commands:
    test:
      run: pnpm test
```

### 5. 仅部分目录（monorepo）

用 **root** 或在 **run** 里写子目录路径；也可用 **glob** 限制在 `packages/*/src/**` 等。

---

## 参考与延伸阅读

- [lefthook 官网](https://lefthook.dev/)
- [Configuration](https://lefthook.dev/configuration/)
- [run / 文件占位符](https://lefthook.dev/configuration/run.html)
- [lefthook GitHub](https://github.com/evilmartians/lefthook)
- [Evil Martians - Lefthook](https://evilmartians.com/opensource/lefthook)

---

**小结**：lefthook 用一份 YAML/TOML/JSON 配置 Git hooks，通过 **run** 和 **{staged_files}** 等占位符按文件执行命令，支持 **parallel**、**glob**、**stage_fixed**；安装后执行 **lefthook install** 把 hooks 挂上，适合多语言与 monorepo。
