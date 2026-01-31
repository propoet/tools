# jsonwebtoken 学习文档

> Node.js 下的 JWT（JSON Web Token）实现，支持签发、校验与解码；基于 RFC 7519，支持 HMAC、RSA、ECDSA 等算法，Auth0 维护

## 📚 目录

1. [用大白话说：jsonwebtoken 是啥](#用大白话说jsonwebtoken-是啥)
2. [原理：JWT 是什么、怎么验](#原理jwt-是什么怎么验)
3. [与 jwt.io、passport-jwt 的关系](#与-jwtiopassport-jwt-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [jwt.sign：签发](#jwtsign签发)
6. [jwt.verify：校验](#jwtverify校验)
7. [jwt.decode：仅解码（不验签）](#jwtdecode仅解码不验签)
8. [算法与密钥](#算法与密钥)
9. [错误类型与安全注意](#错误类型与安全注意)
10. [常见场景与最佳实践](#常见场景与最佳实践)
11. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：jsonwebtoken 是啥

### 你遇到的问题（做登录/鉴权时）

- **无状态鉴权**：不想在服务端存 session，希望「客户端带一个 token，服务端能验证是谁、是否过期」。
- **JWT 标准**：JWT 是 RFC 7519 定义的「三段式」token（header.payload.signature），需要按标准签发和验签。
- **算法与密钥**：支持 HMAC（对称）、RSA/ECDSA（非对称），需要现成的 sign/verify API。

也就是说：**在「按 JWT 标准签发、校验、解码 token」这件事上，提供稳定可用的 Node API**，就是 jsonwebtoken 要解决的问题。

### jsonwebtoken 帮你做啥

**jsonwebtoken**（Auth0 维护）是一个 **Node.js 下的 JWT 库**：

1. **jwt.sign**：用 **payload + 密钥/私钥** 签发 JWT，可选 **expiresIn**、**issuer**、**audience**、**algorithm** 等。
2. **jwt.verify**：用 **密钥/公钥** 验签并校验 **exp**、**nbf**、**aud**、**iss** 等，通过则返回解码后的 payload，否则抛错。
3. **jwt.decode**：**只解码** payload/header，**不验签**，不能用于信任用户输入。
4. **多算法**：HS256/384/512（HMAC）、RS256/384/512、PS256/384/512、ES256/384/512 等。

一句话：**jsonwebtoken = 在 Node 里签发、校验、解码 JWT 的库**，适合登录态、API 鉴权、服务间认证等。

---

## 原理：JWT 是什么、怎么验

### 1. JWT 结构（三段）

- **Header**：`{ "alg": "HS256", "typ": "JWT" }` 等，Base64URL 编码。
- **Payload**：业务数据 + 标准声明（**exp** 过期、**iat** 签发时间、**nbf** 生效时间、**iss** 签发者、**aud** 受众、**sub** 主体、**jti** ID 等），Base64URL 编码。
- **Signature**：对 `base64(header).base64(payload)` 用 **密钥**（HMAC）或 **私钥**（RSA/ECDSA）签名，验签时用同一密钥或对应公钥验证。

最终 token 形如：`eyJhbGc....eyJzdWI....SflKxw...`（三段用 `.` 连接）。

### 2. 验签在做什么

- **verify** 会：用密钥/公钥验证 **Signature** 是否合法；检查 **exp**（未过期）、**nbf**（已生效）；可选检查 **aud**、**iss**、**sub**、**jti**；通过才返回 payload。
- **decode** 只做 Base64 解码，**不验证签名**，任何人可伪造，不能用于鉴权。

可以简单记：**JWT = header + payload + signature；验签 = 验证签名 + 时间与声明**。

---

## 与 jwt.io、passport-jwt 的关系

| 角色 | 作用 |
|------|------|
| **jsonwebtoken** | 底层库：sign / verify / decode，不关心「从哪取 token、怎么挂到请求上」。 |
| **jwt.io** | 网站：解码、调试 JWT，与库无关。 |
| **passport-jwt** | Passport 策略：从 Header/Cookie 等提取 JWT，调用 jsonwebtoken.verify，把 payload 挂到 req.user。 |

- **只做签发/验签** → 用 **jsonwebtoken** 即可。  
- **在 Express 里做「带 JWT 的登录鉴权」** → 可用 **passport-jwt** + **jsonwebtoken**（或自带 verify）。

---

## 安装与使用方式

### 安装

```bash
pnpm add jsonwebtoken
# 或
npm i jsonwebtoken
```

### 使用方式概览

- **签发**：`jwt.sign(payload, secretOrPrivateKey, options)` 或带 callback 的异步形式。
- **校验**：`jwt.verify(token, secretOrPublicKey, options)` 或带 callback；通过返回 payload，失败抛错。
- **仅解码**：`jwt.decode(token, options)`，不验签，仅用于调试或展示。

---

## jwt.sign：签发

### 基本用法（HMAC，默认 HS256）

```js
import jwt from "jsonwebtoken";

const secret = "your-secret-key";
const token = jwt.sign({ userId: "123", role: "user" }, secret);
// 可选：过期时间
const tokenExp = jwt.sign({ userId: "123" }, secret, { expiresIn: "1h" });
// 或 expiresIn: 3600（秒）、"7d"、"2 days" 等
```

- **payload**：对象（推荐）、Buffer 或字符串（会 JSON 序列化）；**对象时** 可自动加 **iat**，并可配合 **expiresIn** 等生成 **exp**、**nbf**。
- **secretOrPrivateKey**：HMAC 用字符串/Buffer；RSA/ECDSA 用 PEM 私钥（字符串或 `{ key, passphrase }`）。
- **options**：见下。

### 常用 sign 选项

| 选项 | 说明 | 默认 |
|------|------|------|
| **algorithm** | 算法，如 `HS256`、`RS256` | HS256 |
| **expiresIn** | 过期时间：秒数或字符串（如 `"1h"`、`"7d"`） | 无 |
| **notBefore** | 生效时间（nbf） | 无 |
| **audience** | 受众（aud） | 无 |
| **issuer** | 签发者（iss） | 无 |
| **subject** | 主体（sub） | 无 |
| **jwtid** | JWT ID（jti） | 无 |
| **noTimestamp** | 不自动加 iat | false |
| **header** | 自定义 header 字段 | - |

注意：**exp / nbf / aud / sub / iss** 要么在 **options** 里设，要么在 **payload** 里用 **exp / nbf / aud / sub / iss**，不要两处都设。

### RSA 签发

```js
import jwt from "jsonwebtoken";
import fs from "node:fs";

const privateKey = fs.readFileSync("private.pem");
const token = jwt.sign({ foo: "bar" }, privateKey, { algorithm: "RS256" });
```

---

## jwt.verify：校验

### 基本用法

```js
import jwt from "jsonwebtoken";

const token = "eyJhbGc..."; // 用户传来的 token
const secret = "your-secret-key";

try {
  const payload = jwt.verify(token, secret);
  console.log(payload.userId);
} catch (err) {
  // err.name: TokenExpiredError | JsonWebTokenError | NotBeforeError
  console.error(err.message);
}
```

- **verify** 会验证**签名**、**exp**、**nbf**，可选 **aud**、**iss**、**sub**、**jti**；通过返回 **解码后的 payload**，失败**抛错**。
- 来自**不可信来源**的 token，**必须**用 verify；解码后的 payload 也要当用户输入做校验，只信任需要的字段。

### 常用 verify 选项

| 选项 | 说明 |
|------|------|
| **algorithms** | 允许的算法列表，如 `["RS256"]`，防 alg 篡改 |
| **audience** | 校验 aud（字符串、正则或数组） |
| **issuer** | 校验 iss（字符串或数组） |
| **subject** | 校验 sub |
| **jwtid** | 校验 jti |
| **ignoreExpiration** | 不校验 exp |
| **ignoreNotBefore** | 不校验 nbf |
| **clockTolerance** | 时钟偏差容忍（秒） |
| **maxAge** | token 最大存活时间（如 `"1d"`） |
| **complete** | 为 true 时返回 `{ header, payload, signature }` |

### 异步取公钥（如 JWKS）

```js
jwt.verify(token, (header, callback) => {
  getPublicKey(header.kid, (err, key) => callback(err, key));
}, options, (err, decoded) => {
  if (err) return console.error(err);
  console.log(decoded);
});
```

---

## jwt.decode：仅解码（不验签）

```js
const decoded = jwt.decode(token);
// 或带 header
const decodedFull = jwt.decode(token, { complete: true });
// decodedFull = { header, payload, signature }
```

- **不验证签名**，任何人可伪造；**不能**用于鉴权，仅适合调试或展示内容。
- 来自不可信输入的 token，解码结果也要当用户输入处理。

---

## 算法与密钥

| 类型 | 算法示例 | 签发用 | 验签用 |
|------|----------|--------|--------|
| **对称（HMAC）** | HS256, HS384, HS512 | 密钥 | 同一密钥 |
| **非对称（RSA）** | RS256, RS384, RS512, PS256/384/512 | 私钥 | 公钥 |
| **非对称（ECDSA）** | ES256, ES384, ES512 | 私钥 | 公钥 |

- **HMAC**：密钥要足够随机、长度足够（如 256 位），并妥善保管。
- **RSA**：签发用私钥，验签用公钥；模长建议 ≥2048（库默认拒绝更小，除非 allowInsecureKeySizes）。
- **verify 时务必指定 algorithms**，避免 alg 被改成 `none` 或弱算法。

---

## 错误类型与安全注意

### 常见错误

- **TokenExpiredError**：token 已过期（exp 已过）。
- **JsonWebTokenError**：无效 token、格式错误、签名错误、aud/iss 等不匹配。
- **NotBeforeError**：当前时间早于 nbf。

### 安全注意

1. **不可信 token 必须 verify**，不要用 decode 做鉴权。
2. **verify 时显式传 algorithms**，禁止 `none` 和弱算法。
3. **密钥/私钥** 不要写进代码、不要提交仓库，用环境变量或密钥服务。
4. **payload 不要放敏感信息**：JWT 仅 Base64，不加密，任何人可解码查看。
5. **HTTPS** 传输，防止 token 被窃听。

---

## 常见场景与最佳实践

### 1. 登录后签发（expiresIn + sub）

```js
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d", subject: user.id }
);
```

### 2. 接口鉴权（Bearer token）

```js
const authHeader = req.headers.authorization;
const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
if (!token) return res.status(401).json({ error: "Unauthorized" });
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
  });
  req.user = payload;
  next();
} catch (err) {
  return res.status(401).json({ error: err.message });
}
```

### 3. RSA 多租户 / 公钥从 JWKS 拉取

用 **jwt.verify(token, getKey, options, callback)**，在 getKey 里根据 header.kid 从 JWKS 取公钥再 callback。

### 4. 刷新 token

库不内置「刷新」；若需要，可单独实现「用 refresh token 换新 access token」逻辑，并严格控制 refresh 的过期与撤销。

---

## 参考与延伸阅读

- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)
- [jsonwebtoken GitHub](https://github.com/auth0/node-jsonwebtoken)
- [RFC 7519 (JWT)](https://tools.ietf.org/html/rfc7519)
- [jwt.io 介绍](https://jwt.io/introduction)

---

**小结**：jsonwebtoken 提供 sign（签发）、verify（验签+解码）、decode（仅解码）；验签务必用 verify 并指定 algorithms；密钥/私钥用环境变量或密钥服务，payload 不放敏感信息。
