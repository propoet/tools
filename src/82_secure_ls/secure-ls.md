# secure-ls 学习文档

> 对 localStorage/sessionStorage 做加密与压缩的封装，提升本地存储的保密与体积

## 📚 目录

1. [用大白话说：secure-ls 是啥](#用大白话说secure-ls-是啥)
2. [原理：加密与压缩](#原理加密与压缩)
3. [与原生 localStorage 的关系](#与原生-localstorage-的关系)
4. [安装与使用方式](#安装与使用方式)
5. [核心 API：get、set、remove、clear](#核心-apigetsetremoveclear)
6. [选项：encodingType、encryptionSecret](#选项encodingtypeencryptionsecret)
7. [常见场景与最佳实践](#常见场景与最佳实践)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：secure-ls 是啥

### 你遇到的问题（本地存敏感数据时）

- **localStorage 明文**：localStorage 存的是明文，任何人打开开发者工具就能看到，不适合存 token、用户信息等。
- **体积**：存大对象时希望先压缩再存，节省配额与传输。
- **API 一致**：希望像用 localStorage 一样 get/set，但底层自动加密、压缩与解密、解压。

也就是说：**在「localStorage/sessionStorage 的加密与压缩」这件事上，提供与原生 API 类似的封装**，就是 secure-ls 要解决的问题。

### secure-ls 帮你做啥

**secure-ls**（softvar 维护）是一个 **加密与压缩的 localStorage/sessionStorage 封装**：

1. **set(key, value)**：将 value（对象会 JSON 序列化）加密、压缩后写入 localStorage/sessionStorage。
2. **get(key)**：读取并解密、解压，返回原始值（含对象）。
3. **remove、clear**：删除键或清空，与原生 API 语义一致。
4. **加密方式**：支持 Base64（默认）、AES、DES、Rabbit、RC4 等；可配置 `encryptionSecret`。
5. **压缩**：默认启用压缩（如 lz-string），可关闭或配置。
6. **存储后端**：可配置用 localStorage 或 sessionStorage。

一句话：**secure-ls = 带加密与压缩的 localStorage/sessionStorage**，适合存敏感或大对象。

---

## 原理：加密与压缩

- **加密**：写入前用 CryptoJS 等按配置的算法（如 AES）和密钥加密；读取时解密。不设 `encryptionSecret` 时，密钥可能每次刷新变化，导致数据无法解密，**生产环境应设固定密钥**。
- **压缩**：写入前用 lz-string 等压缩字符串，减少占用；读取时解压。
- **序列化**：对象会先 `JSON.stringify` 再加密/压缩；读取时解密/解压后再 `JSON.parse`。

---

## 与原生 localStorage 的关系

| 角色 | 作用 |
|------|------|
| **secure-ls** | 在 localStorage/sessionStorage 之上做加密、压缩、序列化；API 类似 get/set/remove/clear。 |
| **localStorage** | 浏览器原生键值存储，明文、无压缩；secure-ls 存进去的是加密后的字符串。 |

**简单记**：secure-ls 是「带加密与压缩的 localStorage 封装」；底层仍用 localStorage/sessionStorage 存字符串。

---

## 安装与使用方式

### 安装

```bash
pnpm add secure-ls
# 或
npm i secure-ls
```

### 使用方式

- **浏览器**：在页面或打包后的脚本里 `import SecureLS from 'secure-ls'` 或通过 script 标签引入，`const ls = new SecureLS({ ... })`，再 `ls.set`/`ls.get`。
- **Node**：依赖 `window`/`localStorage`，需在 jsdom 等环境或仅作类型/文档参考；实际使用在浏览器。

---

## 核心 API：get、set、remove、clear

### 基本用法

```javascript
import SecureLS from 'secure-ls';

const ls = new SecureLS({ encodingType: 'aes', encryptionSecret: 'my-secret-key' });

ls.set('key1', { name: 'tom', age: 18 });
const value = ls.get('key1');   // { name: 'tom', age: 18 }

ls.set('key2', 'string value');
ls.get('key2');                 // 'string value'

ls.remove('key1');
ls.clear();
```

- **set(key, value)**：value 可为字符串、数字、对象等；对象会 JSON 序列化后加密压缩再存。
- **get(key)**：取回并解密解压，返回原始类型（对象、字符串等）。
- **remove(key)**：删除该键。
- **clear()**：清空当前配置的 storage 下所有由 secure-ls 写入的键（注意：若与其它库混用同一 storage，行为以文档为准）。

---

## 选项：encodingType、encryptionSecret

### 常用选项（以官方文档为准）

| 选项 | 说明 |
|------|------|
| **encodingType** | `'base64'`（默认）、`'aes'`、`'des'`、`'rabbit'`、`'rc4'` 等，加密/编码方式。 |
| **encryptionSecret** | 密钥字符串；**使用 AES 等加密时务必设置**，否则刷新后密钥变化会导致数据无法解密。 |
| **isCompression** | 是否压缩，默认 true。 |
| **storageType** | `'localStorage'` 或 `'sessionStorage'`，默认 localStorage。 |

### 示例

```javascript
const ls = new SecureLS({
  encodingType: 'aes',
  encryptionSecret: process.env.VUE_APP_STORAGE_SECRET || 'fallback-secret',
  isCompression: true,
  storageType: 'localStorage',
});
```

---

## 常见场景与最佳实践

1. **Token / 用户信息**：用 AES + 固定 `encryptionSecret` 存 token 或用户信息，降低被直接窥探的风险。
2. **密钥管理**：`encryptionSecret` 不要写死在前端代码里，可从构建时环境变量注入；前端无法做到绝对安全，仅提高门槛。
3. **压缩**：大对象可开启压缩；短字符串可关闭压缩以减少开销。
4. **sessionStorage**：需要关掉标签页即失效时，用 `storageType: 'sessionStorage'`。

---

## 参考与延伸阅读

- [secure-ls npm](https://www.npmjs.com/package/secure-ls)
- [secure-ls GitHub](https://github.com/softvar/secure-ls)
