# archiver 学习文档

> Node.js 下用流式接口生成压缩包（ZIP、TAR/TAR.GZ）

## 📚 目录

1. [用大白话说：archiver 是啥](#用大白话说archiver-是啥)
2. [原理：流式压缩与格式约定](#原理流式压缩与格式约定)
3. [安装与引入](#安装与引入)
4. [支持的格式](#支持的格式)
5. [核心 API](#核心-api)
6. [完整示例](#完整示例)
7. [事件与进度](#事件与进度)
8. [常见坑与最佳实践](#常见坑与最佳实践)
9. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：archiver 是啥

### 你遇到的问题（手写压缩时）

- **要打 zip/tar 包**：把一堆文件或目录打成 .zip、.tar、.tar.gz，给用户下载或备份。
- **不想用命令行**：不想在 Node 里调 `child_process` 跑 zip/tar 命令，跨平台、错误处理都麻烦。
- **要流式、别占内存**：文件很大或很多时，希望边读边写流，而不是先全读进内存再压。

也就是说：**在 Node 里用代码打 zip/tar 包、支持流、API 简单**，就是 archiver 要解决的问题。

### archiver 帮你做啥

**archiver** 是 Node.js 的 **流式压缩库**：

1. **流式**：基于 Stream，压缩结果通过 pipe 写到文件或 HTTP 响应，不要求先把所有文件读进内存。
2. **两种格式**：内置支持 **ZIP** 和 **TAR**（TAR 可配 gzip 变成 .tar.gz）。
3. **多种输入**：可以追加**单个文件**、**整个目录**（递归）、**Glob 匹配**、**Buffer/字符串/Stream**，还能往包里加**符号链接**（不跟文件系统交互）。
4. **事件**：支持 `progress`、`entry`、`error`、`warning`，方便做进度条或日志。

一句话：**archiver = 在 Node 里用流式 API 打 ZIP/TAR 包**，适合下载打包、备份、构建产物打包等场景。

---

## 原理：流式压缩与格式约定

**核心思路**：ZIP/TAR 都是「按条目顺序写」的格式：每个文件/目录对应一条「头部 + 内容」记录；archiver 不先把所有文件读进内存，而是**边读源边写流**：你 append 一个文件，它就写一条记录到输出流，再读下一项，这样内存占用与文件数量、单文件大小解耦。

- **ZIP 格式**：每条记录有本地文件头（文件名、压缩方法、CRC、压缩后长度等）+ 可选压缩数据；archiver 用 zlib 做 deflate 压缩（或 store 不压缩），按 ZIP 规范顺序写入；支持追加、最后写 Central Directory。
- **TAR 格式**：每条记录 512 字节头（文件名、大小、模式等）+ 文件内容（按 512 对齐）；不压缩时直接写；配 gzip 时输出流再 pipe 到 zlib.createGzip()，即 .tar.gz。
- **流式**：输入可以是 Stream、Buffer、字符串或从文件系统读；输出是 Writable Stream，可 pipe 到 fs.createWriteStream 或 HTTP response，由调用方控制背压与关闭。

---

## 安装与引入

### 安装

```bash
pnpm add archiver
# 或
npm i archiver
```

### 引入

```javascript
// CommonJS
const archiver = require('archiver');

// ESM
import archiver from 'archiver';
```

- **Node 版本**：需支持 Stream，通常 Node 12+ 即可；具体以 [archiver 文档](https://www.archiverjs.com/) 为准。

---

## 支持的格式

| 格式 | 说明 | 创建方式 |
|------|------|----------|
| **zip** | ZIP 压缩包 | `archiver('zip', options)` |
| **tar** | 仅打包不压缩 | `archiver('tar', options)` |
| **tar** + gzip | .tar.gz | `archiver('tar', { gzip: true, gzipOptions: { level: 9 } })` |

- **ZIP 选项**：如 `comment`、`store`（仅存储不压缩）、`zlib`（压缩级别）等。
- **TAR 选项**：`gzip`、`gzipOptions` 传给 zlib；其他见 [tar-stream](https://www.npmjs.com/package/tar-stream)。

---

## 核心 API

### 创建实例

```javascript
const archive = archiver('zip', {
  zlib: { level: 9 },  // ZIP 压缩级别 0–9
  // statConcurrency: 4, // 内部 fs stat 并发数，默认 4
});
```

- 返回的是 **Duplex 流**：可读可写，一般用 **pipe** 接到写入目标（如 `fs.createWriteStream` 或 HTTP response）。

### 写入目标（pipe）

```javascript
const output = fs.createWriteStream('dist.zip');
archive.pipe(output);
// 然后往 archive 里追加内容，最后 finalize()
```

- **HTTP 响应**：`archive.pipe(res)`，并设置 `Content-Type`、`Content-Disposition` 等；注意先设好响应头再 pipe。

### 追加内容

| 方法 | 作用 |
|------|------|
| **append(source, data)** | 追加一段内容：Buffer、Stream 或字符串；`data` 里至少要有 `name`（包内路径）。 |
| **file(filepath, data)** | 追加**单个文件**，按路径从磁盘读；`data` 可含 `name` 等 [Entry Data](https://www.archiverjs.com/docs/archiver/#entry-data)。 |
| **directory(dirpath, destpath, data)** | 追加**整个目录**（递归），`dirpath` 是本地路径，`destpath` 是包内目录路径。 |
| **glob(pattern, options, data)** | 按 **Glob 模式**匹配文件并追加；`options` 可含 `cwd` 等。 |
| **symlink(filepath, target, mode)** | 在包内添加一条**符号链接**（不读文件系统）。 |

- **Entry Data** 常用字段：`name`（包内路径）、`date`、`mode`、`prefix`、`stats` 等；ZIP 还有 `store`、`namePrependSlash` 等。

### 结束与清理

| 方法 | 作用 |
|------|------|
| **finalize()** | 结束追加，关闭压缩结构；之后不能再 append/file/directory。目标流的 `finish`/`close` 会在此后触发。 |
| **abort()** | 中止打包（清队列、断开管道），不 drain 剩余数据。 |

### 其他

- **pointer()**：返回当前已写入的字节数，可用于简单进度。

---

## 完整示例

### 示例 1：打一个 ZIP 包到文件

```javascript
import fs from 'fs';
import archiver from 'archiver';

const output = fs.createWriteStream('dist.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('已写入 %d 字节', archive.pointer());
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// 单文件
archive.file('README.md', { name: 'README.md' });
// 整个目录（包内放到 src/ 下）
archive.directory('src/', 'src');
// 或 Glob
archive.glob('**/*.js', { cwd: 'lib' }, { prefix: 'lib' });

archive.finalize();
```

### 示例 2：TAR.GZ 到文件

```javascript
const archive = archiver('tar', {
  gzip: true,
  gzipOptions: { level: 9 },
});
const output = fs.createWriteStream('dist.tar.gz');
archive.pipe(output);

archive.directory('dist/', false); // false 表示包内根目录就是 dist 里的内容
archive.finalize();
```

### 示例 3：ZIP 通过 HTTP 响应下载

```javascript
app.get('/download', (req, res) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  res.attachment('pack.zip');
  archive.pipe(res);

  archive.directory('public/', false);
  archive.on('error', (err) => {
    res.status(500).end();
  });
  archive.finalize();
});
```

### 示例 4：追加 Buffer / 字符串

```javascript
archive.append(Buffer.from('hello'), { name: 'hello.txt' });
archive.append('world', { name: 'world.txt' });
```

---

## 事件与进度

- **entry**：每追加完一个条目（文件/目录项）触发，参数为 entry data。
- **progress**：进度信息，包含 `entries.total`、`entries.processed`、`fs.totalBytes`、`fs.processedBytes`（基于已追加的条目和字节，大目录时 total 可能随追加增长）。
- **error**：出错时触发，需监听并处理，否则可能未捕获异常。
- **warning**：非致命警告（如 stat 失败等），参数结构类似 error。

```javascript
archive.on('progress', (p) => {
  console.log('已处理条目: %d', p.entries.processed);
  console.log('已处理字节: %d', p.fs.processedBytes);
});
archive.on('error', (err) => console.error(err));
```

---

## 常见坑与最佳实践

1. **先 pipe 再追加**：必须先 `archive.pipe(output)`，再 `file`/`directory`/`append`，最后 `finalize()`，顺序错了可能写不完整或报错。
2. **监听 error**：目标流和 archive 都要监听 `error`，否则出错时可能未捕获。
3. **finalize 后不再追加**：调用 `finalize()` 后不能再调用 append/file/directory；如需重试，重新创建一个 archiver 实例。
4. **HTTP 响应**：用 pipe 到 `res` 时，先设置好 `Content-Disposition`、`Content-Type` 等响应头，再 pipe，避免流已开始写再改头。
5. **大目录**：directory/glob 会递归，大目录时用 `progress` 或 `pointer()` 做进度；`statConcurrency` 可适当调大，减轻 I/O 排队。
6. **ZIP 注释/时间**：ZIP 选项里 `comment`、`forceLocalTime` 等按需设置；TAR 的 gzip 级别用 `gzipOptions.level`。

---

## 参考与延伸阅读

- [archiver 官方文档](https://www.archiverjs.com/docs/archiver/)
- [archiver GitHub](https://github.com/archiverjs/node-archiver)
- [Node.js Stream](https://nodejs.org/api/stream.html)
- 解压：与 archiver 配套的解压库为 [extract-zip](https://www.npmjs.com/package/extract-zip)、[tar-stream](https://www.npmjs.com/package/tar-stream) 等，按需选用。

---

**文档版本**：针对 archiver 当前 API 整理；具体选项与事件以 [Archiver API 文档](https://www.archiverjs.com/docs/archiver/) 为准。
