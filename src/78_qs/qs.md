# qs 学习文档

> 解析与序列化 query string 的库，支持嵌套对象、数组、深度限制与安全选项

## 📚 目录

1. [用大白话说：qs 是啥](#用大白话说qs-是啥)
2. [原理：与原生 querystring 的区别](#原理与原生-querystring-的区别)
3. [安装与使用方式](#安装与使用方式)
4. [parse：字符串 → 对象](#parse字符串--对象)
5. [stringify：对象 → 字符串](#stringify对象--字符串)
6. [选项：depth、allowDots、arrayLimit](#选项depthallowdotsarraylimit)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：qs 是啥

### 你遇到的问题（处理 URL 查询串时）

- **嵌套结构**：`foo[bar]=baz`、`a[0]=1&a[1]=2` 需要解析成 `{ foo: { bar: 'baz' } }`、`{ a: [1, 2] }`，原生 `querystring` 或 `URLSearchParams` 对嵌套支持有限。
- **序列化回去**：把对象转成 query string 时，要支持数组、嵌套对象，格式与后端或前端约定一致。
- **安全与深度**：来自 URL 的字符串不可信，需要限制解析深度、禁止覆盖原型等，避免解析导致的问题。

也就是说：**在「query string 与嵌套对象互转」这件事上，提供功能完整且可配置安全的库**，就是 qs 要解决的问题。

### qs 帮你做啥

**qs**（Jordan Harband 维护）是一个 **query string 解析与序列化库**：

1. **parse(str[, options])**：把 query 字符串解析成对象，支持 `[]` 嵌套、数组、URI 编码。
2. **stringify(obj[, options])**：把对象序列化成 query 字符串，支持数组、嵌套、自定义编码。
3. **深度限制**：默认解析深度 5，可通过 `depth` 配置，防止过深嵌套导致问题。
4. **安全选项**：`allowPrototypes`、`plainObjects` 等，避免解析结果影响原型或注入。

一句话：**qs = 功能更强的 query 解析/序列化**，适合复杂查询参数与表单序列化。

---

## 原理：与原生 querystring 的区别

- **Node querystring**：只支持扁平 key=value，不处理 `a[b]=c` 这种嵌套；`URLSearchParams` 也不支持嵌套对象。
- **qs**：用 `[]` 约定表示嵌套与数组，如 `a[b]=c` → `{ a: { b: 'c' } }`，`a[]=1&a[]=2` → `{ a: [1, 2] }`；并做深度限制与安全处理，避免恶意字符串导致问题。

---

## 安装与使用方式

### 安装

```bash
pnpm add qs
# 或
npm i qs
```

### 使用方式

- **解析**：`const obj = qs.parse('a=b&foo[bar]=baz')`
- **序列化**：`const str = qs.stringify({ a: 'b', foo: { bar: 'baz' } })`

---

## parse：字符串 → 对象

```javascript
import qs from 'qs';

qs.parse('a=c');                    // { a: 'c' }
qs.parse('foo[bar]=baz');           // { foo: { bar: 'baz' } }
qs.parse('a[]=1&a[]=2');            // { a: ['1', '2'] }
qs.parse('a[b][c]=d');              // { a: { b: { c: 'd' } } }
```

- **数组**：`a[0]=1&a[1]=2` 或 `a[]=1&a[]=2` 解析为数组。
- **编码**：自动解码 `%xx`；若字符串来自 URL，通常已解码，一般无需额外处理。
- **深度**：默认最多 5 层，超过的会被忽略，可通过 `depth` 修改。

---

## stringify：对象 → 字符串

```javascript
qs.stringify({ a: 'b', c: 'd' });           // 'a=b&c=d'
qs.stringify({ foo: { bar: 'baz' } });       // 'foo[bar]=baz'
qs.stringify({ a: [1, 2] });                // 'a[0]=1&a[1]=2'
qs.stringify({ a: [1, 2] }, { arrayFormat: 'brackets' }); // 'a[]=1&a[]=2'
```

- **arrayFormat**：`'indices'`（默认）、`'brackets'`、`'repeat'`、`'comma'` 等，控制数组序列化形式。
- **encode**：默认 `true`，会对 key/value 做编码；可关掉或自定义编码函数。

---

## 选项：depth、allowDots、arrayLimit

### parse 常用选项

| 选项 | 说明 |
|------|------|
| **depth** | 最大解析深度，默认 5，防恶意嵌套 |
| **plainObjects** | 为 true 时用 Object.create(null) 创建对象，无原型 |
| **allowPrototypes** | 是否允许解析得到的内容覆盖原型属性，默认 false，建议不开启 |
| **arrayLimit** | 数组最大长度，超过则转对象，默认无限制 |
| **allowDots** | 为 true 时 `a.b=c` 解析为 `{ a: { b: 'c' } }` |

### stringify 常用选项

| 选项 | 说明 |
|------|------|
| **arrayFormat** | 数组格式：indices / brackets / repeat / comma |
| **encode** | 是否编码，默认 true |
| **allowDots** | 嵌套用点号表示，如 `a.b=c` |

---

## 常见场景与最佳实践

1. **URL 查询参数**：从 `?foo=1&bar=2` 取 search 部分做 `qs.parse(search.slice(1))`。
2. **表单序列化**：复杂表单（嵌套、数组）提交前用 `qs.stringify(form)` 得到 body 或 query。
3. **深度与安全**：不随意提高 `depth`；不开启 `allowPrototypes`，避免恶意输入。
4. **与后端约定**：数组/嵌套用哪种格式（brackets/indices 等）与后端统一即可。

---

## 参考与延伸阅读

- [qs npm](https://www.npmjs.com/package/qs)
- [qs GitHub](https://github.com/ljharb/qs)
