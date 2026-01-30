# dotenv-expand 从零开始学习指南

## 📚 目录
1. [什么是 dotenv-expand](#什么是-dotenv-expand)
2. [原理：变量展开如何做](#原理变量展开如何做)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 dotenv-expand

dotenv-expand 是 **dotenv 的扩展**，在解析好的“键值对”上再做一层**变量展开**，例如把 `DATABASE_URL="postgres://${USER}@localhost/db"` 里的 `${USER}` 替换成当前环境里已有的 `USER`，从而在 .env 里引用已有变量或其它 .env 里的变量。

### 为什么选择 dotenv-expand？
- ✅ 与 dotenv 配合使用，不替代 dotenv，只做“展开”
- ✅ 支持 `${VAR}`、`$VAR` 等写法
- ✅ 适合“基于已有变量或其它键”拼出新变量（如 URL、路径）

### 典型场景
- `.env` 里写 `DATABASE_URL="postgres://${DB_USER}:${DB_PASS}@localhost/db"`
- `OUT_DIR="${ROOT}/dist"`，复用 ROOT
- 多环境共用一部分变量，仅覆盖少数几项

---

## 原理：变量展开如何做

dotenv-expand 的核心是：**在 dotenv 解析出的「键值对」上，对 value 字符串做「变量引用替换」，把 `${VAR}` 或 `$VAR` 换成当前环境（如 process.env）里已有的值**。

1. **输入**：接收 dotenv 的解析结果（`parsed` 对象，键值对），以及可选的已有环境对象（默认用 `process.env`）。
2. **替换规则**：遍历每个 value，用正则或逐字符扫描匹配 `${VAR}`、`$VAR` 等；将匹配到的变量名在「已有环境」中查值，查到则替换，查不到可保留原样或置空（依实现而定）。
3. **写回**：把展开后的 value 再写回 `parsed` 或直接写回 `process.env`，这样后续代码读到的就是已展开的值。
4. **顺序与循环**：一般按「键的声明顺序」展开；若 A 引用 B、B 引用 A，需避免无限循环（实现上可限制递归深度或禁止循环引用）。

---

## 安装与引入

### 1. 安装依赖

需同时安装 dotenv 与 dotenv-expand。

```bash
pnpm add dotenv dotenv-expand
# 或 npm install dotenv dotenv-expand
```

### 2. 引入方式

```javascript
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

// 先 dotenv 解析，再对 result 做 expand
const result = dotenv.config();
dotenvExpand.expand(result);
```

---

## 基础用法

### 1. 标准流程：config → expand

dotenv 返回 `{ parsed }` 或 `{ error }`；expand 会改写 `parsed` 里的值（及已写入的 process.env），把其中的 `${VAR}` / `$VAR` 替换为 process.env 或 parsed 里已有的值。

```javascript
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const result = dotenv.config();
if (result.parsed) {
  dotenvExpand.expand(result);
}
// 此后 process.env 中已包含展开后的值
```

### 2. .env 中书写方式

```ini
USER=app
DB_HOST=localhost
DATABASE_URL=postgres://${USER}@${DB_HOST}/mydb
OUT_DIR=${ROOT}/dist
```

解析并 expand 后，`DATABASE_URL` 会变成 `postgres://app@localhost/mydb`（若 `ROOT` 在 process.env 或 parsed 里，`OUT_DIR` 同理）。

---

## 示例与组合

### 1. 自定义路径与多文件

先对每个文件做 `dotenv.config({ path })`，再对**最后一个**或**合并后的** result 做一次 expand；若多文件互相引用，一般先按顺序 config 再对整体 expand。

```javascript
const r1 = dotenv.config({ path: '.env.local' });
const r2 = dotenv.config({ path: '.env' });
dotenvExpand.expand(r2); // 或对包含所有 parsed 的合并对象 expand
```

### 2. 仅解析不写入 process.env 时展开

若用 `dotenv.config({ processEnv: myObj })` 写入自定义对象，expand 时传入的 result 里应包含该对象上的值，这样 expand 会在同一对象上做替换。具体以 dotenv-expand 文档为准，通常 expand 会基于 `process.env` 和 result.parsed 做替换。

### 3. 与 dotenv 的 override 一起用

`dotenv.config({ override: true })` 只影响“是否覆盖已有 process.env”；expand 只做字符串替换，不改变这一行为。顺序一般为：先 config，再 expand。

---

## 高级特性

### 1. expand 的输入

`dotenvExpand.expand({ parsed })`：会对 `parsed` 里每个值的 `${...}` / `$VAR` 做替换，并通常回写 process.env（或 dotenv 写入的目标对象）。  
若传入 `dotenvExpand.expand(result)`，则使用 `result.parsed` 以及当前 process.env。

### 2. 未定义变量的行为

未定义的变量可能被替换成空字符串或保留原文，取决于实现，使用时尽量保证被引用的变量已在 process.env 或先加载的 parsed 里定义。

---

## 最佳实践

- 始终在 dotenv.config() 之后调用 expand，且只对“最终合并好的” parsed 做一次 expand。
- 被引用的变量优先在同文件前几行或先加载的 .env 里定义，避免循环引用（A 引 B、B 引 A）。
- 敏感信息不要只依赖 .env 展开，生产环境多用真实环境变量或密钥管理。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 基本用法 | `dotenvExpand.expand(dotenv.config())` |
| .env 写法 | `KEY=${OTHER_KEY}/suffix`、`URL=host/${VAR}` |

---

## 参考与延伸

- [dotenv-expand GitHub](https://github.com/motdotla/dotenv-expand)
- [dotenv](https://github.com/motdotla/dotenv) - 基础环境变量加载
- [dotenvx](https://github.com/dotenvx/dotenvx) - 多环境、加密等增强
