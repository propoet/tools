# @nolebase/vitepress-plugin-git-changelog 从零开始学习指南

## 📚 目录
1. [什么是 Git Changelog 插件](#什么是-git-changelog-插件)
2. [原理：Git 日志与构建时注入](#原理git-日志与构建时注入)
3. [安装与项目要求](#安装与项目要求)
3. [快速开始（两步集成）](#快速开始两步集成)
4. [Vite 插件配置](#vite-插件配置)
5. [主题与 UI 配置](#主题与-ui-配置)
6. [国际化与选项](#国际化与选项)
7. [Front Matter 与页面级控制](#front-matter-与页面级控制)
8. [CI/CD 与部署](#cicd-与部署)
9. [最佳实践](#最佳实践)

---

## 什么是 Git Changelog 插件

`@nolebase/vitepress-plugin-git-changelog` 是 **Nólëbase Integrations** 下的一个 VitePress 插件，用于在文档站中展示**基于 Git 的页面历史、变更记录和贡献者列表**，类似 [VueUse 文档](https://vueuse.org/core/useStorage/#contributors) 的「Contributors / File History」能力。无需额外数据库或在线服务，**仅依赖 Git 日志**即可在构建时生成 Changelog 与贡献者区块。

### 为什么选择它？
- ✅ **零额外服务**：不依赖数据库、不付费、不搭后台，Git 即数据源
- ✅ **构建时生成**：Changelog / 贡献者信息在构建阶段生成，访问快、稳定
- ✅ **可定制**：作者别名、邮箱映射、展示名、i18n 等均可配置
- ✅ **与 VitePress 设计一致**：默认主题风格、支持 VitePress i18n
- ✅ **无障碍**：遵循 a11y 实践，可配置 aria 等

### 典型场景
- 文档站每页底部展示「本页最后编辑时间」「查看完整历史」「贡献者头像与链接」
- 在 Markdown 中自动注入 Changelog / Contributors 区块，无需手写
- 多语言文档站：按 VitePress 语言码配置插件文案（如 `en`、`zh-CN`）

### 前置条件
- 项目为 **VitePress** 站点
- 项目在 **Git 仓库**内（插件依赖 Git 提交记录）
- 若在 CI/CD 中构建，需保证能拉取到**完整 Git 历史**（见 [CI/CD 与部署](#cicd-与部署)）

---

## 原理：Git 日志与构建时注入

**核心思路**：Changelog 与贡献者信息不存数据库，而是**在构建时对每个文档文件跑 Git 命令**，拿到该文件的 commit 历史、作者、时间，再生成结构化数据并注入到 VitePress 的页面数据或组件里，用户访问时直接渲染。

- **数据来源**：对每个 Markdown 源文件路径执行 `git log`（如 `git log --follow --format=... -- path`），解析出 commit hash、作者、邮箱、日期、摘要等；可选 `git shortlog` 做贡献者统计。
- **构建时执行**：Vite 插件在 `transform` 或 `generateBundle` 阶段挂载，在 Node 环境里执行 `child_process` 调用 `git`，把结果写入虚拟模块或注入到页面 frontmatter/data，这样最终 HTML 已包含 Changelog，无需运行时请求。
- **与 VitePress 集成**：通过 VitePress 的 `extendsMarkdown` 或主题扩展，在页面中注入 Vue 组件占位；组件从 Vite 注入的 data 或虚拟模块读取 Changelog/贡献者列表并渲染。

---

## 安装与项目要求

### 1. 安装依赖

```bash
npm i @nolebase/vitepress-plugin-git-changelog -D
# 或
pnpm add @nolebase/vitepress-plugin-git-changelog -D
# 或
yarn add @nolebase/vitepress-plugin-git-changelog -D
```

### 2. 项目结构示例

```
docs/
├── .vitepress/
│   ├── config.mts          # VitePress 主配置（在此配置 Vite 插件）
│   └── theme/
│       └── index.ts         # 主题配置（在此注册 Vue 插件与组件）
├── index.md
└── guide.md
```

### 3. TypeScript 项目注意

若使用 TypeScript，需在 `tsconfig` 中支持 ESM 与模块解析，例如：

```jsonc
// tsconfig.json 或 .vitepress/tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext"
  }
}
```

---

## 快速开始（两步集成）

集成分为两步：**① 配置 Vite 插件（拉取 Git 数据）**、**② 在主题中注册 Vue 插件（展示 UI）**。

### 步骤一：在 VitePress 主配置中注册 Vite 插件

在 **VitePress 主配置文件**（如 `docs/.vitepress/config.mts`）中引入并配置两个 Vite 插件：

- **GitChangelog**：在构建时从 Git 拉取提交与贡献者数据
- **GitChangelogMarkdownSection**：在 Markdown 中自动注入 Changelog / Contributors 区块（可选，若只用手动放置组件可不用）

```typescript
// docs/.vitepress/config.mts
import { defineConfig } from 'vitepress'
import { GitChangelog, GitChangelogMarkdownSection } from '@nolebase/vitepress-plugin-git-changelog/vite'

export default defineConfig({
  vite: {
    plugins: [
      GitChangelog({
        repoURL: () => 'https://github.com/your-org/your-repo',
        // 可选：mapAuthors 映射贡献者信息（别名、头像、链接等）
      }),
      GitChangelogMarkdownSection({
        // 可选：排除某些页面、禁用某类区块等
      }),
    ],
  },
  // ... 其他 VitePress 配置
})
```

**注意**：`repoURL`（或文档中的 `repo`）需指向当前仓库的 URL，用于生成「查看完整历史」等链接，一般为必填。

### 步骤二：在主题中安装 Vue 插件

在 **主题入口**（如 `docs/.vitepress/theme/index.ts`）中安装 Vue 插件，这样全局才能使用插件提供的组件或自动注入的区块。

```typescript
// docs/.vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { NolebaseGitChangelogPlugin } from '@nolebase/vitepress-plugin-git-changelog/client'

export const Theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(NolebaseGitChangelogPlugin)
  },
}
export default Theme
```

完成以上两步后，若使用了 `GitChangelogMarkdownSection`，页面会自动追加 Changelog / Contributors 区块；也可在 Markdown 中手动使用组件（见下文）。

---

## Vite 插件配置

### GitChangelog 插件（数据拉取）

| 选项 | 类型 | 说明 |
|------|------|------|
| `repoURL` | `string \| ()=> string` | 仓库 URL，用于生成「查看完整历史」等链接，**建议配置** |
| `mapAuthors` | `Array<{ name, email?, avatar?, link?, ... }>` | 贡献者信息映射：别名、头像、链接等，用于合并同一人多邮箱/多名字 |

**mapAuthors 示例**：将同一人的不同邮箱或名字合并为一个贡献者，并指定展示名、头像、链接：

```typescript
GitChangelog({
  repoURL: () => 'https://github.com/your-org/your-repo',
  mapAuthors: [
    {
      name: '张三',
      email: 'zhangsan@old.com',  // 旧邮箱
      avatar: 'https://...',
      link: 'https://github.com/zhangsan',
    },
    {
      name: '张三',
      email: 'zhangsan@new.com',  // 新邮箱，映射到同一人
    },
  ],
})
```

更多选项（如 `rewritePathsBy`、子模块等）见官方文档 [Configure Vite plugins](https://nolebase-integrations.ayaka.io/pages/en/integrations/vitepress-plugin-git-changelog/configure-vite-plugins)。

### GitChangelogMarkdownSection 插件（自动注入区块）

该插件会在页面末尾自动追加 Changelog、Contributors 等 Markdown 区块（对应内部组件）。可选配置示例：

| 选项 | 类型 | 说明 |
|------|------|------|
| `excludes` | `string[]` 等 | 全局排除某些页面，不注入区块 |
| `changelog` | `boolean` | 是否注入 Changelog 区块 |
| `contributors` | `boolean` | 是否注入 Contributors 区块 |

**排除单页**：在页面 Front Matter 中设置 `gitChangelog: false` 或 `gitContributors: false`（见 [Front Matter 与页面级控制](#front-matter-与页面级控制)）。

**全局排除**：在插件选项中配置 `excludes` 等。

---

## 主题与 UI 配置

### 两种配置方式

1. **安装 Vue 插件时传入配置**：`app.use(NolebaseGitChangelogPlugin, { ... })`
2. **使用 Vue 依赖注入**：`app.provide(InjectionKey, { ... })`，便于与 VitePress 主配置分离、类型更清晰

**方式一：安装时传参**

```typescript
import { NolebaseGitChangelogPlugin } from '@nolebase/vitepress-plugin-git-changelog/client'

app.use(NolebaseGitChangelogPlugin, {
  locales: { 'en': { changelog: { title: 'Changelog' } }, 'zh-CN': { ... } },
  numCommitHashLetters: 7,
  hideChangelogHeader: false,
  // ...
})
```

**方式二：依赖注入**

```typescript
import { InjectionKey } from '@nolebase/vitepress-plugin-git-changelog/client'

app.provide(InjectionKey, {
  locales: { ... },
  numCommitHashLetters: 7,
})
```

### 手动使用组件（按需引入）

若未使用 `GitChangelogMarkdownSection` 自动注入，可在自定义布局或 Markdown 中手动挂载组件：

```typescript
import {
  NolebaseGitChangelog,
  NolebaseGitContributors,
} from '@nolebase/vitepress-plugin-git-changelog/client'
```

在主题的 `Layout` 或单页中注册并使用 `<NolebaseGitChangelog />`、`<NolebaseGitContributors />` 即可。

### 仅用 UI 组件、不用 Vite 数据插件时

若只使用 UI 组件而不使用 Git 数据插件，需在 Vite 中手动配置：

```typescript
// vite 配置片段
export default defineConfig({
  optimizeDeps: {
    exclude: ['@nolebase/vitepress-plugin-git-changelog/client'],
  },
  ssr: {
    noExternal: ['@nolebase/vitepress-plugin-git-changelog', '@nolebase/ui'],
  },
})
```

---

## 国际化与选项

### UI 配置项概览

| 选项 | 类型 | 说明 |
|------|------|------|
| `locales` | `Record<string, Locale>` | 按 VitePress 语言码配置文案（见下） |
| `numCommitHashLetters` | `number` | 展示的 commit hash 位数，默认 7 |
| `commitsRelativeTime` | `boolean` | 是否以「x days ago」等形式显示相对时间 |
| `hideChangelogHeader` | `boolean` | 是否隐藏 Changelog 标题 |
| `hideChangelogNoChangesText` | `boolean` | 无变更时是否隐藏「No changes」文案 |
| `hideContributorsHeader` | `boolean` | 是否隐藏贡献者标题 |
| `hideSortBy` | `boolean` | 是否隐藏「排序方式」按钮 |
| `displayAuthorsInsideCommitLine` | `boolean` | 是否在提交行内展示作者 |

### locales 与 Locale 结构

`locales` 的 key 需与 VitePress 的 i18n 语言码一致（如 `en`、`zh-CN`）。插件**不使用 vue-i18n**，而是用自带的 `locales` 配置覆盖默认文案。

**Locale 结构示例**：

```typescript
interface Locale {
  changelog?: {
    title?: string
    noData?: string
    lastEdited?: string           // 支持 {{daysAgo}} 等占位
    lastEditedDateFnsLocaleName?: string  // date-fns 语言名，如 'enUS', 'zhCN'
    viewFullHistory?: string
    committedOn?: string          // 支持 {{date}}
  }
  contributors?: {
    title?: string
    noData?: string
  }
}
```

**示例**：

```typescript
locales: {
  'en': {
    changelog: {
      title: 'Changelog',
      noData: 'No recent changes',
      lastEdited: 'This page was last edited {{daysAgo}}',
      lastEditedDateFnsLocaleName: 'enUS',
      viewFullHistory: 'View full history',
      committedOn: ' on {{date}}',
    },
    contributors: { title: 'Contributors', noData: 'No contributors' },
  },
  'zh-CN': {
    changelog: {
      title: '页面历史',
      noData: '暂无最近变更历史',
      lastEdited: '本页面最后编辑于 {{daysAgo}}',
      lastEditedDateFnsLocaleName: 'zhCN',
      viewFullHistory: '查看完整历史',
      committedOn: '于 {{date}} 提交',
    },
    contributors: { title: '贡献者', noData: '暂无贡献者' },
  },
}
```

---

## Front Matter 与页面级控制

### 排除当前页的 Changelog / 贡献者

在页面 Markdown 的 Front Matter 中：

```yaml
---
gitChangelog: false      # 不展示本页 Changelog
gitContributors: false  # 不展示本页贡献者
---
```

### 为当前页补充贡献者

Git 可能未记录某些贡献者，可在 Front Matter 中补充作者名（会与 Git 解析出的作者合并）：

```yaml
---
authors: ['作者1', '作者2']
---
```

注意：这里填写的名字不会经过 Vite 插件 `mapAuthors` 的映射，若使用了 `mapAuthors`，这里应填映射后的 `name`，否则会视为独立作者。

---

## CI/CD 与部署

插件依赖 **完整 Git 历史** 才能正确生成 Changelog 与贡献者。CI 默认浅克隆（shallow clone）会缺少历史，需显式拉取完整历史。

### GitHub Actions

在 checkout 步骤中增加 `fetch-depth: 0`：

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### GitLab CI

确保克隆时带完整历史（默认一般为完整克隆，若有浅克隆需改为完整克隆）。

### Vercel

默认环境可能拿不到完整 Git 历史。可设置环境变量（非稳定 API，后续可能移除）：

```env
VERCEL_DEEP_CLONE=1
```

更稳妥的方式是：在 GitHub Actions / GitLab CI 中构建产物，再用 Vercel CLI 等方式部署该产物。

### Netlify / Cloudflare Pages

- **Netlify**：一般可拿到完整 Git 历史。
- **Cloudflare Pages**：自带的 Git 集成通常无法拿到完整历史，建议在 GitHub Actions 等环境中构建，再通过 Wrangler 或 pages 的部署方式上传构建结果。

### 贡献者头像与链接

- 若 commit 邮箱为 GitHub 的 no-reply 邮箱，插件会尝试解析 GitHub 用户名并拉取头像、个人页链接。
- 否则可用 Gravatar 等基于邮箱到头像的解析，或通过 `mapAuthors` 手动指定头像与链接。

---

## 最佳实践

1. **始终配置 repoURL**：便于「查看完整历史」等链接正确跳转到仓库。
2. **CI 中保证完整 Git 历史**：在使用的 CI 中设置 `fetch-depth: 0` 或等效配置，避免 Changelog/贡献者为空。
3. **i18n 与 VitePress 对齐**：`locales` 的 key 与 VitePress 的 `locales.lang` 一致，避免语言切换后文案错位。
4. **按需使用 MarkdownSection**：若全站都要 Changelog/贡献者，用 `GitChangelogMarkdownSection` 最省事；若只有部分页面需要，可关闭自动注入，在需要的页面用自定义 Layout 或组件手写。
5. **善用 mapAuthors**：多人协作、改过邮箱/名字时，用 `mapAuthors` 合并为同一贡献者，展示更清晰。
6. **仅用 UI 时记得 Vite 配置**：不启用 Git 数据插件时，需在 Vite 中配置 `optimizeDeps.exclude` 和 `ssr.noExternal`，避免构建/SSR 报错。

---

## 参考链接

- [npm: @nolebase/vitepress-plugin-git-changelog](https://www.npmjs.com/package/@nolebase/vitepress-plugin-git-changelog)
- [官方文档：Changelog & File history](https://nolebase-integrations.ayaka.io/pages/en/integrations/vitepress-plugin-git-changelog/)
- [Getting started](https://nolebase-integrations.ayaka.io/pages/en/integrations/vitepress-plugin-git-changelog/getting-started)
- [Configure UI](https://nolebase-integrations.ayaka.io/pages/en/integrations/vitepress-plugin-git-changelog/configure-ui)
- [Configure Vite plugins](https://nolebase-integrations.ayaka.io/pages/en/integrations/vitepress-plugin-git-changelog/configure-vite-plugins)
- [GitHub: nolebase/integrations](https://github.com/nolebase/integrations)
