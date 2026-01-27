# fs-extra 从零开始学习指南

## 📚 目录
1. [什么是 fs-extra](#什么是-fs-extra)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 fs-extra

fs-extra 是 Node.js 中常用的**文件系统扩展库**，在原生 `fs` 之上增加“递归/确保存在/一键复制删除”等能力，并为所有异步方法提供 Promise 支持；同时使用 [graceful-fs](https://github.com/isaacs/node-graceful-fs) 缓解 `EMFILE` 等问题，可作为 `fs` 的替代使用。

### 为什么选择 fs-extra？
- ✅ 包含原生 `fs` 的全部方法，并可替代 `fs`
- ✅ 所有异步方法在「不传 callback」时返回 Promise，方便 async/await
- ✅ 提供 `copy` / `remove` / `ensureDir` / `pathExists` / `readJson` 等扩展方法
- ✅ 递归创建目录、递归复制/删除，无需自己写 mkdirp、rimraf、ncp
- ✅ 使用 graceful-fs，减少打开文件过多导致的 EMFILE

### 典型场景
- 递归创建目录：`ensureDir('dist/assets')`，父目录不存在也会自动创建
- 递归复制/删除：`copy('src', 'dest')`、`remove('temp')`
- 判断路径是否存在：`pathExists(path)` 返回 boolean，不抛错
- 读写 JSON 文件：`readJson` / `writeJson` / `outputJson`，一步解析或序列化
- 写入文件且自动创建父目录：`outputFile('dist/a/b.txt', content)`，等价于先 ensureDir 再 writeFile

---

## 安装与引入

### 1. 安装依赖

```bash
npm install fs-extra
# 或
pnpm add fs-extra
# 或
yarn add fs-extra
```

### 2. ESM 引入（推荐）

**方式一：默认导入，同时拥有 fs 与 fs-extra 方法**

```javascript
import fs from 'fs-extra';

// fs 原生方法 + fs-extra 扩展方法都在 fs 上
const data = await fs.readFile('file.txt', 'utf-8');
await fs.ensureDir('dist/subdir');
await fs.copy('src', 'dist');
await fs.pathExists('file.txt');
```

**方式二：fs-extra/esm 仅扩展方法（需单独引入 fs）**

```javascript
import { readFile } from 'fs/promises';
import { outputFile, ensureDir, pathExists } from 'fs-extra/esm';

await ensureDir('dist');
await outputFile('dist/out.txt', 'hello');
const exists = await pathExists('dist/out.txt');
```

日常开发更推荐**方式一**：`import fs from 'fs-extra'`，一次引入即可替代 `fs` 并使用所有扩展方法。

### 3. 项目结构示例

```
tools/
├── package.json
├── src/
│   ├── 05_fs-extra/
│   │   ├── fs-extra.md   # 本学习文档
│   │   └── demo.js       # 示例脚本（可选）
│   └── index.js
└── ...
```

---

## 基础用法

### 1. 递归创建目录：ensureDir / ensureDirSync

若目录不存在则创建，包括所有父级目录；若已存在则不报错。

```javascript
import fs from 'fs-extra';

await fs.ensureDir('dist/assets/images');
// 等价于 mkdir -p dist/assets/images

// 同步
fs.ensureDirSync('dist/assets/images');
```

### 2. 确保文件存在：ensureFile / ensureFileSync

若文件不存在则创建空文件（并创建父目录）；若已存在则不修改。

```javascript
await fs.ensureFile('log/app.log');
// 之后可安全地 appendFile / writeFile

fs.ensureFileSync('config/local.json');
```

### 3. 判断路径是否存在：pathExists / pathExistsSync

返回 `true` / `false`，文件或目录不存在时不会抛错（与 `fs.exists` 已废弃、且不推荐用 `stat` 再 try/catch 相比更简洁）。

```javascript
const exists = await fs.pathExists('./config.json');
if (exists) {
  const data = await fs.readJson('./config.json');
}

const hasDir = fs.pathExistsSync('dist');
```

### 4. 递归删除：remove / removeSync

删除文件或目录（含子内容），类似 `rm -rf`。

```javascript
await fs.remove('temp');
await fs.remove('dist/build');

fs.removeSync('cache');
```

### 5. 清空目录内容：emptyDir / emptyDirSync

清空目录内所有内容，目录本身保留；若目录不存在会先创建。

```javascript
await fs.emptyDir('dist');
// 之后 dist 存在且为空目录

fs.emptyDirSync('cache');
```

### 6. 递归复制：copy / copySync

复制文件或目录到目标路径；若目标是目录则整体拷贝到该目录下。

```javascript
await fs.copy('src', 'dist');
await fs.copy('package.json', 'dist/package.json');

fs.copySync('public', 'dist/public');
```

### 7. 移动：move / moveSync

移动文件或目录；支持跨磁盘（内部会先复制再删除），并可设置 `overwrite`。

```javascript
await fs.move('old.txt', 'new.txt');
await fs.move('build', 'dist/build', { overwrite: true });

fs.moveSync('a', 'b');
```

---

## 示例与组合

### 1. 读写 JSON：readJson / writeJson / outputJson

**readJson**：读文件并解析为对象；**writeJson**：把对象序列化后写入（不自动创建父目录）；**outputJson**：同 writeJson，但会先 ensureDir 再写，相当于“有则覆盖、无则创建路径”。

```javascript
import fs from 'fs-extra';

// 读
const config = await fs.readJson('config.json');
const local = fs.readJsonSync('config.local.json', { throws: false });
// throws: false 时，文件不存在或非法 JSON 返回 null，不抛错

// 写（父目录须已存在）
await fs.writeJson('dist/config.json', { name: 'app', version: 1 });

// 写并自动创建父目录
await fs.outputJson('dist/config.json', { name: 'app' });
```

### 2. 写入文本并自动创建父目录：outputFile / outputFileSync

若父目录不存在会先创建，再写入内容；若文件已存在则覆盖。

```javascript
await fs.outputFile('dist/assets/style.css', 'body {}');
await fs.outputFile('log/app.log', 'start\n', { flag: 'a' });

fs.outputFileSync('dist/README.txt', 'hello');
```

### 3. 构建前清空并复制

```javascript
import fs from 'fs-extra';

await fs.ensureDir('dist');
await fs.emptyDir('dist');
await fs.copy('src', 'dist');
await fs.copy('package.json', 'dist/package.json');
```

### 4. 按条件删除或备份

```javascript
const cacheDir = 'cache';
if (await fs.pathExists(cacheDir)) {
  await fs.remove(cacheDir);
}
await fs.ensureDir(cacheDir);

// 备份
if (await fs.pathExists('data.json')) {
  await fs.move('data.json', 'data.json.bak', { overwrite: true });
}
```

### 5. 与 Commander / 脚本结合

```javascript
import fs from 'fs-extra';
import { Command } from 'commander';

const program = new Command();

program
  .command('init')
  .action(async () => {
    await fs.ensureDir('src');
    await fs.outputJson('config.json', { name: 'my-app' });
    console.log('Init done.');
  });

program
  .command('clean')
  .action(async () => {
    if (await fs.pathExists('dist')) {
      await fs.remove('dist');
      console.log('Removed dist');
    }
  });

program.parse();
```

---

## 高级特性

### 1. 异步 / 同步 / Callback

- **异步**：不传 callback 时返回 Promise，可用 `await`。
- **同步**：带 `Sync` 后缀的方法（如 `copySync`、`ensureDirSync`），抛错即失败。
- **Callback**：部分方法保留回调写法，传 `(err, result) => {}` 作为最后一参。

```javascript
// Promise / async-await
await fs.copy('a', 'b');

// Callback
fs.copy('a', 'b', err => {
  if (err) console.error(err);
  else console.log('done');
});

// Sync
fs.copySync('a', 'b');
```

### 2. copy 的常用选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `overwrite` | `boolean` | 是否覆盖已存在的目标，默认 true |
| `filter` | `(src, dest) => boolean` | 返回 false 则跳过该文件/目录 |
| `recursive` | `boolean` | 目录是否递归复制，默认 true |
| `preserveTimestamps` | `boolean` | 是否保留 mtime/atime |

```javascript
await fs.copy('src', 'dist', {
  filter: (src) => !src.endsWith('.tmp'),
  overwrite: true,
});
```

### 3. readJson / outputJson 的选项

- **readJson**：`encoding`、`throws`（默认 true，非法或不存在时抛错；false 时返回 null）、`reviver` 等，与 `JSON.parse` 类似。
- **writeJson / outputJson**：`spaces`（格式化缩进）、`replacer`、`encoding` 等，与 `JSON.stringify` 类似。

```javascript
const obj = await fs.readJson('config.json', { throws: false });
await fs.outputJson('out.json', data, { spaces: 2 });
```

### 4. 符号链接：ensureSymlink / ensureLink

- **ensureSymlink**：确保目标路径是一个指向 `src` 的符号链接，若已存在且指向正确则不改。
- **ensureLink**：确保硬链接存在（少用）。

```javascript
await fs.ensureSymlink('target.js', 'link.js');
```

Windows 上创建符号链接可能需要提升权限或开启“开发人员模式”。

### 5. 与原生 fs 的关系

- `import fs from 'fs-extra'` 得到的对象上，既有原生 `fs` 的方法（如 `readFile`、`writeFile`、`readdir`、`stat`），也有 fs-extra 的扩展方法（如 `copy`、`ensureDir`、`pathExists`）。
- 原生异步方法在「不传 callback」时同样返回 Promise，可直接 `await fs.readFile(...)`。
- 若使用 `fs-extra/esm` 的具名导出，则**不**包含原生 fs 方法，需要单独 `import fs from 'fs'` 或 `import { readFile } from 'fs/promises'`。

### 6. 方法一览（异步 / Sync 成对）

| 扩展方法（异步） | 同步 | 说明 |
|------------------|------|------|
| `copy` | `copySync` | 递归复制 |
| `remove` | `removeSync` | 递归删除 |
| `ensureDir` | `ensureDirSync` | 递归创建目录 |
| `ensureFile` | `ensureFileSync` | 确保文件存在 |
| `emptyDir` | `emptyDirSync` | 清空目录内容 |
| `pathExists` | `pathExistsSync` | 路径是否存在 |
| `move` | `moveSync` | 移动 |
| `readJson` | `readJsonSync` | 读并解析 JSON |
| `writeJson` | `writeJsonSync` | 写 JSON |
| `outputFile` | `outputFileSync` | 写文件并创建父目录 |
| `outputJson` | `outputJsonSync` | 写 JSON 并创建父目录 |
| `ensureSymlink` | `ensureSymlinkSync` | 确保符号链接存在 |

---

## 最佳实践

### 1. 优先用异步 + async/await

在非脚本、非一次性 CLI 的场景，尽量用异步方法，避免阻塞事件循环；用 `await` 写法更清晰，错误用 try/catch 或 Promise 链处理。

### 2. 写前先 ensureDir 或直接用 outputFile / outputJson

若要写到 `dist/subdir/file.txt`，要么先 `await fs.ensureDir('dist/subdir')` 再 `writeFile`，要么直接用 `outputFile('dist/subdir/file.txt', content)`，避免因父目录不存在而报错。

### 3. 判断存在用 pathExists，不要依赖 exists

`fs.exists` 已废弃；用 `fs.pathExists(path)` 或 `fs.pathExistsSync(path)` 得到布尔值，逻辑清晰且不抛错。

### 4. 删目录前确认路径，避免误删

`remove` 会递归删除，对路径做白名单或二次确认（如仅允许删 `temp`、`dist`、`cache`），避免把项目根或用户目录删掉。

### 5. 大目录复制/删除注意耗时与 EMFILE

fs-extra 已使用 graceful-fs，但在超大目录下仍有并发限制。若需更强控制，可考虑分批、队列或专门工具（如 [del](https://github.com/sindresorhus/del)、[cpy](https://github.com/sindresorhus/cpy) 等）。

### 6. JSON 读取加 throws: false 做降级

若配置文件可选或可能损坏，可用 `readJson(path, { throws: false })`，在失败时得到 `null`，再给默认配置，而不是直接抛错退出。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 递归建目录 | `await fs.ensureDir('dist/sub')` |
| 确保文件存在 | `await fs.ensureFile('log.txt')` |
| 路径是否存在 | `await fs.pathExists('a')` |
| 递归删除 | `await fs.remove('temp')` |
| 清空目录 | `await fs.emptyDir('dist')` |
| 递归复制 | `await fs.copy('src', 'dist')` |
| 移动 | `await fs.move('a', 'b')` |
| 读 JSON | `await fs.readJson('config.json')` |
| 写 JSON | `await fs.writeJson('out.json', obj)` |
| 写 JSON 并建目录 | `await fs.outputJson('dist/config.json', obj)` |
| 写文件并建目录 | `await fs.outputFile('dist/a.txt', 'hi')` |
| 同步复制 | `fs.copySync('src', 'dist')` |

---

## 参考与延伸

- [fs-extra GitHub](https://github.com/jprichardson/node-fs-extra)
- [Node.js fs](https://nodejs.org/api/fs.html) - 原生文件系统
- [graceful-fs](https://github.com/isaacs/node-graceful-fs) - 缓解 EMFILE
- [klaw](https://github.com/jprichardson/node-klaw) / [klaw-sync](https://github.com/manidlou/node-klaw-sync) - 目录递归遍历（fs-extra 已移除 walk）
