# Dotenv 从零开始学习指南

## 📚 目录
1. [什么是 Dotenv](#什么是-dotenv)
2. [原理：如何从 .env 到 process.env](#原理如何从-env-到-processenv)
3. [安装与引入](#安装与引入)
4. [基础用法](#基础用法)
5. [示例与组合](#示例与组合)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 Dotenv

Dotenv 是 Node.js 中常用的**环境变量加载库**，从 `.env` 文件读取键值对并写入 `process.env`，让“配置与代码分离”更简单，符合 [The Twelve-Factor App](https://12factor.net/config) 的配置方式。

### 为什么选择 Dotenv？
- ✅ 零依赖，体积小
- ✅ 用法简单：一行 `config()` 即可
- ✅ 支持自定义路径、多文件、覆盖策略
- ✅ 提供 `config` / `parse` / `populate`，可只解析不写入
- ✅ 支持 ESM：`import 'dotenv/config'` 或 `dotenv.config({ path })`
- ✅ 支持 Preload：`node -r dotenv/config script.js`

### 典型场景
- 本地开发时把数据库地址、API Key、端口等写在 `.env`，不写进代码
- 不同环境用不同 `.env`（如 `.env.development`、`.env.production`）
- 与 Express、Nest、Fastify 等框架一起用，在应用入口最早就加载

---

## 原理：如何从 .env 到 process.env

Dotenv 的核心是：**读取 .env 文件为文本 → 按行解析成键值对 → 将键值对写入 `process.env`**。

1. **读文件**：用 Node 的 `fs.readFileSync` 或异步接口读取指定路径（默认当前目录 `.env`），得到字符串；若文件不存在可根据配置静默跳过或抛错。
2. **解析行**：按换行拆成行，忽略空行；每行按「第一个 `=` 分割」得到 key 与 value；value 可去首尾引号、处理转义（如 `\n`），支持单引号/双引号；以 `#` 开头视为注释丢弃。
3. **写入 process.env**：解析出的 key-value 逐个赋给 `process.env[key] = value`；若配置了 `override: false`，则仅当 key 尚未存在时才写入，避免覆盖已有环境变量。
4. **多文件与优先级**：若加载多个 .env 文件，后加载的可根据 `override` 决定是否覆盖先前的；最终以 `process.env` 中存在的值为准，便于与系统环境变量或 CI 注入变量配合。

---

## 安装与引入

### 1. 安装依赖

```bash
npm install dotenv
# 或
pnpm add dotenv
# 或
yarn add dotenv
```

### 2. ESM 引入方式

**方式一：无配置时，直接加载默认 `.env`**

```javascript
import 'dotenv/config';

// 之后 process.env 中已有 .env 里的变量
console.log(process.env.APP_PORT);
```

**方式二：需要传配置（如自定义 path）时**

```javascript
import dotenv from 'dotenv';

dotenv.config({ path: '/custom/path/to/.env' });
console.log(process.env.SECRET_KEY);
```

**注意**：若其他模块在「未执行 dotenv」前就读取了 `process.env`，会拿不到 `.env` 的值。因此无论用哪种方式，都要**在应用入口最早执行**；用 `import 'dotenv/config'` 时，确保该 import 出现在所有依赖 `process.env` 的 import 之前。

### 3. 项目结构示例

```
tools/
├── package.json
├── .env                 # 本地环境变量（不提交到 Git）
├── .env.example         # 示例，列出需要的变量名（可提交）
├── src/
│   ├── 04_dotenv/
│   │   ├── dotenv.md    # 本学习文档
│   │   └── demo.js      # 示例脚本（可选）
│   └── index.js         # 入口里先 import 'dotenv/config' 或 dotenv.config()
└── ...
```

---

## 基础用法

### 1. 准备 .env 文件

在项目根目录（或你指定的路径）新建 `.env`：

```ini
# .env
APP_PORT=3000
DATABASE_URL=postgres://localhost/mydb
SECRET_KEY=your-secret-key
API_KEY=abc123
```

- 格式：`KEY=value`，等号两边可有空格（会被 trim）
- 注释：以 `#` 开头到行末的内容会被忽略；若**值**里含有 `#`，请用引号包起来
- 空行会被跳过

### 2. 在代码里加载并读取

```javascript
import 'dotenv/config';

console.log(process.env.APP_PORT);      // '3000'
console.log(process.env.DATABASE_URL);  // 'postgres://localhost/mydb'
```

或使用 `dotenv.config()` 并检查错误：

```javascript
import dotenv from 'dotenv';

const result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);  // { APP_PORT: '3000', ... }
```

### 3. 带引号的值

- 单引号、双引号内的内容会保留，包括空格和 `#`
- 双引号内可用 `\n` 表示换行

```ini
GREETING="Hello World"
HASH="value-with-#-inside"
MULTILINE="line1\nline2"
```

### 4. 多行值（如私钥）

可用多行书写（需用引号包住整段），或在一行里用 `\n`：

```ini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"
```

### 5. 空值

```ini
EMPTY=
```

解析结果为 `{ EMPTY: '' }`。

---

## 示例与组合

### 1. 按环境加载不同文件

```javascript
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

dotenv.config({ path: path.resolve(__dirname, '..', envFile) });
// 若不存在则静默；若需“必须存在”可检查 result.error
```

### 2. 多文件叠加（先加载的优先，除非 override）

```javascript
import dotenv from 'dotenv';

// 先 .env.local，再 .env；同 key 以先出现的为准（除非设 override: true）
dotenv.config({ path: ['.env.local', '.env'] });
```

### 3. 只解析、不写入 process.env

需要把 `.env` 当“配置对象”用、或写入自定义对象时，用 `parse`：

```javascript
import dotenv from 'dotenv';
import fs from 'fs';

const buf = fs.readFileSync('.env');
const parsed = dotenv.parse(buf);
console.log(parsed);  // { KEY: 'value', ... }
// process.env 不会被修改
```

### 4. 写入自定义对象：processEnv / populate

**使用 config 的 processEnv：**

```javascript
import dotenv from 'dotenv';

const myConfig = {};
dotenv.config({ processEnv: myConfig });

console.log(myConfig.APP_PORT);  // 有值
console.log(process.env.APP_PORT);  // 未修改
```

**使用 populate：**

```javascript
import dotenv from 'dotenv';

const parsed = { HELLO: 'world' };
const target = {};
dotenv.populate(target, parsed, { override: true });

console.log(target.HELLO);  // 'world'
```

### 5. 与 Commander / 入口脚本结合

```javascript
// index.js
import 'dotenv/config';
import { Command } from 'commander';

const program = new Command();
program
  .command('start')
  .action(() => {
    const port = process.env.APP_PORT || 3000;
    console.log('Listen on', port);
  });
program.parse();
```

---

## 高级特性

### 1. config(options) 选项说明

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `path` | `string \| string[]` | `path.resolve(process.cwd(), '.env')` | 要加载的文件路径；数组时按顺序加载并合并 |
| `encoding` | `string` | `'utf8'` | 文件编码 |
| `debug` | `boolean` | `false` | 为 true 时在控制台输出解析/覆盖等调试信息 |
| `override` | `boolean` | `false` | 为 true 时，.env 中的值会覆盖已有 `process.env`；多文件时“后加载”覆盖“先加载” |
| `processEnv` | `object` | `process.env` | 写入的目标对象，不一定要写进 `process.env` |
| `quiet` | `boolean` | `false` | 为 true 时抑制运行时的日志输出（如 “injecting env (n) from .env”） |

**path 为数组时：**

- 默认（`override: false`）：同 key 以**先**出现的为准，且若 `process.env` 里已有该 key 则不会改。
- `override: true`：同 key 以**后**出现的为准，且会覆盖已有 `process.env`。

```javascript
import dotenv from 'dotenv';

dotenv.config({
  path: ['.env.local', '.env'],
  encoding: 'utf8',
  override: false,
  debug: process.env.DEBUG === '1',
});
```

### 2. 返回值与错误处理

```javascript
const result = dotenv.config();

if (result.error) {
  console.error('加载 .env 失败', result.error);
  process.exit(1);
}
console.log('已加载变量:', Object.keys(result.parsed));
```

### 3. Preload：不改业务代码即可加载 .env

在启动命令里用 Node 的 `-r` 预加载 dotenv，业务代码里可以不写任何 `import 'dotenv/config'`：

```bash
node -r dotenv/config src/index.js
```

通过环境变量或命令行参数传配置（下划线形式）：

```bash
DOTENV_CONFIG_PATH=./.env.production node -r dotenv/config src/index.js
# 或
node -r dotenv/config src/index.js dotenv_config_path=./.env.production dotenv_config_debug=true
```

常见可用变量名：`DOTENV_CONFIG_PATH`、`DOTENV_CONFIG_DEBUG`、`DOTENV_CONFIG_ENCODING` 等（与 config 的 path、debug、encoding 对应）。

### 4. parse(buf, options?) 的选项

`parse` 只做“字符串 → 对象”的解析，不读文件、不写 `process.env`。可选第二参数里常用 `debug`：

```javascript
const parsed = dotenv.parse(buf, { debug: true });
```

### 5. populate(target, source, options?)

把“已解析的对象”按规则合并进“目标对象”，可代替直接改 `process.env`：

```javascript
dotenv.populate(process.env, parsed, { override: true, debug: false });
```

### 6. .env 解析规则速览

- `KEY=value` → `{ KEY: 'value' }`
- 未引号的值会 trim 首尾空格
- 单/双引号内保留空格和 `#`
- 双引号内 `\n` 会被当作换行
- 空行跳过，`#` 到行末为注释

---

## 最佳实践

### 1. 不要提交 .env 到 Git

`.env` 里通常是密钥、本地数据库地址等，应加入 `.gitignore`。可提交 `.env.example`，只写变量名和示例值，方便他人知道要配哪些项：

```ini
# .env.example
APP_PORT=3000
DATABASE_URL=postgres://localhost/mydb
SECRET_KEY=change-me
```

### 2. 在入口最顶部加载

确保任何模块在被执行前，dotenv 已经跑过，否则可能读到空的 `process.env`：

```javascript
// 推荐：放在最前面
import 'dotenv/config';
import app from './app.js';
```

### 3. 不同环境用不同文件

建议为每个环境单独建文件（如 `.env.development`、`.env.production`），按 `NODE_ENV` 或启动参数决定加载哪一个，避免在一个文件里混写多套环境。

### 4. 需要“变量展开”时用 dotenv-expand

若希望 `.env` 里写 `DATABASE_URL="postgres://${USER}@localhost/db"` 这种引用其它变量的写法，可使用 [dotenv-expand](https://github.com/motdotla/dotenv-expand) 在解析结果上再做一次展开。

### 5. 生产环境优先用系统环境变量

线上部署时，更常见的做法是用系统环境变量、容器或平台的配置注入，而不是把 `.env` 文件打到镜像里。Dotenv 常用于本地和开发；生产若仍用 dotenv，务必保证 `.env` 不进镜像、且路径/权限受控。

### 6. 类型与校验（Node 项目）

在 TypeScript 或需要校验时，可把 `process.env.XXX` 读出来做类型断言或 schema 校验（如用 zod、joi），保证必填项存在、格式正确后再传给应用，而不是到处散落 `process.env.XXX`。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 加载默认 .env | `import 'dotenv/config'` |
| 自定义路径 | `dotenv.config({ path: '/path/to/.env' })` |
| 多文件 | `dotenv.config({ path: ['.env.local', '.env'] })` |
| 覆盖已有环境变量 | `dotenv.config({ override: true })` |
| 调试 | `dotenv.config({ debug: true })` |
| 只解析不写入 | `dotenv.parse(buf)` |
| 写入自定义对象 | `dotenv.config({ processEnv: myObj })` 或 `dotenv.populate(target, parsed)` |
| 命令行预加载 | `node -r dotenv/config script.js` |
| 预加载且指定路径 | `DOTENV_CONFIG_PATH=./.env.prod node -r dotenv/config script.js` |

---

## 参考与延伸

- [Dotenv GitHub](https://github.com/motdotla/dotenv)
- [The Twelve-Factor App（配置）](https://12factor.net/config)
- [dotenv-expand](https://github.com/motdotla/dotenv-expand) - 变量展开
- [dotenvx](https://github.com/dotenvx/dotenvx) - 多环境、加密、命令行等增强
