# get-port 学习文档

> 获取一个可用的 TCP 端口，支持首选端口、端口范围、排除列表与指定 host；常用于开发服务器、测试并行起多个服务

## 📚 目录

1. [用大白话说：get-port 是啥](#用大白话说get-port-是啥)
2. [原理：怎么判断「可用」](#原理怎么判断可用)
3. [安装与使用方式](#安装与使用方式)
4. [API 与选项](#api-与选项)
5. [portNumbers 与 exclude](#portnumbers-与-exclude)
6. [clearLockedPorts 与竞态说明](#clearlockedports-与竞态说明)
7. [常见场景与示例](#常见场景与示例)
8. [相关包与延伸阅读](#相关包与延伸阅读)

---

## 用大白话说：get-port 是啥

### 你遇到的问题（起服务时要端口时）

- **端口被占**：写死 `3000`，别人已经用了，起不来。
- **多实例并行**：测试或 dev 同时起多个服务，不能都用同一个端口。
- **不想手写**：自己用 `net.createServer().listen(0)` 或轮询试端口，代码啰嗦还容易有竞态。

也就是说：**「给我一个当前可用的端口号」**，就是 get-port 要解决的问题。

### get-port 帮你做啥

**get-port**（Sindre Sorhus 维护）是一个 **「获取可用 TCP 端口」** 的 Node 库：

1. **默认**：不传参数时返回一个**随机可用端口**（在系统允许范围内）。
2. **首选端口**：可传 **port**（单个数字或可迭代的多个），按顺序尝试，第一个可用就返回，否则退回随机可用端口。
3. **端口范围**：用 **portNumbers(from, to)** 生成一段端口，再传给 **port**，在范围内选可用端口。
4. **排除**：用 **exclude** 指定「不要返回」的端口（如已被其他逻辑占用的）。
5. **指定 host**：用 **host** 只在某块网卡/地址上检查可用性（默认检查本机所有网卡）。
6. **进程内防竞态**：返回的端口会在内部「锁定」约 15–30 秒，同一进程内短时间内再次调用不会拿到同一个端口，适合并行测试。

一句话：**get-port = 按你的偏好（首选/范围/排除）在本机找一个当前可用的 TCP 端口号**；常用于 `app.listen(await getPort({ port: 3000 }))`、测试里起多个 server 等。

---

## 原理：怎么判断「可用」

**核心思路**：在目标 **host**（默认为本机所有接口）上尝试 **bind** 到该端口；若 bind 成功则认为「可用」，随即关闭 socket 并返回该端口；若被占用则尝试下一个候选或随机端口，直到成功。

- **port**：按顺序尝试这些端口，第一个 bind 成功的就返回。
- **exclude**：这些端口不会作为候选，即使当前可用也不会返回。
- **host**：只在该 IP（如 `127.0.0.1`、`::1`）上检查；不传则使用系统网络接口上的地址。
- **进程内锁定**：返回某端口后，该端口在短时间内（约 15–30 秒）会被标记为已用，同进程内再次 `getPort()` 不会立即复用它，减少并行调用时的冲突。

---

## 安装与使用方式

### 安装

```bash
pnpm add get-port
# 或
npm i get-port
```

### 基础用法

```js
import getPort from 'get-port';

// 随机可用端口
const port = await getPort();
console.log(port); // 例如 51402
```

```js
// 首选 3000，不可用则退回随机
const port = await getPort({ port: 3000 });
app.listen(port);
```

```js
// 多个首选，按顺序试
const port = await getPort({ port: [3000, 3001, 3002] });
```

```js
// 在 3000–3100 范围内选一个可用
import getPort, { portNumbers } from 'get-port';
const port = await getPort({ port: portNumbers(3000, 3100) });
```

---

## API 与选项

### getPort(options?)

- **返回值**：`Promise<number>`，一个可用的端口号。
- **options**：可选对象。

| 选项 | 类型 | 说明 |
|------|------|------|
| **port** | `number \| Iterable<number>` | 首选端口或首选端口列表，按顺序尝试，第一个可用即返回；否则退回随机可用端口。 |
| **exclude** | `Iterable<number>` | 排除的端口，不会作为候选返回。 |
| **host** | `string` | 只在指定 IP（IPv4 或 IPv6）上检查可用性；不传则检查本机所有网络接口。 |

### portNumbers(from, to)

- **作用**：生成从 `from` 到 `to`（含）的端口序列，可作为 **port** 或 **exclude** 的值。
- **约束**：`from`、`to` 必须在 `1024..65535`，且 `to >= from`。
- **返回**：可迭代对象，适合传给 `getPort({ port: portNumbers(3000, 3100) })` 或 `exclude: portNumbers(3000, 3010)`。

---

## portNumbers 与 exclude

### 端口范围

```js
import getPort, { portNumbers } from 'get-port';

// 在 3000–3100 中选一个可用端口
const port = await getPort({ port: portNumbers(3000, 3100) });
```

### 排除一段端口

```js
// 排除 3000–3010，其它随机
const port = await getPort({ exclude: portNumbers(3000, 3010) });
```

### 组合使用

```js
// 首选 3000–3100，且排除 3050–3060
const port = await getPort({
  port: portNumbers(3000, 3100),
  exclude: portNumbers(3050, 3060),
});
```

---

## clearLockedPorts 与竞态说明

### clearLockedPorts()

get-port 会在进程内对「刚返回过的端口」做短时锁定（约 15–30 秒），避免同一进程内多次快速调用拿到同一端口。若你希望**不受之前调用影响**（例如单测里每次都要从同一组首选端口重新选），可先清空锁定：

```js
import getPort, { clearLockedPorts } from 'get-port';

const preferred = [3000, 3001, 3002];

console.log(await getPort({ port: preferred })); // 3000
console.log(await getPort({ port: preferred })); // 3001（3000 被锁定）

clearLockedPorts();

console.log(await getPort({ port: preferred })); // 3000（又可被选）
```

**注意**：清空后，同一进程内并行调用有可能再次拿到同一端口，需自行保证「拿到端口后尽快 bind」，或避免并行争用同一组 port。

### 竞态说明（Beware）

- **进程内**：通过上述锁定机制，同进程内的竞态已被尽量消除。
- **进程间**：理论上存在「getPort 返回后、你 bind 之前」被其他进程占用的极小概率；若发生，bind 时会得到 `EADDRINUSE`，可在业务层重试或换端口。
- **建议**：拿到端口后尽快 `server.listen(port)`，不要长时间不用再 bind。

---

## 常见场景与示例

### 开发服务器优先 3000

```js
import getPort from 'get-port';
import express from 'express';

const app = express();
const port = await getPort({ port: 3000 });
app.listen(port, () => console.log(`http://localhost:${port}`));
```

### 测试里多个服务不撞端口

```js
import getPort from 'get-port';

const port1 = await getPort({ port: 3000 });
const port2 = await getPort({ port: 3000 }); // 会得到 3001 等（3000 被锁定）
// 或显式用不同首选
const port2 = await getPort({ port: [3001, 3002, 3003] });
```

### 只在 localhost 上检查

```js
const port = await getPort({ port: 3000, host: '127.0.0.1' });
```

### 在指定范围内且排除已知占用

```js
import getPort, { portNumbers } from 'get-port';

const port = await getPort({
  port: portNumbers(8000, 9000),
  exclude: [8080, 8443], // 或 exclude: portNumbers(8080, 8090)
});
```

---

## 相关包与延伸阅读

- **get-port-cli**：get-port 的命令行版本，在 shell 里直接取一个可用端口。

### 参考链接

- [GitHub - sindresorhus/get-port](https://github.com/sindresorhus/get-port)
- [npm - get-port](https://www.npmjs.com/package/get-port)
- [get-port-cli](https://github.com/sindresorhus/get-port-cli)
- [Node.js net 模块](https://nodejs.org/api/net.html)（端口与 bind）

---

**小结**：**get-port** 用于在本机获取一个可用的 TCP 端口，支持**首选端口**（单个或列表）、**portNumbers(from, to)** 范围、**exclude** 排除、**host** 指定检查地址；返回的端口有进程内短时锁定，适合开发服务器与并行测试；需要「重置」行为时可调用 **clearLockedPorts()**。
