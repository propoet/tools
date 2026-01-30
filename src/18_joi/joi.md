# Joi 从零开始学习指南

## 📚 目录
1. [什么是 Joi](#什么是-joi)
2. [原理：schema 如何校验与转换](#原理schema-如何校验与转换)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 Joi

Joi 是 Node.js 里常用的**运行时数据校验库**，用 schema 描述“对象/字符串/数字/数组”等结构及规则，对输入做校验并可选地做类型转换，适合校验配置、环境变量、API 入参等。

### 为什么选择 Joi？
- ✅ API 链式、可读性好，适合复杂嵌套与组合
- ✅ 内置 string、number、object、array、boolean、date 等类型及 length、min、max、pattern、valid 等规则
- ✅ 支持自定义消息、异步校验、引用其他键（ref）
- ✅ 与 Zod、Yup 等同属“schema 校验”，Joi 偏传统、生态成熟

### 典型场景
- 校验从 .env、配置文件、API 请求体得来的数据
- 在 CLI/服务入口统一做“配置合法性”检查，非法则提前报错
- 与 dotenv、cosmiconfig 等组合：先加载再 Joi 校验

---

## 原理：schema 如何校验与转换

Joi 的核心是：**用「schema 对象」描述「类型 + 规则」，对输入值做类型检查与规则校验，通过则返回（可做类型转换），不通过则返回 error；支持嵌套 object、array 和引用（ref）**。

1. **schema 描述**：每个类型（string、number、object、array 等）对应一个 schema 构造函数，链式调用 `.min()`、`.max()`、`.required()` 等往 schema 上挂规则；object 的 key 对应子 schema，形成树形结构。
2. **校验过程**：`schema.validate(input)` 时，从根节点开始递归：先检查类型是否匹配，再按规则逐条检查（长度、范围、正则等）；若某条不满足，收集错误信息并返回；全部通过则返回 `{ value }`（value 可能经过类型转换，如 string 转 number）。
3. **类型转换**：部分规则会在校验同时做转换（如 `Joi.number()` 对字符串 `"42"` 转成 42）；最终返回的 value 可能是转换后的结果，便于后续使用。
4. **引用与异步**：`Joi.ref('otherKey')` 在 object 内引用其他键的值；支持 `validateAsync` 做异步校验（如查库验证唯一性）。

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add joi
# 或 npm install joi
```

### 2. ESM 引入

```javascript
import Joi from 'joi';
```

---

## 基础用法

### 1. 字符串校验

```javascript
import Joi from 'joi';

const schema = Joi.string().min(1).max(100).required();
const { value, error } = schema.validate('hello');
if (error) console.error(error.details);
else console.log(value); // 'hello'
```

### 2. 数字校验

```javascript
const schema = Joi.number().min(0).max(100).integer();
const { value, error } = schema.validate(42);
```

### 3. 对象校验

```javascript
const schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0).optional(),
  email: Joi.string().email(),
});
const { value, error } = schema.validate({ name: 'tom', age: 18 });
```

### 4. 数组校验

```javascript
const schema = Joi.array().items(Joi.string()).min(1).max(10);
const { value, error } = schema.validate(['a', 'b']);
```

### 5. 布尔与枚举

```javascript
const schema = Joi.boolean();
const enumSchema = Joi.string().valid('a', 'b', 'c');
```

---

## 示例与组合

### 1. 校验环境变量/配置

```javascript
import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();
const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  API_KEY: Joi.string().min(1).required(),
});
const { value, error } = schema.validate(process.env, { allowUnknown: true });
if (error) {
  console.error('配置不合法', error.details);
  process.exit(1);
}
export const config = value;
```

### 2. allowUnknown 与 strip

- `allowUnknown: true`：允许对象里有多余键，不报错。
- `stripUnknown: true`：校验后去掉未在 schema 里声明的键，只留 `value` 中声明过的。

```javascript
const { value } = schema.validate(input, { allowUnknown: true, stripUnknown: true });
```

### 3. 默认值与可选

```javascript
Joi.string().default('foo');
Joi.number().optional();
Joi.object({ a: Joi.string() }).default({});
```

### 4. 自定义错误信息

```javascript
Joi.string().required().messages({ 'string.empty': '名称不能为空' });
```

---

## 高级特性

### 1. 常用类型与规则

| 类型 | 示例 |
|------|------|
| string | `Joi.string().min(1).max(100).email().pattern(/^a/)` |
| number | `Joi.number().min(0).integer().port()` |
| boolean | `Joi.boolean()` |
| object | `Joi.object({ key: Joi.string() })` |
| array | `Joi.array().items(Joi.string()).length(5)` |
| date | `Joi.date().iso()` |
| valid | `Joi.string().valid('a','b')` |
| when/ref | `Joi.when('a', { is: 1, then: Joi.required() })` |

### 2. validate 选项

| 选项 | 说明 |
|------|------|
| `abortEarly` | 遇第一个错误就返回，默认 true |
| `allowUnknown` | 对象允许未知键 |
| `stripUnknown` | 校验后去掉未知键 |
| `presence` | 'required' / 'optional' / 'forbidden' |
| `convert` | 是否做类型转换，默认 true |

### 3. 异步校验

```javascript
const schema = Joi.string().external(async (v) => {
  const exists = await checkInDb(v);
  if (!exists) throw new Error('不存在');
});
const { value } = await schema.validateAsync(input);
```

---

## 最佳实践

- 在入口或“配置加载后”统一做一次 Joi 校验，非法则直接退出或返回 400，避免错误配置传入业务。
- 对来自外部的对象用 `allowUnknown: true` 或 `stripUnknown: true`，避免因多余字段报错或泄露结构。
- 敏感项（如 API_KEY）用 `Joi.string().min(1).required()`，并配合环境变量或密钥管理，不写进默认值。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 校验 | `schema.validate(input)` → `{ value, error }` |
| 异步校验 | `schema.validateAsync(input)` → value 或抛错 |
| 对象 | `Joi.object({ a: Joi.string().required() })` |
| 允许未知键 | `validate(input, { allowUnknown: true })` |
| 去未知键 | `validate(input, { stripUnknown: true })` |
| 默认值 | `Joi.string().default('x')` |

---

## 参考与延伸

- [Joi GitHub](https://github.com/hapijs/joi)
- [Zod](https://github.com/colinhacks/zod) - 另一种 schema 校验，支持 TypeScript 推导
- [Yup](https://github.com/jquense/yup) - 面向表单的校验库
