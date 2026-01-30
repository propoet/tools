# cac 学习文档

> 轻量级命令行应用框架：子命令、选项、帮助、版本，无依赖单文件

## 📚 目录

1. [用大白话说：cac 是啥](#用大白话说cac-是啥)
2. [原理：参数解析与子命令分发](#原理参数解析与子命令分发)
3. [安装与引入](#安装与引入)
4. [核心 API：四个基础方法](#核心-api四个基础方法)
5. [子命令：command、action、alias](#子命令commandactionalias)
6. [参数与括号约定](#参数与括号约定)
7. [选项进阶](#选项进阶)
8. [默认命令、错误处理与事件](#默认命令错误处理与事件)
9. [完整示例](#完整示例)
10. [与 Commander.js 简要对比](#与-commanderjs-简要对比)
11. [常见坑与最佳实践](#常见坑与最佳实践)
12. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：cac 是啥

### 你遇到的问题（手写 CLI 时）

- **解析参数**：`process.argv` 要自己拆 `--port 3000`、`-h`、子命令，容易漏、难维护。
- **帮助与版本**：要手写 `-h`/`--help`、`-v`/`--version` 的逻辑和文案。
- **子命令**：像 `git commit`、`npm install` 这种「动词 + 参数 + 选项」，自己写很啰嗦。

也就是说：**统一解析参数、子命令、选项、帮助、版本**，就是 cac 要解决的。

### cac 帮你做啥

**cac**（Command And Conquer）是 **Node.js 下构建 CLI 的轻量库**：

1. **无依赖、单文件**：体积小，只依赖 Node。
2. **四个基础 API**：`cli.option`、`cli.version`、`cli.help`、`cli.parse` 就能做简单 CLI。
3. **子命令**：`cli.command(name, description)` + `command.action(callback)`，类似 git 风格。
4. **自动帮助**：根据 command/option 生成帮助信息；`-h`/`--help` 触发。
5. **参数约定**：尖括号必填、方括号可选、`...` 可变参数；选项支持默认值、数组、点式嵌套（如 `--env.API_SECRET`）。
6. **TypeScript**：源码 TS，类型友好。

一句话：**cac = 轻量 CLI 框架**，子命令 + 选项 + 帮助 + 版本，API 少、够用。

---

## 原理：参数解析与子命令分发

**核心思路**：CLI 入口拿到 `process.argv`（如 `['node', 'script.js', 'build', '--port', '3000']`），需要拆成「程序名、子命令、位置参数、选项」；cac 先根据**子命令**选分支，再在该分支下解析选项和位置参数，最后把解析结果传给注册的 action。

- **解析顺序**：argv 去掉前两项（node、脚本路径）得到 tokens；先看第一个 token 是否是已注册的 command 名，是则进入该 command 的选项与参数解析，否则当默认命令或报错；选项用 `--key value` 或 `--key=value`，短选项可合并 `-abc`。
- **选项与默认值**：每个 option 有 name、type、default；解析时把匹配到的值填进 options 对象，支持点式 key（如 `--env.API_SECRET`）做嵌套；未传的用 default，再交给 action(options, parsed) 使用。
- **帮助与版本**：help 根据已注册的 command 和 option 拼出说明文案；version 从 package.json 或传入字符串读；`-h`/`--help`、`-v`/`--version` 触发后直接输出并 process.exit，不执行 action。

---

## 安装与引入

### 安装

```bash
pnpm add cac
# 或
npm i cac
```

### 引入

```javascript
// CommonJS
const { cac } = require('cac');

// ESM
import { cac } from 'cac';
```

### 创建 CLI 实例

```javascript
const cli = cac();           // 程序名用 argv[1] 的 basename
const cli = cac('my-cli');   // 指定程序名，用于帮助和版本输出
```

---

## 核心 API：四个基础方法

### 1. cli.option(name, description, config?)

添加**全局选项**（所有命令都可用的选项）。

```javascript
cli.option('--type <type>', 'Choose a project type', { default: 'node' });
cli.option('--name <name>', 'Provide your name');
cli.option('-p, --port <port>', 'Port number');
```

- **尖括号 `<name>`**：选项需要传值（字符串/数字）。  
- **方括号 `[name]`**：可选值，不传时可为 `true`。  
- **config.default**：默认值。  
- **config.type**：如 `[String]` 转换类型，`[]` 表示多值成数组（多次 `--include a --include b` → `include: ['a','b']`）。

### 2. cli.version(version, customFlags?)

注册版本号；用户传 `-v` 或 `--version` 时打印版本并退出。

```javascript
cli.version('1.0.0');
cli.version('1.0.0', '-V, --version'); // 自定义 flags
```

### 3. cli.help(callback?)

注册帮助；用户传 `-h` 或 `--help` 时打印帮助并退出。

```javascript
cli.help();
cli.help((sections) => {
  // sections: { title?, body }[]，可修改后再输出
});
```

### 4. cli.parse(argv?)

解析命令行参数；默认用 `process.argv`。

```javascript
const parsed = cli.parse();
// parsed: { args: string[], options: Record<string, any> }
// 同时可访问：cli.args、cli.options、cli.matchedCommand、cli.rawArgs
```

- 若匹配到子命令且该命令有 `action`，会执行 action；否则只是解析，可通过 `cli.matchedCommand` 判断。

---

## 子命令：command、action、alias

### cli.command(name, description, config?)

定义子命令，返回 **Command** 实例。

```javascript
const cmd = cli.command('lint [...files]', 'Lint files');
cmd.option('--fix', 'Auto fix');
cmd.action((files, options) => {
  console.log('files:', files, 'options:', options);
});
```

- **name**：命令名 + 参数占位（见下节括号约定）。  
- **description**：帮助里显示的描述。  
- **config.allowUnknownOptions**：是否允许未声明的选项（默认否）。  
- **config.ignoreOptionDefaultValue**：不在解析结果里带选项默认值，仅帮助里显示。

### command.action(callback)

子命令匹配时执行的回调。

```javascript
cmd.action((...args, options) => {
  // 前面是位置参数（最后一个若是可变参数则为数组），最后一个是 options
});
```

- 参数顺序：与 command name 里声明的参数一一对应；若最后一个参数是 `...files`，则对应一个数组。  
- **options**：该命令的 option + 全局 option 的合并结果。

### command.alias(name)

给子命令起别名（别名里不能带括号）。

```javascript
cli.command('build', 'Build project').alias('b').action(() => {});
// 用户可输入 my-cli build 或 my-cli b
```

### command.option() / command.example(example) / command.usage(text)

- **command.option()**：和 `cli.option` 用法相同，但只对该命令生效。  
- **command.example(example)**：在帮助末尾显示示例，如 `cmd.example('my-cli build --minify')`。  
- **command.usage(text)**：该命令的 usage 说明。

---

## 参数与括号约定

### 命令名里的括号

- **尖括号 `<name>`**：必填参数。  
- **方括号 `[name]`**：可选参数。  
- **`...name`**：可变参数（只能放在最后一个位置）。

```javascript
cli.command('deploy <folder>', 'Deploy folder').action((folder, options) => {});
cli.command('build [project]', 'Build project').action((project, options) => {});
cli.command('build <entry> [...otherFiles]', 'Build').action((entry, otherFiles, options) => {});
```

### 选项名里的括号

- **`<name>`**：选项必须带值（如 `--port 3000`）。  
- **`[name]`**：选项可带值，不带时为 `true`（如 `--watch` 即 `watch: true`）。

---

## 选项进阶

### 短横线转驼峰

- `--clear-screen` 和 `--clearScreen` 在代码里都对应 **options.clearScreen**。

### 否定选项（Negated）

- 需要「默认 true、用 flag 关掉」时，手写否定项：

```javascript
cmd.option('--no-config', 'Disable config file').option('--config <path>', 'Use custom config');
// 默认 config 为 true，--no-config 时变为 false
```

### 选项值为数组

- 同一选项多次出现会变成数组：`--include a --include b` → `options.include = ['a', 'b']`。  
- 若只写一次则仍是单值：`options.include = 'a'`。

### 点式嵌套（Dot-nested）

- `--env.API_SECRET xxx` 会得到 **options.env = { API_SECRET: 'xxx' }**，多个 `--env.xxx` 会合并到同一对象。

```javascript
cmd.option('--env <key=value>', 'Set env').example('--env.API_SECRET xxx');
```

---

## 默认命令、错误处理与事件

### 默认命令

- 不写命令名、只写参数，可当作「默认命令」：

```javascript
cli.command('[...files]', 'Build files').option('--minimize', 'Minimize').action((files, options) => {});
// 用户输入 my-cli a.js b.js 会匹配该命令，files = ['a.js', 'b.js']
```

### 错误处理：parse 不执行 action

- 希望自己控制执行与错误时，可 `parse(process.argv, { run: false })`，再手动 `cli.runMatchedCommand()`：

```javascript
try {
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
```

- 当 action 返回 Promise 时，`runMatchedCommand()` 会 await。

### 事件

- 监听子命令与未知命令：

```javascript
cli.on('command:foo', () => {});
cli.on('command:!', () => {});   // 默认命令
cli.on('command:*', () => {
  console.error('Invalid command:', cli.args.join(' '));
  process.exit(1);
});
```

---

## 完整示例

```javascript
import { cac } from 'cac';

const cli = cac('my-tool');

cli.option('--type <type>', 'Project type', { default: 'node' });
cli.option('-c, --config <file>', 'Config file');
cli.version('1.0.0');
cli.help();

cli
  .command('build [entry] [...files]', 'Build files')
  .option('--minimize', 'Minimize output')
  .option('--out <dir>', 'Output directory')
  .alias('b')
  .example('my-tool build src/index.js --out dist')
  .action((entry, files, options) => {
    console.log('entry:', entry, 'files:', files, 'options:', options);
  });

cli
  .command('dev', 'Start dev server')
  .option('--port <port>', 'Port', { default: 3000 })
  .option('--open', 'Open browser')
  .action((options) => {
    console.log('dev on port', options.port, options.open);
  });

cli.parse();
```

- 运行：`node cli.js build src/index.js --out dist`、`node cli.js dev --port 8080 --open`、`node cli.js -h`、`node cli.js -v`。

---

## 与 Commander.js 简要对比

| 点 | cac | Commander.js |
|----|-----|--------------|
| 体积 | 无依赖、单文件 | 依赖更多 |
| 点式选项 | 支持 `--env.API_SECRET` | 不支持 |
| 未知选项 | 默认报错，可 `allowUnknownOptions()` | 可配置 |
| 风格 | 链式、子命令 + action | program.command + action |
| 社区 | VuePress、SAO、Poi 等在用 | 使用更广 |

- 二者都能做子命令、选项、帮助、版本；需要点式嵌套或极简依赖时可选 cac；需要 Commander 生态或习惯其 API 可继续用 Commander。

---

## 常见坑与最佳实践

1. **action 参数顺序**：与 command name 里参数声明顺序一致，可变参数对应一个数组，最后一个是 options。  
2. **子命令的未知选项**：默认会报错，需要时对该命令调用 `command.allowUnknownOptions()`。  
3. **先 help/version 再 parse**：一般先 `cli.option()`、`cli.command()`… 再 `cli.help()`、`cli.version()`，最后 `cli.parse()`。  
4. **异步 action**：action 返回 Promise 时，若用 `runMatchedCommand()` 会 await；直接用 `parse()` 时 cac 会处理 Promise。  
5. **程序名**：不传时用 `argv[1]` 的 basename，建议传 `cac('my-cli')` 以便帮助和版本输出一致。

---

## 参考与延伸阅读

- [cac GitHub](https://github.com/cacjs/cac)
- [cac API 文档（生成自源码）](https://cac-api-doc.egoist.dev/)
- 本仓库 [01_commands/commandejs.md](../01_commands/commandejs.md)：Commander.js 学习文档，可对比使用。

---

**文档版本**：针对 cac 当前 API 整理；具体以官方文档为准。
