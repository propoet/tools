# es-toolkit 学习文档

> 现代 JavaScript 工具库，面向现代运行时优化，体积小、支持 Tree-shaking，可作为 Lodash 的替代；提供 es-toolkit/compat 与 Lodash 兼容层

## 📚 目录

1. [用大白话说：es-toolkit 是啥](#用大白话说es-toolkit-是啥)
2. [与 Lodash 的关系与选型](#与-lodash-的关系与选型)
3. [原理：为什么更小、更快](#原理为什么更小更快)
4. [安装与使用方式](#安装与使用方式)
5. [Tree-shaking 与按需引入](#tree-shaking-与按需引入)
6. [es-toolkit/compat 兼容层](#es-toolkitcompat-兼容层)
7. [功能分类与示例](#功能分类与示例)
8. [运行环境与 CDN](#运行环境与-cdn)
9. [常见坑与最佳实践](#常见坑与最佳实践)
10. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：es-toolkit 是啥

### 你遇到的问题（用 Lodash 时）

- **体积大**：整包引入 lodash 或 lodash-es 后 bundle 很大；按需引入又要记路径、容易漏。
- **性能一般**：部分 API 为兼容老环境、隐式类型转换等设计，在现代引擎上不是最优。
- **想用现代 JS**：ES6+ 已有不少能力（如 `Array.prototype.flat`、`Object.fromEntries`），希望工具库基于现代 API、类型友好。

也就是说：**在「和 Lodash 类似用法」的前提下，更小、更快、更现代、支持 Tree-shaking**，就是 es-toolkit 要解决的问题。

### es-toolkit 帮你做啥

**es-toolkit** 是一个 **JavaScript 工具库**（由 Toss 等维护，Storybook、Recharts、MUI、CKEditor 等在用）：

1. **按需引入、Tree-shaking**：从 `es-toolkit` 或子路径（如 `es-toolkit/array`）只引入用到的函数，打包时未用到的会被删掉，体积可比整包 Lodash 小很多（官方称最多可减少约 97%）。
2. **性能**：针对现代 JavaScript 运行时优化，官方称相比其他工具库有约 2–3 倍性能提升。
3. **TypeScript**：内置类型声明，类型推断和类型守卫友好。
4. **Lodash 兼容**：通过 **es-toolkit/compat** 提供与 Lodash 高度一致的 API，便于从 Lodash 平滑迁移；迁移完成后可改回 `es-toolkit` 以获得更小体积和更好性能。
5. **覆盖范围**：数组（chunk、flatten、difference…）、对象（pick、omit、get、set…）、函数（debounce、throttle、curry…）、字符串（camelCase、trim…）、类型判断（isArray、isEmpty…）等，与 Lodash 常用能力对应。

一句话：**es-toolkit = 现代、小体积、可 Tree-shake 的 Lodash 替代品**；**es-toolkit/compat** = 为迁移准备的 Lodash 兼容层。

---

## 与 Lodash 的关系与选型

| 对比项 | es-toolkit | es-toolkit/compat | Lodash / lodash-es |
|--------|------------|-------------------|--------------------|
| **体积** | 按需引入，Tree-shaking 后很小 | 兼容层更大一些 | 整包大；lodash-es 可按需但仍偏大 |
| **性能** | 针对现代运行时优化 | 略逊于纯 es-toolkit | 成熟但非为现代引擎专门优化 |
| **API** | 现代、简洁，部分与 Lodash 有差异 | 尽量与 Lodash 一致 | 事实标准 |
| **类型** | 内置 TS，类型友好 | 同上 | 需 @types/lodash |
| **适用** | 新项目、愿意用新 API | 从 Lodash 迁移中 | 已有大量 Lodash 代码、暂不迁移 |

**简单记**：

- **新项目**：直接用 **es-toolkit**，按需 import，享受小体积和性能。
- **老项目从 Lodash 迁移**：先用 **es-toolkit/compat** 替换 Lodash，验证通过后再逐步改为 **es-toolkit**（替换 compat 路径），获得最佳体积与性能。

---

## 原理：为什么更小、更快

**更小**：

- **ESM + Tree-shaking**：每个函数独立导出，打包器只保留你 import 的那部分，未使用的不会打进 bundle。
- **基于现代 API**：少做兼容层和隐式类型转换，实现更精简。
- **无方法链（Seq）**：不提供 Lodash 的链式调用，减少额外代码。

**更快**：

- **面向现代引擎**：假设支持 ES6+，用原生能力（如 `Array.prototype`、`Object` 方法）配合算法优化。
- **少做「隐式转换」**：Lodash 里如空字符串转 0 等行为在 compat 外不做，分支更少、逻辑更直接。

**类型友好**：

- **内置类型**：无需单独安装 `@types`，且为每个函数写清参数与返回值，便于类型守卫与推断。

---

## 安装与使用方式

### Node.js / Bun（npm/pnpm/yarn）

要求 Node.js 18+。

```bash
pnpm add es-toolkit
# 或
npm i es-toolkit
```

```ts
import { sum, chunk, pick } from 'es-toolkit';

sum([1, 2, 3]);                    // 6
chunk([1, 2, 3, 4, 5, 6], 3);      // [[1,2,3], [4,5,6]]
pick({ a: 1, b: 2, c: 3 }, ['a']); // { a: 1 }
```

### Deno（JSR）

```ts
import { sum } from '@es-toolkit/es-toolkit';
sum([1, 2, 3]);
```

### 从子路径引入（更细粒度 Tree-shaking）

```ts
import { at } from 'es-toolkit/array';
import { debounce } from 'es-toolkit/function';
import { isEqual } from 'es-toolkit/lang';
```

按需从主包或子路径引入即可，打包器会做 Tree-shaking。

---

## Tree-shaking 与按需引入

**推荐写法**：只引入用到的函数，避免整包。

```ts
// 推荐：按需引入
import { chunk, sum, pick, debounce } from 'es-toolkit';

// 或从子路径（部分打包器更易 Tree-shake）
import { chunk } from 'es-toolkit/array';
import { pick } from 'es-toolkit/object';
```

**不推荐**：整包引入会失去 Tree-shaking 优势。

```ts
// 不推荐：整包
import _ from 'es-toolkit';
```

**构建**：使用支持 ESM Tree-shaking 的打包器（Vite、Webpack、Rollup 等），并确保未使用 `babel-plugin-lodash` 之类把 es-toolkit 打成整包。

---

## es-toolkit/compat 兼容层

**用途**：与 Lodash API 尽量一致，便于「直接替换」Lodash 而少改业务代码。

```ts
// 从 Lodash 迁移时使用 compat
import { chunk } from 'es-toolkit/compat';

chunk([1, 2, 3, 4], 0); // []，与 Lodash 行为一致
```

**注意**：

- **compat** 会做更多边界处理、兼容 Lodash 的隐式行为，**体积和性能略逊于** 直接使用 `es-toolkit`。
- **迁移策略**：先用 `es-toolkit/compat` 替换 Lodash，跑通测试和构建；稳定后再把 import 改为 `es-toolkit`（或子路径），并处理少量行为差异（若有）。

**不在 compat 范围内的 Lodash 能力**（官方说明）：

- 隐式类型转换（如空字符串当 0）。
- 依赖「有序、特定类型数组」的 API（如 sortedUniq）。
- 修改 `Array.prototype` 等原型的情况。
- Realm 相关。
- Lodash 的 **Seq** 链式 API。

具体每个函数在 compat 中的实现状态（✅/📝/❌）见 [官方兼容性文档](https://es-toolkit.dev/compatibility.html)。

---

## 功能分类与示例

es-toolkit 按「类别」组织，与 Lodash 类似，便于查找。以下为常见类别与示例（具体以官方 [Reference](https://es-toolkit.dev/reference/array/at.html) 为准）。

### 数组（array）

```ts
import { chunk, flatten, difference, uniq, at } from 'es-toolkit';

chunk([1, 2, 3, 4, 5], 2);           // [[1,2], [3,4], [5]]
flatten([[1, 2], [3, 4]]);           // [1, 2, 3, 4]
difference([1, 2, 3], [2]);          // [1, 3]
uniq([1, 2, 2, 3]);                  // [1, 2, 3]
at([10, 20, 30, 40], [1, 3]);        // [20, 40]
```

### 对象（object）

```ts
import { pick, omit, get, set, merge } from 'es-toolkit';

pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);  // { a: 1, c: 3 }
omit({ a: 1, b: 2, c: 3 }, ['b']);       // { a: 1, c: 3 }
get({ a: { b: 2 } }, 'a.b');            // 2
set({}, 'a.b', 1);                      // { a: { b: 1 } }
merge({ a: 1 }, { b: 2 });              // { a: 1, b: 2 }
```

### 函数（function）

```ts
import { debounce, throttle, once, curry } from 'es-toolkit';

const fn = debounce(() => console.log('ok'), 100);
const t = throttle(() => console.log('t'), 100);
const o = once(() => console.log('once'));
const add = curry((a, b) => a + b);
add(1)(2); // 3
```

### 字符串（string）

```ts
import { camelCase, kebabCase, trim, capitalize } from 'es-toolkit';

camelCase('hello world');   // 'helloWorld'
kebabCase('helloWorld');    // 'hello-world'
trim('  abc  ');            // 'abc'
capitalize('hello');        // 'Hello'
```

### 类型与判断（lang）

```ts
import { isArray, isEmpty, isEqual, isNil } from 'es-toolkit';

isArray([1, 2]);     // true
isEmpty({});         // true
isEqual({ a: 1 }, { a: 1 }); // true
isNil(null);         // true
```

### 数学与数值

```ts
import { sum, sumBy, clamp, random } from 'es-toolkit';

sum([1, 2, 3]);                    // 6
sumBy([{ n: 1 }, { n: 2 }], 'n');  // 3
clamp(10, 0, 5);                   // 5
random(1, 10);                     // 1..10 之间
```

更多函数与签名见官网 [Reference](https://es-toolkit.dev/reference/array/at.html)。

---

## 运行环境与 CDN

- **Node.js 18+**、**Bun**：通过 npm 安装使用。
- **Deno**：通过 JSR `@es-toolkit/es-toolkit` 使用。
- **浏览器**：可通过 CDN 使用，并暴露为 `_`（类似 Lodash 的全局用法）。

**CDN 示例（jsDelivr / unpkg）**：

```html
<script src="https://cdn.jsdelivr.net/npm/es-toolkit@^1"></script>
<script>
  var arr = _.chunk([1, 2, 3, 4, 5, 6], 3);
</script>
```

**ESM + import map（如 esm.sh）**：

```html
<script type="importmap">
  { "imports": { "es-toolkit": "https://esm.sh/es-toolkit@^1" } }
</script>
<script type="module">
  import { chunk } from 'es-toolkit';
  chunk([1, 2, 3, 4, 5, 6], 3);
</script>
```

---

## 常见坑与最佳实践

### 常见坑

1. **compat 与默认行为不一致**：如 `chunk(arr, 0)` 在 Lodash 里返回 `[]`，在纯 `es-toolkit` 里可能不同；从 Lodash 迁移时用 **es-toolkit/compat**，确认行为后再考虑去掉 compat。
2. **未使用 ESM / 未开 Tree-shaking**：若打包配置把 es-toolkit 打成一整块，体积会偏大；确保用 ESM 且打包器支持 Tree-shaking。
3. **Lodash 独有能力**：如 Seq 链式、隐式类型转换、sortedUniq 等，es-toolkit 可能不支持或仅在 compat 中部分支持，迁移时需逐 API 核对文档。

### 最佳实践

- **新项目**：直接用 **es-toolkit**，按需 import，配合 TypeScript 获得类型提示。
- **从 Lodash 迁移**：用 **es-toolkit/compat** 做 1:1 替换，跑测试与构建；稳定后再逐步改为 **es-toolkit** 并修正差异。
- **打包**：使用 Vite、Webpack、Rollup 等，确保对 `es-toolkit` 做 ESM Tree-shaking；避免「整包引用」。
- **类型**：用 TypeScript 时直接使用库自带类型，无需 `@types/es-toolkit`。

---

## 参考与延伸阅读

- [es-toolkit 官网](https://es-toolkit.dev/)
- [es-toolkit 中文](https://es-toolkit.cn/zh_hans/)
- [Installation & Usage](https://es-toolkit.dev/usage.html)
- [Reference（API 列表）](https://es-toolkit.dev/reference/array/at.html)
- [与 Lodash 兼容性](https://es-toolkit.dev/compatibility.html) / [中文](https://es-toolkit.cn/zh_hans/compatibility.html)
- [GitHub - toss/es-toolkit](https://github.com/toss/es-toolkit)
- [npm - es-toolkit](https://www.npmjs.com/package/es-toolkit)
- [JSR - @es-toolkit/es-toolkit](https://jsr.io/@es-toolkit/es-toolkit)

---

**小结**：**es-toolkit** 是现代、小体积、可 Tree-shake 的 JavaScript 工具库，可作为 Lodash 的替代；**es-toolkit/compat** 提供与 Lodash 高度兼容的 API，便于迁移；迁移完成后改用 **es-toolkit** 可获得更小体积与更好性能。
