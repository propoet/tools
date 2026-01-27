# Zod 从零开始学习指南

## 📚 目录
1. [什么是 Zod](#什么是-zod)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 Zod

Zod 是 TypeScript/JavaScript 里流行的**运行时 schema 校验库**，用“链式 API”定义结构后既可做校验，又能配合 TypeScript 做**类型推导**，适合校验配置、环境变量、API 入参，并保证类型与运行时一致。

### 为什么选择 Zod？
- ✅ 一份 schema 既做校验又做类型推断，TS 下不用重复写类型
- ✅ API 简洁：`z.string()`、`z.object({})`、`z.array()` 等，链式加 `.min()`、`.max()`、`.optional()`
- ✅ 无依赖、体积小，支持 ESM
- ✅ 与 Joi、Yup 同属 schema 校验，Zod 在 TS 生态里非常常见

### 典型场景
- 校验从 .env、配置文件、请求体得到的数据，并导出为 TS 类型
- 在 CLI/API 入口统一做“配置/入参合法性”检查
- 与 dotenv、cosmiconfig 等组合：先加载再 `schema.parse(process.env)` 或 `schema.parse(config)`

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add zod
# 或 npm install zod
```

### 2. ESM 引入

```javascript
import { z } from 'zod';
```

---

## 基础用法

### 1. 基本类型与校验

```javascript
import { z } from 'zod';

const schema = z.string().min(1).max(100);
const s = schema.parse('hello');       // 通过则返回 'hello'，否则抛错
const safe = schema.safeParse('');    // { success: false, error } | { success: true, data }
```

### 2. 对象校验

```javascript
const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0).optional(),
  email: z.string().email().optional(),
});
const obj = schema.parse({ name: 'tom', age: 18 });
// obj 满足 { name: string; age?: number; email?: string }
```

### 3. 数组与枚举

```javascript
const schema = z.array(z.string()).min(1).max(10);
const enumSchema = z.enum(['a', 'b', 'c']);
```

### 4. 默认值与可选

```javascript
z.string().default('foo');
z.object({ a: z.string() }).optional();
```

---

## 示例与组合

### 1. 校验环境变量并导出类型

```javascript
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_KEY: z.string().min(1),
});
const env = envSchema.parse(process.env);
export { env };
// 在 TS 里：export type Env = z.infer<typeof envSchema>;
```

### 2. safeParse 不抛错

```javascript
const result = schema.safeParse(input);
if (!result.success) {
  console.error(result.error.flatten());
  process.exit(1);
}
const value = result.data;
```

### 3. 嵌套与 merge

```javascript
const base = z.object({ a: z.string() });
const extended = base.extend({ b: z.number() });
const merged = base.merge(z.object({ b: z.number() }));
```

### 4. 联合与交叉

```javascript
const union = z.union([z.string(), z.number()]);
const discriminated = z.discriminatedUnion('type', [
  z.object({ type: z.literal('a'), x: z.string() }),
  z.object({ type: z.literal('b'), y: z.number() }),
]);
```

---

## 高级特性

### 1. 常用类型与链式

| 类型 | 示例 |
|------|------|
| string | `z.string().min(1).email().url().uuid()` |
| number | `z.number().int().min(0).max(100)` |
| boolean | `z.boolean()` |
| object | `z.object({ k: z.string() })` |
| array | `z.array(z.string()).min(1)` |
| enum | `z.enum(['a','b'])` |
| literal | `z.literal('a')` |
| coerce | `z.coerce.number()` 从字符串转数字 |
| optional/nullable | `.optional()` / `.nullable()` |

### 2. 类型推导（TypeScript）

```typescript
const schema = z.object({ name: z.string(), age: z.number() });
type Schema = z.infer<typeof schema>; // { name: string; age: number }
```

### 3. 自定义校验

```javascript
z.string().refine((v) => v.length > 0, '不能为空');
z.string().superRefine((v, ctx) => { if (!v) ctx.addIssue({ code: 'custom', message: '必填' }); });
```

### 4. 转制与预处理

```javascript
z.preprocess((val) => (val === '' ? undefined : val), z.string().optional());
z.transform((val) => val.trim());
```

---

## 最佳实践

- 在入口或“配置/环境加载后”统一做一次 `schema.parse()` 或 `schema.safeParse()`，非法则直接退出或返回 4xx。
- 用 TypeScript 时用 `z.infer<typeof schema>` 导出类型，避免手写一份重复的 interface。
- 对来自外部的对象，可先 `z.object({}).passthrough()` 或只声明需要校验的键，多余键按需求 strip 或忽略。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 校验并抛错 | `schema.parse(input)` |
| 校验不抛错 | `schema.safeParse(input)` → `{ success, data/error }` |
| 对象 | `z.object({ a: z.string() })` |
| 类型推导 | `z.infer<typeof schema>` |
| 默认值 | `z.string().default('x')` |
| 强制数字 | `z.coerce.number()` |

---

## 参考与延伸

- [Zod GitHub](https://github.com/colinhacks/zod)
- [Joi](https://github.com/hapijs/joi) - 另一种 schema 校验
- [Yup](https://github.com/jquense/yup) - 面向表单的校验
