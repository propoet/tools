# @commitlint/cli + @commitlint/config-conventional 学习与集成指南

## 📚 目录
1. [什么是 Commitlint](#什么是-commitlint)
2. [原理：如何检查提交信息](#原理如何检查提交信息)
3. [Conventional Commits 格式](#conventional-commits-格式)
4. [安装与基础配置](#安装与基础配置)
5. [@commitlint/config-conventional 规则说明](#commitlintconfig-conventional-规则说明)
6. [集成到 Git Hooks（Husky）](#集成到-git-hookshusky)
7. [集成到 Git Hooks（直接方式）](#集成到-git-hooks直接方式)
8. [配置文件详解](#配置文件详解)
9. [自定义规则](#自定义规则)
10. [CI/CD 集成](#cicd-集成)
11. [常见问题与最佳实践](#常见问题与最佳实践)
12. [参考链接](#参考链接)

---

## 什么是 Commitlint

**Commitlint** 是一个用于**检查 Git 提交信息格式**的工具，确保团队遵循统一的提交规范（如 [Conventional Commits](https://conventionalcommits.org/)），便于自动生成 CHANGELOG、语义化版本控制等。

### 为什么需要 Commitlint？

- ✅ **统一提交格式**：团队都用 `feat:`、`fix:` 等前缀，便于理解变更类型
- ✅ **自动生成 CHANGELOG**：配合工具（如 standard-version、changesets）自动从提交信息生成变更日志
- ✅ **语义化版本**：根据提交类型（feat = minor、fix = patch）自动决定版本号
- ✅ **代码审查更清晰**：PR 里一眼看出是「新功能」还是「修复 bug」
- ✅ **CI/CD 集成**：在 CI 里检查提交格式，不合规的 PR 直接拒绝

### 核心包

| 包 | 作用 |
|----|------|
| **@commitlint/cli** | 命令行工具，执行检查逻辑 |
| **@commitlint/config-conventional** | 基于 Conventional Commits 的预设配置 |

---

## 原理：如何检查提交信息

Commitlint 的核心是：**读取本次提交的 message（如从 git hook 或 CI 传入），按配置的规则（正则、Conventional 格式等）解析并校验，不通过则报错并退出非零，阻止提交或合并**。

1. **获取 message**：在 git commit-msg hook 里，通过 `git log -1 --pretty=%B` 或读取传入的临时文件得到本次提交的完整 message；在 CI 里可对 PR 的每个 commit 或合并后的 message 做同样校验。
2. **解析与规则**：按 Conventional Commits 拆成 type、scope、subject、body、footer；或按自定义正则校验；config-conventional 规定 type 枚举（feat、fix、docs 等）、subject 长度、body 格式等。
3. **校验结果**：若某条规则不满足，输出错误信息并 process.exit(1)；hook 里 exit 非零会令 git 拒绝完成提交；CI 里则令流水线失败。
4. **与 Husky 结合**：Husky 在 `.git/hooks/commit-msg` 中调用 `commitlint`，把当前提交的 message 通过 stdin 或文件传给 commitlint，实现「每次 commit 自动校验」。

---

## Conventional Commits 格式

Conventional Commits 的格式为：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 格式说明

- **type（必填）**：提交类型，如 `feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore` 等
- **scope（可选）**：影响范围，如 `(api)`、`(ui)`、`(auth)`
- **subject（必填）**：简短描述，首字母小写，不以句号结尾
- **body（可选）**：详细说明，与 subject 之间空一行
- **footer（可选）**：如 `BREAKING CHANGE:`、`Closes #123`

### 示例

```bash
# 新功能
feat(auth): add login with OAuth

# 修复 bug
fix(api): handle null response

# 文档
docs: update README

# 样式
style: format code with prettier

# 重构
refactor(utils): extract common logic

# 测试
test: add unit tests for auth

# 构建/工具
chore: update dependencies

# 性能
perf(db): optimize query

# 回滚
revert: revert "feat: add feature X"
```

---

## 安装与基础配置

### 1. 安装依赖

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
# 或
npm install -D @commitlint/cli @commitlint/config-conventional
```

### 2. 创建配置文件

在项目根目录创建 `commitlint.config.js`（或 `.commitlintrc.js`、`.commitlintrc.json` 等）：

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
};
```

**CJS 格式**（若项目用 CommonJS）：

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

**TypeScript 配置**（`commitlint.config.ts`）：

```typescript
import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
};

export default config;
```

### 3. 手动测试

```bash
# 检查最后一次提交
npx commitlint --from HEAD~1 --to HEAD --verbose

# 检查指定提交信息
echo "feat: add new feature" | npx commitlint

# 检查错误示例
echo "foo: some message" | npx commitlint  # 会失败，type 不在允许列表中
```

---

## @commitlint/config-conventional 规则说明

`@commitlint/config-conventional` 基于 Conventional Commits，包含以下规则：

### type-enum

**type 必须在允许列表中**：

允许的类型：`build`、`chore`、`ci`、`docs`、`feat`、`fix`、`perf`、`refactor`、`revert`、`style`、`test`

```bash
echo "foo: some message" | npx commitlint  # ❌ 失败
echo "feat: some message" | npx commitlint  # ✅ 通过
```

### type-case

**type 必须小写**：

```bash
echo "FIX: some message" | npx commitlint  # ❌ 失败
echo "fix: some message" | npx commitlint  # ✅ 通过
```

### type-empty

**type 不能为空**：

```bash
echo ": some message" | npx commitlint  # ❌ 失败
echo "fix: some message" | npx commitlint  # ✅ 通过
```

### subject-case

**subject 不能是特定格式**（不能是 sentence-case、start-case、pascal-case、upper-case）：

```bash
echo "fix: Some Message" | npx commitlint  # ❌ 失败（start-case）
echo "fix: SomeMessage" | npx commitlint   # ❌ 失败（pascal-case）
echo "fix: SOMEMESSAGE" | npx commitlint   # ❌ 失败（upper-case）
echo "fix: some message" | npx commitlint   # ✅ 通过（lower-case）
echo "fix: some Message" | npx commitlint  # ✅ 通过（允许首字母大写）
```

### subject-empty

**subject 不能为空**：

```bash
echo "fix:" | npx commitlint  # ❌ 失败
echo "fix: some message" | npx commitlint  # ✅ 通过
```

### subject-full-stop

**subject 不能以句号结尾**：

```bash
echo "fix: some message." | npx commitlint  # ❌ 失败
echo "fix: some message" | npx commitlint   # ✅ 通过
```

### header-max-length

**header（type + scope + subject）总长度不超过 100 字符**：

```bash
echo "fix: some message that is way too long and breaks the line max-length by several characters" | npx commitlint  # ❌ 失败
echo "fix: some message" | npx commitlint  # ✅ 通过
```

### body-leading-blank、footer-leading-blank

**body 和 footer 前必须有空行**（警告级别）：

```bash
echo -e "fix: some message\nbody" | npx commitlint  # ⚠️ 警告
echo -e "fix: some message\n\nbody" | npx commitlint  # ✅ 通过
```

### body-max-line-length、footer-max-line-length

**body 和 footer 每行不超过 100 字符**：

```bash
echo -e "fix: some message\n\nbody with multiple lines\nhas a message that is way too long and will break the line rule" | npx commitlint  # ❌ 失败
```

---

## 集成到 Git Hooks（Husky）

**Husky** 是管理 Git hooks 的常用工具，推荐用这种方式。

### 1. 安装 Husky

```bash
pnpm add -D husky
# 或
npm install -D husky
```

### 2. 初始化 Husky

```bash
npx husky init
```

这会创建 `.husky` 目录并添加 `prepare` 脚本到 `package.json`。

### 3. 添加 commit-msg Hook

**重要**：commitlint 必须用 **commit-msg** hook（不能用 pre-commit）。

```bash
# Linux / macOS
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg

# Windows (PowerShell)
echo "npx --no -- commitlint --edit `$1" > .husky/commit-msg

# Windows (Git Bash)
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

确保 `.husky/commit-msg` 文件有执行权限：

```bash
chmod +x .husky/commit-msg
```

### 4. 验证

```bash
# 尝试提交一个不合规的消息
git commit -m "foo: test"  # 应该失败

# 提交合规的消息
git commit -m "feat: add new feature"  # 应该通过
```

### 5. package.json 脚本（可选）

```json
{
  "scripts": {
    "commitlint": "commitlint --from HEAD~1 --to HEAD --verbose",
    "commitlint:all": "commitlint --from origin/main"
  }
}
```

---

## 集成到 Git Hooks（直接方式）

若不想用 Husky，可直接在 `.git/hooks/commit-msg` 写脚本。

### 1. 创建 commit-msg Hook

```bash
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/sh
npx --no -- commitlint --edit "$1"
EOF

chmod +x .git/hooks/commit-msg
```

**注意**：`.git/hooks/` 不会被提交到仓库，团队成员需各自执行上述命令。更推荐用 Husky，它会把 hooks 存在 `.husky/` 并提交到仓库。

---

## 配置文件详解

### 配置文件位置

commitlint 按以下顺序查找配置：

1. `.commitlintrc`
2. `.commitlintrc.json`、`.commitlintrc.yaml`、`.commitlintrc.yml`
3. `.commitlintrc.js`、`.commitlintrc.cjs`、`.commitlintrc.mjs`
4. `.commitlintrc.ts`、`.commitlintrc.cts`、`.commitlintrc.mts`
5. `commitlint.config.js`、`commitlint.config.cjs`、`commitlint.config.mjs`
6. `commitlint.config.ts`、`commitlint.config.cts`、`commitlint.config.mts`
7. `package.json` 中的 `commitlint` 字段

### 完整配置示例

```javascript
export default {
  // 继承预设配置
  extends: ['@commitlint/config-conventional'],

  // 自定义规则（会覆盖 extends 中的规则）
  rules: {
    'type-enum': [2, 'always', [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'chore',
      'revert',
      'build',
      'ci',
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },

  // 忽略某些提交（如合并、回滚、版本号等）
  ignores: [
    (commit) => commit.includes('Merge'),
    (commit) => commit.includes('Revert'),
    (commit) => /^v\d+\.\d+\.\d+/.test(commit),
  ],

  // 是否使用默认忽略规则
  defaultIgnores: true,

  // 失败时显示的帮助链接
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
```

### 规则级别

规则配置格式：`[level, applicable, value]`

- **level**：`0` = 禁用，`1` = 警告，`2` = 错误
- **applicable**：`'always'` 或 `'never'`
- **value**：规则的具体值（如允许的类型列表、最大长度等）

---

## 自定义规则

### 示例：添加自定义 type

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'chore',
      'revert',
      'build',
      'ci',
      'wip',  // 新增：进行中的工作
      'hotfix', // 新增：紧急修复
    ]],
  },
};
```

### 示例：放宽 subject-case

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 允许 sentence-case（首字母大写）
    'subject-case': [2, 'never', ['sentence-case']],
  },
};
```

### 示例：自定义 header 最大长度

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 120], // 改为 120 字符
  },
};
```

---

## CI/CD 集成

在 CI 里检查提交格式，不合规的 PR 直接拒绝。

### GitHub Actions 示例

```yaml
name: Lint Commits

on:
  pull_request:
    branches: [main]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 获取完整历史

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - run: npx commitlint --from origin/main --to HEAD --verbose
```

### GitLab CI 示例

```yaml
commitlint:
  image: node:20
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - npx commitlint --from $CI_MERGE_REQUEST_DIFF_BASE_SHA --to HEAD --verbose
  only:
    - merge_requests
```

---

## 常见问题与最佳实践

### 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `Please add rules to your commitlint.config.js` | 配置文件未找到或格式错误 | 确认文件在根目录，格式正确（ESM 或 CJS） |
| Windows 下 husky hook 不执行 | 文件编码或换行符问题 | 确保 `.husky/commit-msg` 是 UTF-8、LF 换行 |
| `npx: command not found` | 在 hook 里找不到 npx | 用 `npx --no -- commitlint` 或写完整路径 |
| 合并提交被检查 | 默认会忽略，但配置可能覆盖 | 检查 `ignores` 和 `defaultIgnores` |

### 最佳实践

1. **统一配置**：团队用同一份 `commitlint.config.js`，提交到仓库
2. **配合工具**：与 standard-version、changesets 等配合，自动生成 CHANGELOG
3. **CI 检查**：在 CI 里也跑 commitlint，避免绕过本地 hook
4. **渐进式**：先只检查 type 和 subject，再逐步加 body、footer 规则
5. **文档化**：在 README 或 CONTRIBUTING 里说明提交格式要求

### 提交信息模板（可选）

在 `.gitmessage` 或通过 `git config` 设置模板：

```bash
git config commit.template .gitmessage
```

`.gitmessage` 内容：

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## 参考链接

- [commitlint 官网](https://commitlint.js.org/)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [npm @commitlint/cli](https://www.npmjs.com/package/@commitlint/cli)
- [npm @commitlint/config-conventional](https://www.npmjs.com/package/@commitlint/config-conventional)
- [Husky 文档](https://typicode.github.io/husky/)
- [commitlint 配置参考](https://commitlint.js.org/reference/configuration.html)
- [commitlint 规则列表](https://commitlint.js.org/reference/rules.html)
- 本目录 **commitlint.config.js** — 可直接使用的配置示例
