# depcheck 学习文档

> 检查项目中未使用的依赖与缺失的依赖，通过扫描代码中的 require/import 与 package.json 对比得出结果

## 📚 目录

1. [用大白话说：depcheck 是啥](#用大白话说depcheck-是啥)
2. [原理：如何判断「用没用」](#原理如何判断用没用)
3. [安装与使用方式](#安装与使用方式)
4. [支持的语法与 Specials](#支持的语法与-specials)
5. [配置方式](#配置方式)
6. [CLI 参数与 API](#cli-参数与-api)
7. [常见误报与最佳实践](#常见误报与最佳实践)
8. [与 knip 的关系（维护状态说明）](#与-knip-的关系维护状态说明)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：depcheck 是啥

### 你遇到的问题（依赖越来越多时）

- **不知道哪些没用到**：package.json 里一堆依赖，有的早就没 import 了，但不敢删，怕删坏。
- **不知道缺了啥**：代码里用了某个包，忘记 `npm install`，本地或 CI 报错才发现。
- **想瘦身**：node_modules 越来越大，想清理「声明了但没用到」的包。

也就是说：**自动扫一遍代码和 package.json，告诉你「谁没被用、谁被用了但没声明」**，就是 depcheck 要解决的问题。

### depcheck 帮你做啥

**depcheck** 是一个 **依赖检查工具**：

1. **未使用依赖（Unused）**：在 dependencies / devDependencies 里声明了，但项目代码里没有 `require` 或 `import` 的包，会列出来。
2. **缺失依赖（Missing）**：代码里用了某包，但 package.json 里没声明，会列出来并指出在哪些文件里用到了。
3. **可选输出**：还能看到「每个依赖被哪些文件使用」（`using`），以及解析失败的文件/目录（`invalidFiles` / `invalidDirs`）。

一句话：**depcheck = 扫代码里的 require/import + 扫配置里的特殊引用（如 eslint、babel、webpack）→ 和 package.json 对比 → 输出未使用和缺失的依赖**。

---

## 原理：如何判断「用没用」

**核心思路**：遍历项目文件，用**解析器（parser）**从源码里提取「用到的包名」，再和 package.json 里的 dependencies / devDependencies 对比。

1. **解析源码**：按文件扩展名用不同 parser（如 .js 用 ES6 parser、.ts 用 TypeScript、.vue 用 Vue 的 parser）解析，找出 `require('xxx')`、`import xxx from 'xxx'`、`import 'xxx'` 等里的包名。
2. **Specials**：有些依赖不会出现在源码 import 里，而是在配置文件里（如 babel 的 presets、eslint 的 plugins、webpack 的 loaders）；depcheck 用一套「specials」规则去读这些配置，把用到的包也算进去。
3. **对比**：  
   - 在 package.json 里但不在「用到的包」里 → **Unused dependencies / Unused devDependencies**。  
   - 在「用到的包」里但不在 package.json 里 → **Missing dependencies**（并列出使用位置）。
4. **局限**：规则是启发式的，动态 require、字符串拼接包名、Tailwind 等「通过配置引用」的库可能被误报为未使用；删除前需人工确认。

---

## 安装与使用方式

### 不安装，直接跑（推荐先试）

```bash
npx depcheck
```

在项目根目录（有 package.json 的目录）执行即可；不装到项目里也能用。

### 项目内安装

```bash
pnpm add -D depcheck
# 或
npm i -D depcheck
```

在 package.json 里加脚本：

```json
{
  "scripts": {
    "depcheck": "depcheck"
  }
}
```

然后执行 `pnpm run depcheck` 或 `npm run depcheck`。

### 全局安装

```bash
npm i -g depcheck
```

之后在任意项目目录执行 `depcheck` 即可。

### 指定目录

```bash
depcheck /path/to/project
```

不写目录时默认当前目录（且以「有 package.json」的目录为项目根）。

### 输出示例

```text
Unused dependencies
* underscore
Unused devDependencies
* jasmine
Missing dependencies
* lodash
```

表示：`underscore` 在 package.json 里但代码没用到；`jasmine` 同理（dev）；`lodash` 在代码里用了但没在 package.json 里声明。

---

## 支持的语法与 Specials

### 语法支持（需能解析出 require/import）

- **JavaScript**：ES5、ES6、ES7
- **React JSX**：.jsx
- **TypeScript**：需项目里装有 `typescript`，depcheck 会用它解析
- **Vue**：需装有 `@vue/compiler-sfc`
- **CoffeeScript**、**SASS/SCSS** 等

若用 TypeScript，建议和 depcheck 一起装：`pnpm add -D depcheck typescript`，否则可能解析不全。

### Specials（配置里引用、代码里不直接 import）

这些依赖通常出现在配置文件里，depcheck 用「specials」去读配置并算作「已使用」：

| Special | 说明 |
|--------|------|
| **babel** | Babel 的 presets、plugins |
| **bin** | 在 npm scripts、CI 脚本里作为命令使用的包 |
| **commitizen** | Commitizen 的 adapter 配置 |
| **eslint** | ESLint 的 presets、parsers、plugins |
| **gatsby** | Gatsby 配置里引用的包 |
| **gulp-load-plugins** | gulp-load-plugins 懒加载的插件 |
| **husky** | Husky 配置 |
| **istanbul** | nyc 的 extensions |
| **jest** | Jest 配置里的属性（如 testEnvironment、setupFiles 等） |
| **karma** | Karma 的 frameworks、browsers、preprocessors、reporters |
| **lint-staged** | lint-staged 配置 |
| **mocha** | Mocha 显式 require 的依赖 |
| **prettier** | Prettier 配置模块 |
| **webpack** | Webpack 的 loaders 等 |
| **serverless** | Serverless 的 plugins |
| 等 | 见 [depcheck 文档](https://github.com/depcheck/depcheck#special) |

若某个工具/框架的引用方式不在 specials 里，可能被误报为未使用，此时用 `ignores` 排除即可。

---

## 配置方式

### 配置文件 .depcheckrc

在项目根目录（package.json 同目录）创建 `.depcheckrc`，可用 **YAML**、**JSON**、**JavaScript** 格式。  
CLI 参数与配置文件冲突时，**CLI 优先**。

示例（YAML）：

```yaml
ignores: ["eslint", "babel-*", "tailwindcss"]
skip-missing: true
ignore-patterns: "dist,coverage,*.log"
```

等价 CLI：`depcheck --ignores="eslint,babel-*" --skip-missing=true --ignore-patterns=dist,coverage,*.log`。

### 指定配置文件

```bash
depcheck --config=./config/.depcheckrc.json
```

### 常见配置项

| 配置项 | 说明 |
|--------|------|
| **ignores** | 包名或 glob，这些包不报未使用（如 `tailwindcss`、`postcss`） |
| **ignore-patterns** | 要忽略的文件/目录，符合 .gitignore 规则 |
| **ignore-path** | 提供类似 .gitignore 的文件路径 |
| **skip-missing** | 为 true 时不检查缺失依赖 |
| **ignore-bin-package** | 为 true 时忽略带 bin 的包（常用于 CLI 工具） |
| **parsers / detectors / specials** | 高级用法，自定义解析与检测逻辑 |

---

## CLI 参数与 API

### 常用 CLI 参数

| 参数 | 说明 |
|------|------|
| `[directory]` | 项目根目录，默认当前目录 |
| `--ignores=包名,glob` | 忽略的包，不报未使用 |
| `--ignore-patterns=pattern1,pattern2` | 忽略的文件/目录 |
| `--ignore-path=文件` | 使用某文件作为 ignore 规则（如 .eslintignore） |
| `--skip-missing=true` | 不检查缺失依赖 |
| `--ignore-bin-package=true` | 忽略含 bin 的包 |
| `--json` | 输出 JSON |
| `--oneline` | 单行输出，方便复制 |
| `--quiet` | 无问题时不输出，适合 monorepo 脚本 |
| `--config=路径` | 指定配置文件 |

### API 使用

```js
import depcheck from 'depcheck';

const options = {
  ignorePatterns: ['dist', 'coverage'],
  ignoreMatches: ['grunt-*'],
  skipMissing: false,
  package: { dependencies: {}, devDependencies: {} }, // 可选，不传则读 package.json
};

const result = await depcheck('/path/to/project', options);
console.log(result.dependencies);      // 未使用的 dependencies
console.log(result.devDependencies);   // 未使用的 devDependencies
console.log(result.missing);           // 缺失依赖及使用位置
console.log(result.using);             // 每个包被哪些文件使用
console.log(result.invalidFiles);      // 解析失败的文件
console.log(result.invalidDirs);       // 无权限或无效的目录
```

---

## 常见误报与最佳实践

### 常见误报（False Alert）

1. **Tailwind、PostCSS 等**：通过配置文件或类名引用，代码里没有 import，会被报未使用 → 用 `ignores` 排除。
2. **动态 require**：`require(someVariable)`、拼接包名，depcheck 无法静态分析 → 要么 ignores，要么接受误报。
3. **只在某环境用**：如只在测试或构建脚本里用的包，若被 ignore-patterns 排除，可能被报未使用 → 视情况 ignores。
4. **Monorepo 子包**：子包依赖可能在根或别的包里引用，depcheck 按「单个 package.json」检查，可能误报 → 可对子包分别跑或配合 ignore。

### 最佳实践

- **删除前必人工确认**：depcheck 结果只是参考，删前用搜索确认、跑一遍测试和构建。
- **先 ignores 再删**：确定「误报」的包（如 eslint、tailwindcss）先写入 `.depcheckrc` 的 `ignores`，再处理其余未使用。
- **CI 里可选使用**：用 `--json` 或 `--quiet` 在 CI 里跑，只对「有问题的包」做失败；注意误报会导致误杀，可先只做警告。
- **TypeScript 项目**：装好 `typescript`，保证 .ts 能被正确解析，减少漏报。

---

## 与 knip 的关系（维护状态说明）

**重要**：depcheck 官方在 GitHub 上标明 **no longer actively maintained**（不再积极维护）。  
对现代工具链（TypeScript、monorepo、新框架）支持有限，误报/漏报可能较多。

**官方推荐**：迁移到 [knip](https://knip.dev)。knip 除未使用依赖外，还能查未使用的文件、导出、类型等，且持续维护，对 TS、monorepo、Vite 等支持更好。

**建议**：

- **新项目**：优先考虑用 **knip** 做依赖与死代码检查。
- **老项目、轻量需求**：仍可用 depcheck 做「未使用/缺失依赖」的快速扫描，结果需人工复核后再删依赖。

---

## 参考与延伸阅读

- [depcheck GitHub](https://github.com/depcheck/depcheck)
- [depcheck npm](https://www.npmjs.com/package/depcheck)
- [depcheck 可插拔设计](https://github.com/depcheck/depcheck/blob/master/doc/pluggable-design.md)（parsers、detectors、specials）
- [knip](https://knip.dev)（官方推荐的替代方案）

---

**小结**：**depcheck** 通过扫描源码中的 require/import 与配置文件（specials）判断依赖是否被使用，并对比 package.json 输出**未使用**与**缺失**的依赖；需注意误报并人工确认后再删除。当前官方推荐使用 **knip** 作为更现代的替代方案。
