# cz-git + czg 学习文档

> cz-git：Commitizen 适配器，交互式生成 Conventional Commit；czg：零依赖的独立 CLI，内置 cz-git 核心，开箱即用

## 📚 目录

1. [用大白话说：cz-git 和 czg 是啥](#用大白话说cz-git-和-czg-是啥)
2. [两者关系与选型](#两者关系与选型)
3. [原理：如何生成提交信息](#原理如何生成提交信息)
4. [cz-git 安装与使用](#cz-git-安装与使用)
5. [czg 安装与使用](#czg-安装与使用)
6. [配置方式（共用一套配置）](#配置方式共用一套配置)
7. [与 Commitlint 的配合](#与-commitlint-的配合)
8. [czg 子命令与选项](#czg-子命令与选项)
9. [常见坑与最佳实践](#常见坑与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：cz-git 和 czg 是啥

### 你遇到的问题（手写 commit 时）

- **格式不统一**：有人写 `fix bug`，有人写 `Fix: 修复登录`，有人写 `fix(auth): 修复登录失败`，历史乱七八糟。
- **记不住规范**：Conventional Commits 的 type、scope、subject 怎么写，容易漏写或写错。
- **想配合 commitlint**：commitlint 只负责「校验」格式，不负责「帮你写」；提交时还是得自己敲一大串。

也就是说：**用交互式问答（选 type、填 scope、写 subject）自动拼出符合规范的 commit message**，就是 cz-git / czg 要解决的问题。

### cz-git 帮你做啥

**cz-git** 是一个 **Commitizen 的适配器（adapter）**：

1. **接在 Commitizen 后面**：你运行 `git cz` 或 `cz` 时，Commitizen 会调用「适配器」；cz-git 就是这个适配器，负责**交互式提问**（选类型、填 scope、写简述等）。
2. **生成标准格式**：根据你的选择拼成 `type(scope): subject` 等 Conventional 格式，再交给 git 完成提交。
3. **与 commitlint 共用配置**：cz-git 推荐把配置写在 **commitlint 配置文件**里（如 `.commitlintrc.js`），这样「生成时用的选项」和「校验时的规则」一致，避免写出来的被 commitlint 打回。

一句话：**cz-git = Commitizen 的「交互问卷」实现**，你选一选、填一填，它就帮你生成合规的 commit message。

### czg 帮你做啥

**czg** 是一个 **独立的 CLI**，不依赖 Commitizen：

1. **零依赖、开箱即用**：不用装 commitizen、不用在 package.json 里配 adapter，直接 `npx czg` 就能用。
2. **内置 cz-git 核心**：交互逻辑、配置加载、Conventional 格式和 cz-git 一致，只是以「单独一个命令」存在。
3. **更强功能**：支持 **OpenAI 生成 subject**（`czg ai`）、emoji 模式、break 模式、GPG 签名等；配置同样可用 `.czrc`、`cz.config.js`、commitlint 配置文件。

一句话：**czg = 把 cz-git 做成独立 CLI**，不依赖 Commitizen，更适合「随便进一个项目就想用」的场景。

---

## 两者关系与选型

| 对比项 | cz-git | czg |
|--------|--------|-----|
| **形态** | Commitizen 的 adapter，需配合 commitizen 使用 | 独立 CLI，可单独运行 |
| **安装** | 装 `cz-git` + `commitizen`，并在 package.json 里指定 `config.commitizen.path` | 装 `czg` 或直接 `npx czg` |
| **运行** | `git cz` 或 `cz`（依赖全局/项目里的 commitizen） | `czg` 或 `npx czg` |
| **配置** | commitlint 配置文件 或 package.json 的 config.commitizen | .czrc / cz.config.js / commitlint 配置（与 cz-git 兼容） |
| **适用** | 项目已用 commitizen、想统一用 `git cz` | 不想配 commitizen、要开箱即用或要用 AI/emoji 等 |

**简单记**：  
- 已经用 **Commitizen**、想换一个更好用的 adapter → 用 **cz-git**。  
- 不想装 Commitizen、想一个命令搞定或要用 **czg ai** → 用 **czg**。

---

## 原理：如何生成提交信息

**核心思路**：通过**交互式提问**收集 type、scope、subject、body、footer 等，按 **Conventional Commits** 拼成一条 commit message，再调用 `git commit -m "..."`（或等价方式）完成提交。

1. **读取配置**：从 commitlint 配置、.czrc、package.json 等读入 type 列表、scope 列表、是否 emoji、subject 长度限制等。
2. **交互式提问**：按顺序问「选 type」「选/填 scope」「写 subject」「选是否 body/footer」等；支持模糊搜索、多选（如 scope 用 checkbox）。
3. **拼成 message**：拼成 `type(scope): subject` 或 `type(scope)!: subject`（break）、加 body/footer。
4. **交给 Git**：把拼好的字符串传给 `git commit`，完成提交；若配合 commit-msg hook，会再被 commitlint 校验一遍。

**与 commitlint 的关系**：commitlint 只「检查」已有 message；cz-git/czg「生成」message。两者共用一套规则/配置时，生成出来的通常能通过校验。

---

## cz-git 安装与使用

### 作为项目依赖（推荐）

1. **安装**

```bash
pnpm add -D cz-git commitizen
# 或
npm i -D cz-git commitizen
```

2. **在 package.json 里指定适配器**

```json
{
  "scripts": {
    "commit": "git-cz"
  },
  "config": {
    "commitizen": {
      "path": "node_modules/cz-git"
    }
  }
}
```

3. **使用**

- 用脚本：`pnpm run commit` 或 `npm run commit`
- 若全局装了 commitizen：在项目目录下直接 `git cz` 或 `cz`

### 全局使用

```bash
npm i -g cz-git commitizen
echo '{ "path": "cz-git" }' > ~/.czrc
```

之后在任意项目目录执行 `git cz` 或 `cz` 即可（该项目无需再装 cz-git）。

### 可选配置

- **推荐**：在 **commitlint 配置文件**（如 `.commitlintrc.js`）里写 `prompt: { useEmoji: true, ... }`，与 commitlint 共用。
- **简单时**：在 `package.json` 的 `config.commitizen` 下加 `useEmoji: true` 等；或全局在 `~/.czrc` 里写 JSON。

---

## czg 安装与使用

### 不安装，直接跑（推荐先试）

```bash
npx czg
```

任意项目下执行即可，无需安装、无需配 commitizen。

### 项目内安装

```bash
pnpm add -D czg
# 或
npm i -D czg
```

在 package.json 里加脚本：

```json
{
  "scripts": {
    "commit": "czg"
  }
}
```

然后执行 `pnpm run commit` 或 `npm run commit`。

### 全局安装

```bash
npm i -g czg
```

之后在任意目录执行 `czg` 即可。

### 简单配置（项目根目录）

在项目根目录建 `.czrc`（JSON）：

```json
{
  "$schema": "https://raw.githubusercontent.com/Zhengqbbb/cz-git/refs/tags/v1.12.0/docs/public/schema/cz-git.json",
  "scopes": ["hello", "world"]
}
```

或使用 **cz.config.js**（可调用 czg 的 `definePrompt` / `defineConfig`）：

```js
const { definePrompt } = require('czg')
module.exports = definePrompt({
  scopes: ['hello', 'world'],
})
```

czg 会优先读项目下的 `.czrc`、`cz.config.js`、commitlint 配置等，与 cz-git 配置方式兼容。

---

## 配置方式（共用一套配置）

cz-git 和 czg 都支持以下方式（czg 内部使用与 cz-git 相同的配置加载逻辑）：

| 方式 | 说明 |
|------|------|
| **commitlint 配置文件** | `.commitlintrc.js`、`commitlint.config.js` 等，里边的 `prompt` 会被 cz-git/czg 使用；推荐和 commitlint 一起用时用这个 |
| **.czrc** | 项目根或用户目录下的 JSON 文件 |
| **cz.config.js** | 项目根下的 JS 配置，可用 `definePrompt`、`defineConfig` |
| **package.json** | `config.commitizen`（主要给 commitizen+cz-git 用） |

常见选项（在 `prompt` 或顶层）：`useEmoji`、`scopes`、`types`、`allowCustomScopes`、`subjectLimit` 等，详见 [cz-git 配置文档](https://cz-git.qbb.sh/config/)。

---

## 与 Commitlint 的配合

- **Commitlint**：在 `commit-msg` hook 里校验「已经写好的」commit message，不通过就拒绝提交。
- **cz-git / czg**：在提交「之前」用交互生成「符合规范的」message，从源头减少格式错误。

**推荐用法**：

1. 用 **commitlint 配置文件** 同时配置 commitlint 的 `rules` 和 cz-git/czg 的 `prompt`（或把 prompt 写在同文件里）。
2. 提交时用 `git cz` / `czg` 生成 message，再用 husky 的 `commit-msg` 跑 commitlint 校验；这样生成的 message 通常能通过校验。

示例（`.commitlintrc.js` 或 `commitlint.config.js`）：

```js
/** @type { import('cz-git').UserConfig } */
module.exports = {
  rule: { /* commitlint 规则 */ },
  prompt: {
    useEmoji: true,
    scopes: ['auth', 'ui', 'api'],
  },
}
```

---

## czg 子命令与选项

常用子命令（在本次运行中生效）：

| 子命令 | 说明 |
|--------|------|
| **czg** | 默认交互，生成 Conventional 格式 |
| **czg emoji** | 输出带 emoji 的 message |
| **czg break** | 在 type/scope 后加 `!`，表示 breaking change |
| **czg checkbox** | scope 用多选勾选 |
| **czg gpg** | 使用 GPG 签名提交 |
| **czg ai** | 用 OpenAI 生成 subject（需配置 API key） |

常用选项：

| 选项 | 说明 |
|------|------|
| `--alias=:fd` | 直接用预设别名提交（如 `:fd` 表示 fix + docs 等快捷组合） |
| `--config=路径` | 指定配置文件 |
| `-r, --retry` | 用上一次的 message 重试提交 |
| `--no-ai` | 本次关闭 AI 提示 |
| **OpenAI 相关** | `--api-key=`、`-M=模型`、`-N=数量` 等，用于 `czg ai` |

示例：

```bash
czg
czg emoji
czg break
czg --config="./config/cz.json"
czg ai -N=3 -M="gpt-4o"
```

---

## 常见坑与最佳实践

### 常见坑

1. **只装了 cz-git 没装 commitizen**：运行 `git cz` 会报错，项目内用 cz-git 时必须同时装 commitizen，并配置 `config.commitizen.path`。
2. **czg 和 commitlint 配置不一致**：若 type 或 scope 在 czg 里能选，但 commitlint 规则不认，会被打回；尽量用同一份配置（commitlint 配置文件里同时写 rule 和 prompt）。
3. **czg ai 报错**：未设 `OPENAI_API_KEY` 或 `--api-key`，或网络/代理问题；需在环境变量或 `.czrc` 里配置。

### 最佳实践

- **新项目 / 不想配 commitizen**：直接用 **czg**，`npx czg` 即可。
- **已有 commitizen、想更好用**：用 **cz-git** 替换原 adapter，并统一用 commitlint 配置文件写 prompt。
- **团队统一**：在 README 或贡献指南里写「请用 `pnpm run commit` 或 `czg` 提交」，配合 commitlint 保证历史格式一致。
- **要 AI 生成 subject**：用 `czg ai`，并妥善保管 API key（不要提交到仓库）。

---

## 参考与延伸阅读

- [cz-git 官网](https://cz-git.qbb.sh/)
- [cz-git Getting Started](https://cz-git.qbb.sh/guide/)：安装、commitizen 配置、全局使用
- [czg CLI](https://cz-git.qbb.sh/cli/)：czg 子命令、选项、示例
- [cz-git 配置](https://cz-git.qbb.sh/config/)：prompt 与配置项说明
- [Commitizen](https://commitizen.github.io/cz-cli/)：Commitizen 官方
- [Conventional Commits](https://www.conventionalcommits.org/)：提交格式规范

---

**小结**：**cz-git** 是 Commitizen 的适配器，用交互式问卷生成 Conventional Commit；**czg** 是内置 cz-git 核心的独立 CLI，零依赖、支持 AI，开箱即用。两者都可与 commitlint 共用配置，按项目是否已用 Commitizen 二选一即可。
