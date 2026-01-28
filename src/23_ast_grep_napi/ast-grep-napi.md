# @ast-grep/napi 从零开始学习指南

## 📚 目录
1. [什么是 @ast-grep/napi](#什么是-ast-grepnapi)
2. [安装与引入](#安装与引入)
3. [核心概念](#核心概念)
4. [主入口函数](#主入口函数)
5. [SgRoot 与 SgNode](#sgroot-与-sgnode)
6. [搜索与匹配](#搜索与匹配)
7. [遍历与检查](#遍历与检查)
8. [代码修改（Edit）](#代码修改edit)
9. [多文件搜索 findInFiles](#多文件搜索-findinfiles)
10. [类型与配置](#类型与配置)
11. [最佳实践与注意事项](#最佳实践与注意事项)
12. [参考链接](#参考链接)

---

## 什么是 @ast-grep/napi

**@ast-grep/napi** 是 ast-grep 的 Node.js 程序化 API，基于 [napi.rs](https://napi.rs/) 实现，用于在 JavaScript/TypeScript 中对代码做**基于语法的结构搜索、检查和重写**。

### 为什么用 API 而不是只写规则？

ast-grep 的规则系统刻意保持简单，难以表达：

- 按节点内容逐个替换
- 根据上下文条件替换
- 统计、排序匹配到的节点
- 用匹配结果动态拼出替换串

这些逻辑用通用编程语言更合适，所以需要 **API**：在 JS 里解析 AST、查找节点、收集信息、生成/应用修改。

### 典型场景

- 在源码中查找 `console.log($A)`，并收集或替换 `$A`
- 按「语法树节点类型」遍历（如所有函数声明、所有 `call_expression`）
- 在多个文件中用同一套规则扫描，在回调里处理每个匹配
- 写代码转换工具、简单 Lint、或与其它工具组合

### 包信息

- **npm**: `@ast-grep/napi`
- **类型**: 自带 TypeScript 声明（`index.d.ts`）
- **默认语言**: Html、JavaScript、TypeScript、TSX、Css；更多语言可通过 `registerDynamicLanguage` 等扩展

---

## 安装与引入

### 1. 安装依赖

```bash
npm install --save @ast-grep/napi
# 或
pnpm add @ast-grep/napi
# 或
yarn add @ast-grep/napi
```

### 2. ESM 引入

```javascript
import { parse, Lang, kind, pattern } from '@ast-grep/napi';

const source = `console.log("hello world")`;
const ast = parse(Lang.JavaScript, source);
const root = ast.root();
const node = root.find('console.log($A)');
console.log(node?.getMatch('A')?.text()); // "hello world"
```

### 3. 项目结构示例

```
tools/
├── package.json
├── src/
│   ├── 23_ast_grep_napi/
│   │   ├── ast-grep-napi.md   # 本学习文档
│   │   └── 1.base.js          # 示例脚本（可选）
│   └── index.js
└── ...
```

---

## 核心概念

两个核心类型：

| 概念    | 说明 |
|---------|------|
| **SgRoot** | 整棵语法树的根容器，由 `parse(lang, source)` 得到 |
| **SgNode** | 树上的一个节点，用来查找、遍历、读信息、生成编辑 |

可以类比 **jQuery + DOM**：`SgRoot` 像是 document，`SgNode` 像是 DOM 节点，用 `find` / `findAll` 查、用 `children` / `parent` 遍历。

### 常见工作流

1. 用 `parse(Lang.XXX, source)` 得到 `SgRoot`
2. 用 `ast.root()` 拿到根 `SgNode`
3. 用 `find` / `findAll` 按模式或规则找节点
4. 用 `getMatch` / `text` / `range` 等从节点取信息或生成 `Edit`

---

## 主入口函数

从 `@ast-grep/napi` 可直接使用的函数：

```ts
/** 把字符串解析成 SgRoot */
parse(lang: Lang, src: string): SgRoot

/** 异步解析（大文件或需要不阻塞时） */
parseAsync(lang: Lang, src: string): Promise<SgRoot>

/** 把 kind 名字转成树里的数字 kind id，用于 find(matcher) */
kind(lang: Lang, kindName: string): number

/** 把模式字符串编译成 NapiConfig，用于 find(matcher) */
pattern(lang: Lang, pattern: string): NapiConfig

/** 在多个路径下递归搜索，对每个匹配调用 callback */
findInFiles(lang: Lang, config: FindConfig, callback): Promise<number>
```

### Lang 枚举

内建语言（类型上为 `Lang`）：

- `Lang.Html`
- `Lang.JavaScript`
- `Lang.TypeScript`
- `Lang.Tsx`
- `Lang.Css`

更多语言通过 `registerDynamicLanguage` 和 `@ast-grep/lang-*` 扩展（实验性）。

---

## SgRoot 与 SgNode

### SgRoot

`parse(lang, source)` 的返回类型。

| 方法 | 说明 |
|------|------|
| `root()` | 返回根节点 `SgNode` |
| `filename()` | 若来自 `findInFiles`，返回当前文件路径；否则为 `"anonymous"` |

```javascript
import { parse, Lang } from '@ast-grep/napi';

const ast = parse(Lang.JavaScript, 'const x = 1;');
const root = ast.root();
console.log(ast.filename()); // "anonymous"
```

### SgNode — 概要

`SgNode` 是你主要打交道的对象，大致分为几类方法：

- **只读**：`range()`、`text()`、`kind()`、`isLeaf()`、`isNamed()` 等
- **查找**：`find(matcher)`、`findAll(matcher)`
- **匹配元变量**：`getMatch(name)`、`getMultipleMatches(name)`
- **精炼/条件**：`matches(m)`、`inside(m)`、`has(m)`、`precedes(m)`、`follows(m)`
- **遍历**：`children()`、`parent()`、`child(n)`、`field(name)`、`ancestors()`、`next()`、`prev()`、`nextAll()`、`prevAll()`
- **编辑**：`replace(text)` 得到 `Edit`，再在根节点上 `commitEdits(edits)` 得到新源码

---

## 搜索与匹配

### find / findAll

- `find(matcher): SgNode | null` — 返回第一个匹配，没有则 `null`
- `findAll(matcher): SgNode[]` — 返回所有匹配，没有则 `[]`

**Matcher 的三种形式：**

1. **string** — 当作 ast-grep 的 [pattern](https://ast-grep.github.io/guide/pattern-syntax.html) 解析，如 `'console.log($A)'`
2. **number** — 当作树中节点的 kind id，可用 `kind(lang, 'function')` 等得到
3. **NapiConfig** — 类似 YAML 规则，可写 `rule`、`constraints`、`transform` 等

```javascript
import { parse, Lang, kind } from '@ast-grep/napi';

const root = parse(Lang.JavaScript, 'console.log("hi"); fn(1,2);').root();

// 按模式
const log = root.find('console.log($A)');
log?.getMatch('A')?.text(); // "hi"

// 按 kind
const k = kind(Lang.JavaScript, 'call_expression');
root.findAll(k).forEach(n => console.log(n.text()));

// 按 NapiConfig（带约束）
const node = root.find({
  rule: { pattern: 'console.log($A)' },
  constraints: { A: { regex: 'hello' } }
});
```

### 元变量与 getMatch / getMultipleMatches

- **单个元变量**（如 `$A`）：用 `getMatch('A')` 得到对应 `SgNode | null`
- **多个元变量**（如 `$$$ARGS`）：用 `getMultipleMatches('ARGS')` 得到 `SgNode[]`

```javascript
const src = `console.log('hello'); logger('a','b','c');`;
const root = parse(Lang.JavaScript, src).root();

const log = root.find('console.log($A)');
log?.getMatch('A')?.text(); // 'hello'

const multi = root.find('logger($$$ARGS)');
multi?.getMultipleMatches('ARGS'); // [节点'a', 节点',', 节点'b', ...]
```

---

## 遍历与检查

### 节点信息

- `text()` — 节点对应源码
- `range()` — `{ start: Pos, end: Pos }`，可拿 `start.index`、`start.line`、`start.column`（均为 0 起始）
- `kind()` — 节点类型名
- `isLeaf()` / `isNamed()` / `isNamedLeaf()` — 布尔

### 精炼（Refinement）

在已拿到一个节点的前提下，再用模式做条件判断（当前仅支持 pattern 字符串）：

- `matches(m)`、`inside(m)`、`has(m)`、`precedes(m)`、`follows(m)` — 返回 `boolean`

### 树遍历

- `children()`、`parent()`、`child(n)`、`field(name)`
- `ancestors()`、`next()`、`prev()`、`nextAll()`、`prevAll()`

---

## 代码修改（Edit）

节点是不可变的，不能直接改源码。流程是：**生成 Edit → 在根节点上一次性提交**。

```ts
interface Edit {
  startPos: number;
  endPos: number;
  insertedText: string;
}
```

- `node.replace(newText): Edit` — 生成「用 `newText` 替换该节点」的一条编辑
- `root.commitEdits(edits: Edit[]): string` — 按位置应用多条编辑，得到新源码

注意：**`replace` 里不会自动展开元变量**，需要自己在 JS 里用 `getMatch('A').text()` 等拼出字符串。详见 [ast-grep#1172](https://github.com/ast-grep/ast-grep/issues/1172)。

```javascript
const root = parse(Lang.JavaScript, "console.log('hello world')").root();
const node = root.find('console.log($A)');
const arg = node?.getMatch('A');
const newText = arg ? `console.error(${arg.text()})` : "console.error('')";
const edit = node.replace(newText);
const newSource = root.commitEdits([edit]);
```

---

## 多文件搜索 findInFiles

在磁盘上按路径递归搜索，对每个匹配到的节点调用回调。

```ts
interface FindConfig {
  paths: string[];
  matcher: NapiConfig;
}
```

```javascript
import { findInFiles, Lang } from '@ast-grep/napi';

const count = await findInFiles(
  Lang.JavaScript,
  {
    paths: ['src/'],
    matcher: {
      rule: { pattern: 'console.log($A)' }
    }
  },
  (err, nodes) => {
    if (err) throw err;
    nodes.forEach(n => {
      const root = n.getRoot();
      console.log(root.filename(), n.text());
    });
  }
);
```

在回调里，`node.getRoot()` 可拿到当前文件的 `SgRoot`，其 `filename()` 为当前文件路径。

---

## 类型与配置

### NapiConfig（用于 find/findAll / findInFiles 的 matcher）

与 YAML 规则类似，常见字段：

```ts
interface NapiConfig {
  rule: object;           // 必填，规则内容
  constraints?: object;
  language?: FrontEndLanguage;
  transform?: object;
  utils?: object;
}
```

### FindConfig（用于 findInFiles）

- `paths: string[]` — 要扫描的目录或文件
- `matcher: NapiConfig` — 匹配规则

### 废弃说明

旧版通过 `js.parse`、`html.parse` 等「语言对象」的方式已废弃，请统一使用 `parse(Lang.JavaScript, src)`、`parse(Lang.Html, src)` 等。

---

## 最佳实践与注意事项

1. **大文件**：用 `parseAsync` 避免阻塞事件循环。
2. **替换文本**：`replace(text)` 不会替换元变量，需在 JS 中自己用 `getMatch` + `text()` 拼串。
3. **find 空指针**：`find()` 可能返回 `null`，使用前请判空或可选链。
4. **跨平台**：NAPI 支持 Windows / macOS / Linux 常见架构，若在 Electron 或自定义 Node 构建下遇问题，可查 [napi.rs](https://napi.rs/) 与 ast-grep 的 issues。
5. **类型**：TS 项目可直接从 `@ast-grep/napi` 得到类型，更细的可参考仓库内 [crates/napi/index.d.ts](https://github.com/ast-grep/ast-grep/blob/main/crates/napi/index.d.ts)。

---

## 参考链接

- [npm @ast-grep/napi](https://www.npmjs.com/package/@ast-grep/napi)
- [API 使用指南（含为何用 API）](https://ast-grep.github.io/guide/api-usage.html)
- [JavaScript API 详细说明](https://ast-grep.github.io/guide/api-usage/js-api.html)
- [API 参考（类型与接口）](https://ast-grep.github.io/reference/api.html)
- [类型声明 index.d.ts](https://github.com/ast-grep/ast-grep/blob/main/crates/napi/index.d.ts)
- [示例测试 index.spec.ts](https://github.com/ast-grep/ast-grep/blob/main/crates/napi/__test__/index.spec.ts)
- [在线 Playground](https://codesandbox.io/p/sandbox/ast-grep-napi-hhx3tj)
