# axios 与 axios-mock-adapter 学习文档

> HTTP 客户端 axios，配合 axios-mock-adapter 做请求模拟与测试

## 📚 目录

1. [用大白话说：axios 与 axios-mock-adapter 是啥](#用大白话说axios-与-axios-mock-adapter-是啥)
2. [原理：适配器与拦截器链](#原理适配器与拦截器链)
3. [两个包的关系](#两个包的关系)
4. [axios：安装与基本用法](#axios安装与基本用法)
5. [axios：实例、拦截器、配置](#axios实例拦截器配置)
6. [axios-mock-adapter：安装与基本用法](#axios-mock-adapter安装与基本用法)
7. [axios-mock-adapter：进阶用法](#axios-mock-adapter进阶用法)
8. [综合示例与测试场景](#综合示例与测试场景)
9. [常见坑与最佳实践](#常见坑与最佳实践)
10. [包速查表与参考](#包速查表与参考)

---

## 用大白话说：axios 与 axios-mock-adapter 是啥

### 你遇到的问题（手写请求时）

- **请求封装**：要统一 baseURL、超时、请求头、错误处理，自己包 fetch 或 XMLHttpRequest 很啰嗦。
- **拦截器**：加 token、统一处理 401、日志、重试，都要在业务里散落。
- **开发/测试**：后端没就绪或要测异常时，希望「不发真请求、直接返回假数据」，又不想改业务代码。

也就是说：**统一 HTTP 客户端 + 请求/响应拦截 + 方便模拟**，就是 axios 和 axios-mock-adapter 要解决的。

### axios 帮你做啥

**axios** 是 **基于 Promise 的 HTTP 客户端**（浏览器 + Node 都可用）：

1. **统一 API**：`get`、`post`、`put`、`patch`、`delete` 等，支持 `params`、`data`、`headers`、`timeout` 等配置。
2. **实例**：`axios.create(config)` 创建带 baseURL、默认头的实例，和全局 axios 隔离。
3. **拦截器**：请求前、响应后统一处理（加 token、统一错误、重试等）。
4. **取消请求**：支持 AbortController / CancelToken 取消进行中的请求。

一句话：**axios = 统一、可配置、可拦截的 HTTP 客户端**。

### axios-mock-adapter 帮你做啥

**axios-mock-adapter** 是 **axios 的适配器**，用来「拦截请求并返回假响应」：

1. **不发真请求**：对指定 URL/方法匹配的请求，直接返回你给的 status、data、headers，不经过网络。
2. **开发联调**：后端未就绪时，用 mock 返回假数据，前端照常调 `axios.get('/api/user')`。
3. **单测**：在 Vitest/Jest 里给 axios 实例挂上 mock，测「请求成功/失败/超时」等场景，不依赖真实接口。

一句话：**axios-mock-adapter = 给 axios 挂上「假接口」**，按 URL/方法/参数匹配后返回你定义的响应。

---

## 原理：适配器与拦截器链

**核心思路**：axios 发请求时不是直接调 fetch/XHR，而是先走**请求拦截器**，再交给**适配器**（adapter）真正发请求，收到响应后走**响应拦截器**，最后把结果返回给调用方；适配器可替换，mock-adapter 就是「把默认的 HTTP 适配器换成：匹配则返回假数据、不匹配则走默认适配器」。

- **请求流程**：`axios.get(url)` → 合并配置 → 请求拦截器（可改 config）→ 适配器（默认是 http/XHR 或 fetch）→ 响应拦截器（可改 response）→ 返回 Promise。
- **适配器**：默认适配器在浏览器里用 XHR、在 Node 里用 http；axios-mock-adapter 通过 `axios.defaults.adapter` 或实例的 adapter 注入自己的适配器：收到 config 后根据 method + url 等匹配，命中则 resolve 你给的 { data, status, headers }，不命中则调原适配器发真请求。
- **拦截器**：拦截器是队列，请求拦截器按注册顺序执行，响应拦截器按注册逆序执行；加 token、统一错误、重试等都在拦截器里做，业务代码只关心「发请求、拿结果」。

---

## 两个包的关系

| 包 | 作用 |
|----|------|
| **axios** | HTTP 客户端：发请求、实例、拦截器、配置；不负责「模拟」。 |
| **axios-mock-adapter** | 适配器：挂在某个 axios 实例（或默认 axios）上，拦截匹配的请求并返回 mock 响应；依赖 axios。 |

**简单记**：  
- 业务里用 **axios** 发请求。  
- 需要「假接口」时，**new AxiosMockAdapter(axios 实例)**，用 `onGet`/`onPost` 等配好 mock，之后该实例的请求若匹配就会被拦截并返回 mock，不发出真实请求。

---

## axios：安装与基本用法

### 安装

```bash
pnpm add axios
# 或
npm i axios
```

### 基本请求

```javascript
import axios from 'axios';

// GET
const res = await axios.get('/api/user', { params: { id: 1 } });
console.log(res.data, res.status, res.headers);

// POST
await axios.post('/api/user', { name: 'Tom' }, { headers: { 'Content-Type': 'application/json' } });

// PUT / PATCH / DELETE
await axios.put('/api/user/1', { name: 'Tom' });
await axios.patch('/api/user/1', { name: 'Tom' });
await axios.delete('/api/user/1');
```

- **响应**：`res.data` 为响应体，`res.status` 为状态码，`res.headers` 为响应头。
- **错误**：状态码非 2xx 会进入 catch，`error.response` 为响应对象，`error.response?.data` 为错误体。

### 请求配置常用字段

| 字段 | 说明 |
|------|------|
| **baseURL** | 基础 URL，请求时与 url 拼接 |
| **timeout** | 超时（毫秒） |
| **headers** | 请求头 |
| **params** | URL 查询参数（对象） |
| **data** | 请求体（POST/PUT 等） |
| **responseType** | 如 'json'、'blob'、'arraybuffer' |
| **withCredentials** | 是否带 cookie（跨域时） |
| **validateStatus** | 函数，决定哪些状态码算成功（默认 2xx） |

---

## axios：实例、拦截器、配置

### 创建实例

```javascript
const instance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { 'X-Custom-Header': 'foo' },
});

instance.get('/user'); // 实际请求 https://api.example.com/user
```

- 实例拥有与默认 axios 相同的 API（get、post、interceptors 等），配置互不影响。
- **axios-mock-adapter** 要挂在「实际发请求的那个实例」上（通常是 `axios.create()` 的实例或默认 `axios`）。

### 请求拦截器

```javascript
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
```

- 在请求真正发出前修改 `config`（URL、头、参数等），返回 config 继续发请求。

### 响应拦截器

```javascript
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 跳转登录等
    }
    return Promise.reject(error);
  }
);
```

- 成功时直接返回 `response`；失败时统一处理 401 等再 `Promise.reject(error)`。

### 取消请求

```javascript
const controller = new AbortController();
axios.get('/api/data', { signal: controller.signal });
controller.abort(); // 取消请求
```

- axios 支持 `signal: AbortController.signal`，调用 `abort()` 即可取消。

---

## axios-mock-adapter：安装与基本用法

### 安装

```bash
pnpm add -D axios-mock-adapter
# 或
npm i -D axios-mock-adapter
```

- 一般只在开发/测试用，装成 devDependencies 即可。

### 创建 mock 并挂在实例上

```javascript
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

const mock = new AxiosMockAdapter(axios);
```

- 传入**要拦截的 axios 实例**（默认 `axios` 或 `axios.create()` 的实例）。  
- 之后该实例发出的请求，若匹配到 mock 规则，就不会发到网络，直接返回 mock 的响应。

### 按方法 + URL 匹配并返回固定响应

```javascript
// GET /users → 200 + 数据
mock.onGet('/users').reply(200, { users: [{ id: 1, name: 'Tom' }] });

// 带查询参数匹配（必须完全一致）
mock.onGet('/users', { params: { searchText: 'John' } }).reply(200, { users: [...] });

// POST
mock.onPost('/users').reply(201, { id: 2, name: 'Jane' });

// PUT / PATCH / DELETE
mock.onPut('/users/1').reply(200);
mock.onPatch('/users/1').reply(200);
mock.onDelete('/users/1').reply(204);
```

- **reply(status, data?, headers?)**：返回 [status, data, headers] 形式的响应；不写 headers 可省略。
- 匹配顺序：按 `onGet`/`onPost` 等注册顺序，**先匹配先生效**。

### 只生效一次：replyOnce

```javascript
mock.onGet('/users').replyOnce(200, { users: [] }).onGet('/users').replyOnce(500);
// 第一次 GET /users → 200，第二次 → 500，之后无匹配 → 404
```

### 恢复与重置

| 方法 | 作用 |
|------|------|
| **mock.restore()** | 从实例上移除 mock 适配器，恢复真实请求。 |
| **mock.reset()** | 清空所有通过 onGet/onPost 等注册的 handler，但 mock 仍挂在实例上。 |
| **mock.resetHandlers()** | 只清空 handler，等同于 reset 的 handler 部分。 |

- 单测里每个用例结束可 `mock.restore()` 或 `mock.reset()`，避免用例间互相影响。

---

## axios-mock-adapter：进阶用法

### 用函数动态返回响应

```javascript
mock.onGet('/users').reply((config) => {
  // config 为 axios 请求配置（url、params、headers 等）
  return [200, { users: [] }];
});
```

- 返回值形式：**[status, data?, headers?]**；也可 return **Promise**，resolve 上述数组。

### 模拟网络错误与超时

```javascript
mock.onGet('/users').networkError();      // 每次都是 Network Error
mock.onGet('/users').networkErrorOnce();  // 仅第一次

mock.onGet('/users').timeout();           // 每次超时（ECONNABORTED）
mock.onGet('/users').timeoutOnce();       // 仅第一次
```

### 用正则匹配 URL

```javascript
mock.onGet(/\/users\/\d+/).reply((config) => {
  const id = config.url?.match(/\/users\/(\d+)/)?.[1];
  return [200, { id: Number(id), name: 'User' }];
});
```

### 按请求体匹配（POST/PUT 等）

```javascript
mock.onPut('/product', { id: 4, name: 'foo' }).reply(204);
```

- 会比对请求的 `data` 与传入对象（或使用 Jest 的 `expect.objectContaining` 等非对称匹配）。

### onAny：匹配任意方法

```javascript
mock.onAny('/foo').reply(200);
mock.onAny().reply(500); // 兜底：未匹配的请求都返回 500
```

- **顺序重要**：一般把更具体的写在前面，兜底 `onAny()` 放最后。

### passThrough：放行真实请求

```javascript
mock.onPost(/^\/api/).reply(201).onGet(/^\/api/).passThrough();
```

- 匹配到 `passThrough()` 的请求会**真的发出去**，不返回 mock。  
- 适合「只 mock 部分接口，其余走真实」的场景。

### 构造选项：onNoMatch

```javascript
const mock = new AxiosMockAdapter(axios, { onNoMatch: 'passthrough' });
mock.onAny('/foo').reply(200);
// 未匹配的请求一律发真实请求
```

- **onNoMatch: 'passthrough'**：未匹配时发真实请求。  
- **onNoMatch: 'throwException'**：未匹配时抛错，方便在单测里发现漏 mock 的请求。

### 延迟响应

```javascript
const mock = new AxiosMockAdapter(axios, { delayResponse: 2000 });
// 所有 mock 响应延迟 2 秒返回
```

### History：查看已发生的请求（测试用）

```javascript
mock.onPost('/endpoint').replyOnce(200);
await axios.post('/endpoint', { foo: 'bar' });
expect(mock.history.post).toHaveLength(1);
expect(mock.history.post[0].data).toBe(JSON.stringify({ foo: 'bar' }));
mock.resetHistory(); // 清空 history
```

- **mock.history.get / mock.history.post** 等为匹配到的请求配置数组，用于断言「是否调了、调了几次、参数是什么」。

---

## 综合示例与测试场景

### 示例 1：实例 + 拦截器 + mock 开发

```javascript
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

const api = axios.create({ baseURL: '/api', timeout: 5000 });
api.interceptors.request.use((c) => {
  c.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  return c;
});

if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK) {
  const mock = new AxiosMockAdapter(api);
  mock.onGet('/user').reply(200, { id: 1, name: 'Mock User' });
}

const user = await api.get('/user');
console.log(user.data);
```

### 示例 2：单测里 mock 成功/失败

```javascript
import { describe, it, expect, afterEach } from 'vitest';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

describe('user api', () => {
  let mock;
  afterEach(() => {
    mock?.restore();
  });

  it('getUser success', async () => {
    mock = new AxiosMockAdapter(axios);
    mock.onGet('/api/user').reply(200, { id: 1, name: 'Tom' });
    const res = await axios.get('/api/user');
    expect(res.data.name).toBe('Tom');
  });

  it('getUser 500', async () => {
    mock = new AxiosMockAdapter(axios);
    mock.onGet('/api/user').reply(500);
    await expect(axios.get('/api/user')).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
```

---

## 常见坑与最佳实践

1. **mock 挂在谁**：mock 只对「传入的 axios 实例」生效；业务若用 `axios.create()` 的实例，就要把**该实例**传给 `new AxiosMockAdapter(instance)`，否则拦截不到。
2. **版本兼容**：axios 1.x 与 axios-mock-adapter 2.x 配合使用；若遇类型不匹配，可对实例做类型断言，或始终用 `axios.create()` 再传实例给 mock。
3. **匹配顺序**：handler 按注册顺序匹配，更具体的 URL/params 放前面，兜底 `onAny()` 放最后。
4. **单测清理**：每个用例里 `afterEach` 里 `mock.restore()` 或 `mock.reset()`，避免用例间残留 handler。
5. **reply 返回格式**：函数形式要返回 **[status, data?, headers?]** 或 Promise resolve 该数组，否则可能报错或行为异常。
6. **passThrough**：需要「部分 mock、部分真实」时，用 `onNoMatch: 'passthrough'` 或对特定方法/URL 写 `passThrough()`，并注意 handler 顺序。

---

## 包速查表与参考

### 包速查表

| 包名 | 类型 | 一句话说明 |
|------|------|------------|
| **axios** | HTTP 客户端 | 基于 Promise 的 HTTP 库，支持实例、拦截器、取消请求，浏览器与 Node 可用。 |
| **axios-mock-adapter** | 适配器 | 给 axios 实例挂 mock，按 URL/方法/参数拦截请求并返回假响应，用于开发与测试。 |

### 参考与延伸阅读

- [axios 官方文档](https://axios-http.com/)
- [axios-mock-adapter GitHub](https://github.com/ctimmerm/axios-mock-adapter)
- [Axios 拦截器](https://axios-http.com/docs/interceptors)

---

**文档版本**：针对 axios 1.x 与 axios-mock-adapter 2.x 整理；具体 API 以官方文档为准。
