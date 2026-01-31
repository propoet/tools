# json-bigint 学习文档

> 支持大整数精度的 JSON 解析与序列化；基于 JSON.js 与 bignumber.js，可选原生 BigInt，解决 JSON.parse 超 IEEE 754 精度丢失问题

## 📚 目录

1. [用大白话说：json-bigint 是啥](#用大白话说json-bigint-是啥)
2. [原理：为什么原生 JSON 会丢精度](#原理为什么原生-json-会丢精度)
3. [与原生 JSON、json-with-bigint 的对比](#与原生-jsonjson-with-bigint-的对比)
4. [安装与使用方式](#安装与使用方式)
5. [parse 与 stringify](#parse-与-stringify)
6. [常用选项](#常用选项)
7. [原生 BigInt 与往返注意](#原生-bigint-与往返注意)
8. [常见场景与最佳实践](#常见场景与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：json-bigint 是啥

### 你遇到的问题（大整数进 JSON 时）

- **JSON.parse 丢精度**：JS 的 Number 是 IEEE 754 双精度，安全整数范围是 ±2^53-1（约 ±9e15）；超过的整数在 `JSON.parse` 里会被四舍五入，例如 `9223372036854775807` 变成 `9223372036854776000`。
- **API 返回大 ID/时间戳**：后端返回的 id、雪花 ID、大时间戳等可能是大整数，前端用原生 `JSON.parse` 会错。
- **需要往返一致**：parse 后再 stringify，希望数值不变；原生 JSON 对大整数做不到。

也就是说：**在「JSON 里的大整数不丢精度、能正确 parse/stringify」这件事上，提供可配置的解析与序列化**，就是 json-bigint 要解决的问题。

### json-bigint 帮你做啥

**json-bigint** 是一个 **支持大整数的 JSON 解析/序列化库**：

1. **parse**：把 JSON 字符串解析成对象，**超出安全整数范围的数字** 可用 **BigNumber**（bignumber.js）或 **原生 BigInt** 表示，不丢精度。
2. **stringify**：把对象（含 BigInt/BigNumber）序列化成 JSON 字符串，大数原样输出为数字形式（不带引号）。
3. **可选原生 BigInt**：`useNativeBigInt: true` 时用 JS 原生 BigInt，否则用 bignumber.js 的 BigNumber（默认）。
4. **可选严格模式**：`strict: true` 时重复 key 会抛错；还可配置 `__proto__`/constructor、全部数字当大数等。

一句话：**json-bigint = 大整数安全的 JSON.parse / JSON.stringify**，适合 API 返回大 ID、雪花 ID、大时间戳等场景。

---

## 原理：为什么原生 JSON 会丢精度

### 1. IEEE 754 双精度

- JS 的 **Number** 是 64 位双精度浮点，整数可**安全**表示的范围是 **-(2^53 - 1) ～ 2^53 - 1**（即 `Number.MIN_SAFE_INTEGER` ～ `Number.MAX_SAFE_INTEGER`，约 ±9e15）。
- 超出该范围的整数在转成 Number 时会**舍入**，例如 `9223372036854775807` 会变成 `9223372036854776000`，**信息丢失**。

### 2. 原生 JSON.parse 的行为

- `JSON.parse('{"id":9223372036854775807}')` 会把数字解析成 **Number**，超过安全范围的整数会被舍入，无法用 Number 精确表示。
- JSON 规范本身**没有**限制数字精度，所以 `9223372036854775807` 是合法 JSON；问题出在 JS 的 Number 类型。

### 3. json-bigint 的做法

- **解析时**：遇到超出安全范围的整数，不转成 Number，而是转成 **BigNumber**（bignumber.js）或 **原生 BigInt**，保留完整精度。
- **序列化时**：BigNumber/BigInt 按「数字形式」输出（无引号、无 `n` 后缀），保证和普通数字在 JSON 里形态一致。

可以简单记：**Number 精度有限 → 原生 JSON 大整数会丢 → 用 BigNumber/BigInt 存大数 = 不丢精度**。

---

## 与原生 JSON、json-with-bigint 的对比

| 对比项       | json-bigint           | 原生 JSON           | json-with-bigint 等   |
|--------------|------------------------|----------------------|------------------------|
| **大整数**   | 不丢精度（BigNumber/BigInt） | 超安全整数会丢       | 类似，实现不同         |
| **依赖**     | bignumber.js（或仅原生 BigInt） | 无                   | 无/轻量                |
| **API**      | parse / stringify，需 `require('json-bigint')(options)` | JSON.parse/stringify | 类似 JSON             |
| **原生 BigInt** | useNativeBigInt: true  | 不支持               | 部分库支持             |
| **strict**   | 支持重复 key 报错      | 不报错，后者覆盖     | 视实现而定             |
| **典型用途** | 大 ID、雪花 ID、大时间戳 | 一般 JSON            | 同左，更轻量可选       |

**简单记**：**有大整数精度需求** → 用 **json-bigint**（或同类库）；**无大数** → 原生 JSON 即可。

---

## 安装与使用方式

### 安装

```bash
pnpm add json-bigint
# 或
npm i json-bigint
```

### 使用方式

- **默认**：`const JSONbig = require('json-bigint')` 得到带默认选项的实例，用 `JSONbig.parse()` / `JSONbig.stringify()`。
- **带选项**：`require('json-bigint')({ useNativeBigInt: true })` 得到配置好的实例，再 parse/stringify。

---

## parse 与 stringify

### 默认用法（BigNumber）

```js
const JSONbig = require("json-bigint");

const json = '{"value":9223372036854775807,"v2":123}';

const obj = JSONbig.parse(json);
console.log(obj.value.toString()); // "9223372036854775807"
console.log(JSONbig.stringify(obj)); // 数值不变
```

- **parse(str)**：返回对象，超出安全整数的数字会变成 **BigNumber**（有 `.toString()` 等方法）。
- **stringify(obj)**：含 BigNumber 的对象可正确序列化，大数以数字形式输出。

### 使用原生 BigInt

```js
const JSONbig = require("json-bigint")({ useNativeBigInt: true });

const obj = JSONbig.parse('{"key":993143214321423154315154321}');
console.log(typeof obj.key); // "bigint"
console.log(obj.key); // 993143214321423154315154321n
```

- **useNativeBigInt: true**：超出安全范围的整数解析为 JS **BigInt**（带 `n` 后缀），计算和类型更统一。

### 全部数字当大数（可选）

```js
const JSONbig = require("json-bigint")({
  alwaysParseAsBig: true,
  useNativeBigInt: true,
});
const obj = JSONbig.parse('{"key":123}');
console.log(typeof obj.key); // "bigint"
```

- **alwaysParseAsBig: true**：所有数字都用 BigNumber/BigInt 解析，普通小数字也会变类型；按需使用。

---

## 常用选项

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| **strict** | boolean | false | 为 true 时，重复 key 会抛错，不采用「后者覆盖」 |
| **storeAsString** | boolean | false | 大整数以**字符串**形式存到对象里（易破坏往返一致性，慎用） |
| **useNativeBigInt** | boolean | false | 超出安全范围的整数用**原生 BigInt**，否则用 BigNumber |
| **alwaysParseAsBig** | boolean | false | **所有**数字都当 BigNumber/BigInt 解析 |
| **protoAction** | "error" \| "ignore" \| "preserve" | "error" | 对 `__proto__` 的处理：报错、忽略或保留 |
| **constructorAction** | "error" \| "ignore" \| "preserve" | "error" | 对 `constructor` 的处理，防原型污染 |

- **protoAction** / **constructorAction** 设为 `"ignore"` 可跳过这些 key，避免原型污染；安全敏感场景建议用 `"error"` 或 `"ignore"`。

---

## 原生 BigInt 与往返注意

### stringify 行为

- 原生 **BigInt** 会被序列化成**纯数字**（无引号、无 `n`），例如 `123n` → `123`。

### 往返不一致

- **parse 再 stringify**：`s === JSONbig.stringify(JSONbig.parse(s))` 对**字符串**可成立。
- **stringify 再 parse**：若对象里有 BigInt（如 `123n`），`JSONbig.stringify` 得到 `123`，再 `JSONbig.parse` 得到的是 **Number** `123`，不是 `123n`，即 `o !== JSONbig.parse(JSONbig.stringify(o))`。
- 库目前不区分「原本是 number 还是 bigint」，往返时 BigInt 会变成 Number；若需要保留类型，需自己约定（例如大数用字符串存，或单独序列化）。

---

## 常见场景与最佳实践

### 1. API 返回大 ID（推荐 useNativeBigInt）

```js
const JSONbig = require("json-bigint")({ useNativeBigInt: true });
const res = JSONbig.parse(await fetch("/api/item").then((r) => r.text()));
console.log(res.id); // 大整数为 BigInt，不丢精度
```

### 2. 只关心不丢精度、不做大数运算

- 用默认（BigNumber）或 `useNativeBigInt: true` 均可；需要和现有数字运算混用时，原生 BigInt 更直观。

### 3. 不信任的 JSON（防原型污染）

- 设置 `protoAction: "ignore"`、`constructorAction: "ignore"`，避免 `__proto__`/constructor 被解析进对象。

### 4. 重复 key 希望报错

- 设置 `strict: true`，便于尽早发现接口或数据问题。

---

## 参考与延伸阅读

- [json-bigint npm](https://www.npmjs.com/package/json-bigint)
- [json-bigint GitHub](https://github.com/sidorares/json-bigint)
- [RFC 4627 (JSON)](https://www.ietf.org/rfc/rfc4627.txt)
- [Number.MIN_SAFE_INTEGER / MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)

---

**小结**：json-bigint 用 BigNumber 或原生 BigInt 表示超出安全整数范围的数字，保证 parse/stringify 不丢精度；常用 `useNativeBigInt: true`，按需开 strict、protoAction 等；注意 BigInt 往返会变成 Number，需自行约定若需保留类型。
