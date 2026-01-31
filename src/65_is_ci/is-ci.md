# is-ci 学习文档

> 判断当前是否在 CI（持续集成）环境中运行；基于 ci-info 检测各类 CI 服务，支持程序调用与 CLI，常用于脚本里「本地不跑 / CI 才跑」的分支

## 📚 目录

1. [用大白话说：is-ci 是啥](#用大白话说is-ci-是啥)
2. [原理：怎么判断「在 CI 里」](#原理怎么判断在-ci-里)
3. [与 ci-info 的关系](#与-ci-info-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [程序调用与 CLI](#程序调用与-cli)
6. [支持的 CI 服务一览](#支持的-ci-服务一览)
7. [常见场景与示例](#常见场景与示例)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：is-ci 是啥

### 你遇到的问题（脚本要区分本地和 CI 时）

- **本地 vs CI 行为不同**：例如本地不跑耗时测试、不推覆盖率，CI 里才跑；或本地用交互式提示，CI 里用非交互。
- **不想手写环境变量判断**：各 CI（GitHub Actions、GitLab CI、Travis、Jenkins 等）环境变量名不一样，手写 `process.env.CI` 或 `process.env.GITHUB_ACTIONS` 易漏、难维护。
- **只想问一句「是不是在 CI 里」**：不需要知道具体是哪家 CI，只要 true/false 即可。

也就是说：**在「当前进程是否跑在 CI 环境」这件事上，给一个布尔值，并兼容主流 CI**，就是 is-ci 要解决的问题。

### is-ci 帮你做啥

**is-ci** 是一个 **判断「是否在 CI 中运行」** 的小工具：

1. **一个布尔值**：`import isCI from 'is-ci'`（或 `require('is-ci')`），`isCI` 为 `true` 表示在 CI 中，否则为 `false`。
2. **底层用 ci-info**：内部依赖 [ci-info](https://github.com/watson/ci-info)，通过各 CI 服务设置的环境变量（如 `CI`、`GITHUB_ACTIONS`、`GITLAB_CI`、`TRAVIS` 等）判断，支持几十种 CI。
3. **两种用法**：**程序调用**（if (isCI) { ... }）和 **CLI**（`is-ci && echo "在 CI 里"`）；CLI 在 CI 里退出码 0，非 CI 里非 0，便于在 shell 脚本里做条件执行。

一句话：**is-ci = 读环境变量 → 按 ci-info 规则判断 → 暴露一个布尔值（及 CLI）**，让你在脚本里根据「是否在 CI」分支逻辑。

---

## 原理：怎么判断「在 CI 里」

### 1. 通用标志：CI / CONTINUOUS_INTEGRATION

- 很多 CI 会设置 **`CI=true`** 或 **`CONTINUOUS_INTEGRATION=true`**，作为「通用」标志；ci-info 会先看这些，有则认为在 CI 中。
- 部分未设置 `CI` 的 CI，则靠**各厂商自己的环境变量**识别（见下节）。

### 2. 各厂商环境变量

- **GitHub Actions**：`GITHUB_ACTIONS=true`
- **GitLab CI**：`GITLAB_CI=true`
- **Travis CI**：`TRAVIS=true`
- **CircleCI**：`CIRCLECI=true`
- **Jenkins**：`JENKINS_URL` 等
- **Azure Pipelines**：`TF_BUILD` 等
- ……

ci-info 内置一份「厂商 → 环境变量」的映射；只要当前环境里存在对应变量，就认为在该 CI 中，并设 `isCI = true`。

### 3. 关闭检测：CI=false

- 若在 CI 机器上跑脚本但**不想被当成 CI**（例如调试），可设置 **`CI=false`**，ci-info 会尊重该值，`isCI` 为 false。

可以简单记：**通用 CI 变量 + 各厂商变量 → 有一个命中即 isCI；显式 CI=false 可关**。

---

## 与 ci-info 的关系

| 角色 | 作用 |
|------|------|
| **ci-info** | 检测当前 CI 环境，暴露 `isCI`、`name`、`isPR` 以及各厂商布尔（如 `ci.GITHUB_ACTIONS`、`ci.TRAVIS`）。 |
| **is-ci** | 只暴露「是否在 CI」这一个布尔值（及 CLI），内部直接依赖 ci-info 的 `isCI`。 |

- **只要「是不是 CI」** → 用 **is-ci** 即可。
- **还要「哪家 CI」「是不是 PR 构建」** → 直接用 **ci-info**（`ci.name`、`ci.isPR`、`ci.GITHUB_ACTIONS` 等）。

---

## 安装与使用方式

### 安装

```bash
pnpm add is-ci
# 或
npm i is-ci
```

通常作为 **dependencies** 即可（脚本/工具里会用到）；若只在开发或 CI 脚本里用，也可放 **devDependencies**。

### 使用

- **程序**：`import isCI from 'is-ci'`（ESM）或 `const isCI = require('is-ci')`（CJS），然后 `if (isCI) { ... }`。
- **CLI**：全局安装后 `is-ci && 命令`，或 `./node_modules/.bin/is-ci` / `npx is-ci`；在 CI 里退出码 0，非 CI 里非 0。

---

## 程序调用与 CLI

### 程序调用（Node）

```js
import isCI from "is-ci";

if (isCI) {
  console.log("当前在 CI 环境中");
} else {
  console.log("当前在本地或非 CI 环境");
}
```

- **ESM**：`import isCI from 'is-ci'`；**CJS**：`const isCI = require('is-ci')`。
- `isCI` 为 **boolean**，只读，无配置项。

### CLI

```bash
# 在 CI 里才执行后续命令
is-ci && echo "在 CI 里"

# 在 npm scripts 里常见用法
"scripts": {
  "test:ci": "is-ci && node run-heavy-tests.js",
  "postinstall": "is-ci || husky install"
}
```

- **在 CI 中**：`is-ci` 退出码 **0**，`&&` 后面的命令会执行。
- **不在 CI 中**：`is-ci` 退出码 **非 0**，`&&` 后面的命令不执行；`is-ci || 命令` 表示「非 CI 才执行」。

---

## 支持的 CI 服务一览

is-ci 通过 **ci-info** 支持众多 CI，例如（仅列举部分）：

| CI 服务 | 说明 |
|--------|------|
| **GitHub Actions** | GITHUB_ACTIONS |
| **GitLab CI** | GITLAB_CI |
| **Travis CI** | TRAVIS |
| **CircleCI** | CIRCLECI |
| **Jenkins** | JENKINS_URL 等 |
| **Azure Pipelines** | TF_BUILD |
| **AppVeyor** | APPVEYOR |
| **Bitbucket Pipelines** | BITBUCKET_BUILD_NUMBER 等 |
| **Buildkite** | BUILDKITE |
| **Netlify** | NETLIFY |
| **Vercel** | VERCEL |
| **……** | 见 [ci-info 文档](https://github.com/watson/ci-info#supported-ci-tools) 完整列表 |

未在列表里的 CI 若设置了 **`CI=true`**，is-ci 仍会返回 `true`（ci-info 会认通用变量）。

---

## 常见场景与示例

### 1. 只在 CI 里跑耗时测试

```js
import isCI from "is-ci";
import { runTests } from "./test-runner.js";

if (isCI) {
  await runTests({ coverage: true, slow: true });
} else {
  await runTests({ coverage: false, slow: false });
}
```

### 2. 本地不装 husky，CI 不跑 husky install

```json
{
  "scripts": {
    "postinstall": "is-ci || husky install"
  }
}
```

### 3. 只在非 CI 时用交互式提示

```js
import isCI from "is-ci";
import inquirer from "inquirer";

const answer = isCI
  ? { confirm: true }
  : await inquirer.prompt([{ type: "confirm", name: "confirm", message: "继续？" }]);
```

### 4. Shell 里按是否 CI 分支

```bash
if is-ci; then
  echo "CI: 跳过交互"
  npm run build -- --no-interactive
else
  npm run build
fi
```

---

## 参考与延伸阅读

- [is-ci npm](https://www.npmjs.com/package/is-ci)
- [is-ci GitHub](https://github.com/watson/is-ci)
- [ci-info](https://github.com/watson/ci-info)（支持的 CI 列表与 API）

---

**小结**：is-ci 通过 ci-info 根据环境变量判断是否在 CI 中，只暴露一个布尔值和 CLI；脚本里用 `if (isCI)` 或 `is-ci && 命令` 即可按「本地 / CI」分支，需要具体厂商或 PR 信息时用 ci-info。
