# CI/CD 从零开始学习指南

> 用最通俗的话，把「持续集成」和「持续交付/部署」讲清楚，并学会自己搭一条最简单的流水线。

## 📚 目录
1. [用一句话理解 CI/CD](#用一句话理解-cicd)
2. [原理：流水线如何自动跑起来](#原理流水线如何自动跑起来)
3. [没有 CI/CD 时，大家怎么做？](#没有-cicd-时大家怎么做)
4. [CI 和 CD 分别是什么？](#ci-和-cd-分别是什么)
5. [CI/CD 里常见的几个词](#cicd-里常见的几个词)
6. [一条流水线长什么样？](#一条流水线长什么样)
7. [自己搭一条「最小流水线」：GitHub Actions 示例](#自己搭一条最小流水线github-actions-示例)
8. [常见平台与怎么选](#常见平台与怎么选)
9. [从零到「能跑」的检查清单](#从零到能跑的检查清单)
10. [延伸：和发版、Changesets 的关系](#延伸和发版changesets-的关系)
11. [参考链接](#参考链接)

---

## 用一句话理解 CI/CD

**CI/CD = 「代码一有变动，就自动帮你测一遍、构建一遍，甚至自动发布出去」。**

可以把它想成一条**自动化流水线**：

- 你**提交/合并代码**（推一下按钮）
- 系统**自动**：安装依赖 → 跑测试 → 打包 →（可选）部署到服务器或发到 npm

不用再自己记得「每次合并前先本地跑一遍 lint、test、build」，也不用再手忙脚乱地「传包、上传服务器」——这些都可以交给 CI/CD 按你写好的步骤自动执行。

---

## 原理：流水线如何自动跑起来

CI/CD 的核心是：**由「触发器」在代码变动时（如 push、PR）启动一个「任务环境」，按配置文件里写好的步骤（安装依赖、测试、构建、部署）依次执行，并把结果（成功/失败、产物）反馈给仓库或部署目标**。

1. **触发器**：当发生「push 到某分支」「创建/更新 PR」「打 tag」等事件时，CI 平台（如 GitHub Actions、GitLab CI）根据配置文件（如 .github/workflows/*.yml）决定是否启动流水线。
2. **任务环境**：在一个干净的环境（虚拟机或容器）里拉取代码、安装依赖（Node、pnpm 等），保证每次运行环境一致，避免「我本地好的」差异。
3. **步骤编排**：配置文件里定义 job 和 step（如 `pnpm install` → `pnpm test` → `pnpm build`）；步骤按顺序执行，某步失败可中止后续或仅报告；产物（如 dist）可上传为 artifact 或推到部署目标。
4. **CD 延伸**：若配置了「部署」步骤，在 build 成功后自动把产物发布到服务器或 npm；密钥、环境变量由 CI 平台注入，不写进代码。

---

## 没有 CI/CD 时，大家怎么做？

先看**以前常见做法**，更容易理解 CI/CD 在解决什么：

| 做法 | 问题 |
|------|------|
| 合并前每个人自己本地跑 `npm test`、`npm run build` | 有人会忘跑，有人环境不一样，结果「我本地好的，合进去就挂了」 |
| 发版前由某个人「手动」打包、上传、部署 | 慢、容易漏步骤、换一个人就不知道到底点了哪些按钮 |
| 新同事问「怎么发布？」 | 要口口相传或写很长一份文档，还容易过期 |

**CI/CD 做的事**，就是把「跑测试、构建、发版」这些步骤**写进配置文件**，让**同一套流程**在每次代码变动时**自动、统一**地执行，减少人为遗漏和环境差异。

---

## CI 和 CD 分别是什么？

### CI = 持续集成（Continuous Integration）

**通俗说**：每次有人把代码合进来，就**自动**在服务器上「拉代码 → 装依赖 → 跑测试 / 跑 lint」，看有没有错。

**重点**：  
不用你本机跑，也不用你记得跑；**一 push / 一合并，流水线就触发**，结果用绿色勾 / 红色叉告诉你「这次合进去的代码过没过」。

---

### CD = 持续交付 / 持续部署（Continuous Delivery / Deployment）

**通俗说**：在「测试都通过」的前提下，**自动**把代码变成可发布的产物（比如 npm 包、前端静态文件），并**可选地**自动部署到线上。

- **持续交付（Delivery）**：自动打好包、准备好，但**最后一步「上线」还是人点**。
- **持续部署（Deployment）**：连**上线**也自动做，代码一合进 main，过一会儿线上就是新版本。

很多地方会把这两个都叫 CD，不用纠结——核心都是：**把「发布 / 部署」也自动化**。

---

### 一句话对照

| 词 | 一句话 |
|----|--------|
| **CI** | 代码一合并，就**自动测、自动构建**，保证「合进来的代码是健康的」。 |
| **CD** | 在 CI 通过后，**自动**完成「打包、发布、甚至上线」。 |

---

## CI/CD 里常见的几个词

看文档、教程时会反复遇到，先混个眼熟即可。

| 词 | 通俗理解 |
|----|----------|
| **流水线 / Pipeline** | 一整套自动步骤：拉代码 → 装依赖 → 测试 → 构建 → （可选）部署。 |
| **Job / 任务** | 流水线里的一步，比如「跑单元测试」就是一个 job。 |
| **Step / 步骤** | Job 里更细的一步，比如「安装 pnpm」「执行 pnpm test」。 |
| **触发器 / Trigger** | 什么情况会启动这条流水线？常见：push、pull_request、定时、手动。 |
| **Runner / 执行器** | 真正跑流水线的那台机器（可能是 GitHub 给的临时虚拟机，也可能是你们自己的服务器）。 |
| **Artifact / 制品** | 流水线跑出来的结果物，比如 zip 包、npm 包、前端打包好的 `dist/`。 |
| **Secret / 密钥** | 密码、API Token 等，存在平台的「秘密变量」里，脚本里用变量名取，不写在代码里。 |

---

## 一条流水线长什么样？

可以抽象成**顺序执行的几步**：

```
触发（例如：push 到 main）
    ↓
拉取代码（checkout）
    ↓
安装依赖（pnpm install / npm ci）
    ↓
跑 lint（pnpm lint）
    ↓
跑测试（pnpm test）
    ↓
构建（pnpm build）
    ↓
（可选）发布到 npm / 部署到服务器
```

不同平台都是用**配置文件**把上面这些「步骤」写出来；平台负责在**触发时**找一台机器，按顺序执行，并把日志、状态（成功/失败）展示给你。

---

## 自己搭一条「最小流水线」：GitHub Actions 示例

下面用 **GitHub Actions** 做例子，因为和 GitHub 仓库天然在一起，不用另建 Jenkins 等，最容易「从 0 跑通」。

### 你要准备的东西

1. 一个 **GitHub 仓库**（可以是你的项目，也可以是拿来练手的新库）。
2. 在仓库里加一个**工作流文件**，路径固定为：  
   `.github/workflows/xxx.yml`  
   例如：`.github/workflows/ci.yml`。

### 最小可运行示例：push 时自动 install + test

在项目根目录新建：**.github/workflows/ci.yml**，内容如下：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: 拉取代码
        uses: actions/checkout@v4

      - name: 安装 pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: 安装 Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: 安装依赖
        run: pnpm install --frozen-lockfile

      - name: 跑测试
        run: pnpm test
```

**这段在说什么？**（对照前面几个词）

- **name: CI**：这条流水线叫「CI」。
- **on: push / pull_request**：**触发器**——有人推代码或提 PR 到 `main` 时，自动跑。
- **jobs.test**：一个名为 `test` 的 **job**。
- **runs-on: ubuntu-latest**：在 GitHub 提供的 **Ubuntu 虚拟机**上跑。
- **steps**：里面的每一步是一个 **step**（拉代码、装 pnpm、装 Node、装依赖、跑测试）。

把上面文件**提交并 push** 到 GitHub，之后每次往 `main` 推送或针对 `main` 提 PR，GitHub 都会自动跑这条流水线；在仓库的 **Actions** 页可以看到每次运行的结果（成功/失败、日志）。

本目录下的 **ci.example.yml** 即上述示例，可复制到项目根目录并改名为 `.github/workflows/ci.yml` 使用。

### 没有 pnpm、只用 npm 时

若项目用 npm，把「安装 pnpm」那一步去掉，并改成用 npm：

```yaml
      - name: 安装依赖
        run: npm ci

      - name: 跑测试
        run: npm test
```

`npm ci` 会根据 lock 文件安装，适合 CI 环境，速度快、结果稳定。

### 再加一步：构建

如果项目有 `npm run build` 或 `pnpm build`，可以在「跑测试」后面加一步：

```yaml
      - name: 构建
        run: pnpm build
```

这样这条流水线就完成了：**拉代码 → 装依赖 → 测试 → 构建**，已经是很实用的一条「最小 CI」。

---

## 常见平台与怎么选

| 平台 | 适合谁 | 特点（通俗版） |
|------|--------|------------------|
| **GitHub Actions** | 代码在 GitHub 的项目 | 和仓库在一起，配置在仓库里，免费额度对个人/小团队通常够用。 |
| **GitLab CI** | 代码在 GitLab 的项目 | 和 GitLab 深度整合，流水线用 `.gitlab-ci.yml` 写在仓库里。 |
| **Jenkins** | 想完全自己掌控、跑在自家机房 | 自己装服务器，灵活度高，但要自己维护。 |
| **Travis CI** | 老牌云上 CI | 早期用得多，现在很多人迁到 GitHub Actions。 |
| **其他**（如 Circle CI、云厂商自带的） | 按公司已有技术栈选 | 概念都差不多：写配置 → 触发 → 自动执行。 |

**从零学的话**：代码在 GitHub，就优先用 **GitHub Actions**，资料多、上手快。

---

## 从零到「能跑」的检查清单

按顺序做完，你就拥有一条真正在跑的 CI 了：

1. **有一个 GitHub 仓库**，并且本地能正常 push。
2. **在仓库根下建目录** `.github/workflows/`，在里面新建一个 `.yml` 文件（如 `ci.yml`）。
3. **按上面示例写好**：触发器用 `push` + `pull_request`，steps 里至少包含「拉代码 → 装依赖 → 跑测试」。
4. **把脚本里的命令改成你项目里真实存在的**：  
   - 若用 pnpm：保留 pnpm 的安装与 `pnpm install`、`pnpm test`；  
   - 若用 npm：改为 `npm ci`、`npm test`；  
   - 若没有 test：可先写成 `echo "ok"` 或 `npm run lint`，确保流水线能跑通。
5. **提交并 push 这个 workflow 文件**，到仓库的 **Actions** 里看是否出现一次运行，且为绿色成功。

到这里，你就已经**从 0 跑通了一条 CI**。之后再慢慢加 lint、build、甚至部署或发版步骤即可。

---

## 延伸：和发版、Changesets 的关系

- **CI** 可以在每次 PR 时跑 `changeset status`，检查「有没有带 changeset 文件」，避免忘记写变更说明。
- **CD** 可以和 **Changesets** 配合：例如在 `main` 上由 GitHub Action 执行 `changeset version` 和 `pnpm publish`，实现「合并即发版」。
- 发版用的 **NPM_TOKEN** 等敏感信息，应放在 GitHub 的 **Settings → Secrets** 里，在 workflow 里用 `secrets.NPM_TOKEN` 引用，不要写进代码。

这些在你把「最小 CI」跑熟之后，再结合 [changesets.md](../13_changesets_git/changesets.md) 里的 CI 示例一步步加即可。

---

## 参考链接

- [GitHub Actions 官方文档（英文）](https://docs.github.com/en/actions)
- [GitHub Actions 快速入门](https://docs.github.com/en/actions/quickstart)
- [pnpm 在 GitHub Actions 中的用法](https://pnpm.io/zh/continuous-integration)
- 本仓库 [Changesets 文档中的 CI 示例](../13_changesets_git/changesets.md#ci--github-actions)
- **新服务器发布前端**：同目录 [deploy-frontend-server.md](./deploy-frontend-server.md) — 从零在自建机上用 CI/CD 发布前端项目的完整示例
