# Semver 从零开始学习指南

## 📚 目录
1. [什么是 Semver](#什么是-semver)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 Semver

Semver 是 npm 官方使用的**语义化版本**解析与比较库，实现 [semver.org](https://semver.org/) 规范，用于判断版本大小、是否落在某范围、取合法版本等。

### 为什么选择 Semver？
- ✅ npm 同款实现，与 package.json 的 `^`、`~` 等完全一致
- ✅ 提供 `satisfies`、`coerce`、`valid`、`gt`/`lt` 等常用 API
- ✅ 支持 ESM/CJS，可按函数单独引入以减小体积
- ✅ 工程化里版本号校验、发版脚本、依赖范围检查都会用到

### 典型场景
- 判断 `currentVersion` 是否满足 `"^1.2.0"`
- 从 `"v1.2.3"` 或 `"1.2.3-beta.0"` 中解析出合法版本
- 发版前比较本地版本与 registry 版本，避免重复发布
- 在 Monorepo 或脚本里统一校验、对齐版本号

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add semver
# 或 npm install semver / yarn add semver
```

### 2. ESM 引入

```javascript
import semver from 'semver';
// 或按需引入
import { satisfies, coerce, valid, gt, lt } from 'semver';
```

---

## 基础用法

### 1. valid(version)

返回规范后的合法版本字符串，不合法则返回 `null`。

```javascript
import semver from 'semver';

semver.valid('1.2.3');     // '1.2.3'
semver.valid('v1.2.3');    // '1.2.3'
semver.valid('1.2');       // null
semver.valid('invalid');   // null
```

### 2. satisfies(version, range)

判断 `version` 是否落在 `range` 内（支持 `^`、`~`、`>=`、`x` 等）。

```javascript
semver.satisfies('1.2.3', '^1.0.0');  // true
semver.satisfies('2.0.0', '^1.0.0');  // false
semver.satisfies('1.2.3', '>=1.0.0 <2.0.0'); // true
```

### 3. coerce(version)

从字符串中“挤”出一个合法版本（如 `v2` → `2.0.0`）。

```javascript
semver.coerce('v2');           // SemVer { version: '2.0.0', ... }
semver.valid(semver.coerce('v2')); // '2.0.0'
semver.coerce('1.2');          // SemVer { version: '1.2.0', ... }
```

### 4. 比较：gt / gte / lt / lte / eq

```javascript
semver.gt('1.2.3', '1.2.0');   // true
semver.gte('1.2.3', '1.2.3');  // true
semver.lt('1.2.3', '2.0.0');   // true
semver.eq('1.2.3', '1.2.3');   // true
```

---

## 示例与组合

### 1. 解析并取主/次/补丁号

```javascript
const v = semver.parse('1.2.3');
console.log(v.major, v.minor, v.patch); // 1 2 3
```

### 2. 发版前检查“是否已发布”

```javascript
const local = '1.2.3';
const published = await getPublishedVersion('pkg'); // 自定义
if (published && semver.lte(local, published)) {
  console.log('当前版本未大于已发布版本，无需发布');
  process.exit(0);
}
```

### 3. 取范围中的最大版本

```javascript
const versions = ['1.2.1', '1.2.2', '1.3.0'];
const max = semver.maxSatisfying(versions, '*'); // '1.3.0'
const inRange = semver.maxSatisfying(versions, '^1.2.0'); // '1.2.2'
```

### 4. inc(version, release)

按类型递增版本（major/minor/patch/prerelease 等）。

```javascript
semver.inc('1.2.3', 'patch');   // '1.2.4'
semver.inc('1.2.3', 'minor');   // '1.3.0'
semver.inc('1.2.3', 'major');  // '2.0.0'
semver.inc('1.2.3-alpha.0', 'prerelease'); // '1.2.3-alpha.1'
```

---

## 高级特性

### 1. 常用 API 一览

| API | 说明 |
|-----|------|
| `valid` | 返回合法版本或 null |
| `satisfies` | 版本是否满足范围 |
| `coerce` | 从字符串推断版本 |
| `parse` | 解析为 SemVer 对象 |
| `gt/gte/lt/lte/eq` | 比较大小 |
| `maxSatisfying` | 在版本数组中取满足范围的最大版本 |
| `minSatisfying` | 取满足范围的最小版本 |
| `inc` | 按类型递增版本 |
| `prerelease` | 返回预发布标识数组，如 `['alpha', 1]` |

### 2. 范围写法（与 npm 一致）

- `^1.2.3`：>=1.2.3 <2.0.0
- `~1.2.3`：>=1.2.3 <1.3.0
- `>=1.0.0 <2.0.0`：可组合
- `1.x`、`*`：任意版本

---

## 最佳实践

- 对外暴露或存盘的版本号先用 `valid()` 或 `coerce()` 做规范化。
- 依赖是否兼容用 `satisfies(version, range)` 判断，与 npm 行为一致。
- 发版脚本里用 `inc()` 递增，用 `gt`/`lte` 与已有版本比较，避免重复发版。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 是否合法 | `semver.valid('1.2.3')` |
| 是否满足范围 | `semver.satisfies('1.2.3', '^1.0.0')` |
| 从字符串推断 | `semver.coerce('v2')` → 再 `semver.valid(...)` |
| 比较大小 | `semver.gt(a, b)` |
| 范围中最大 | `semver.maxSatisfying(versions, range)` |
| 递增版本 | `semver.inc('1.2.3', 'patch')` |

---

## 参考与延伸

- [semver 规范](https://semver.org/)
- [node-semver GitHub](https://github.com/npm/node-semver)
- [standard-version](https://github.com/conventional-changelog/standard-version) / [changesets](https://github.com/changesets/changesets) - 发版与 CHANGELOG
