# Chalk 从零开始学习指南

## 📚 目录
1. [什么是 Chalk](#什么是-chalk)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 Chalk

Chalk 是 Node.js 中流行的终端字符串样式库，用于在控制台输出带颜色、背景、加粗等样式的文本。

### 为什么选择 Chalk？
- ✅ 链式 API，写法直观
- ✅ 零依赖，体积小
- ✅ 支持 256 色与 1600 万 Truecolor
- ✅ 自动检测终端颜色支持
- ✅ 不扩展 `String.prototype`，安全可控
- ✅ 纯 ESM（Chalk 5.x）

---

## 安装与引入

### 1. 安装依赖

```bash
npm install chalk
# 或
pnpm add chalk
# 或
yarn add chalk
```

### 2. ESM 引入（Chalk 5.x）

```javascript
import chalk from 'chalk';

console.log(chalk.blue('Hello world!'));
```

### 3. 项目结构示例

```
tools/
├── package.json
├── src/
│   ├── 02_chalk/
│   │   ├── chalk.md      # 本学习文档
│   │   └── demo.js       # 示例脚本（可选）
│   └── index.js
└── ...
```

---

## 基础用法

### 1. 文字颜色

支持的基础颜色：`red`、`green`、`blue`、`yellow`、`magenta`、`cyan`、`white`、`black`，以及亮色变体（如 `redBright`、`gray` / `grey`）。

```javascript
import chalk from 'chalk';

console.log(chalk.red('红色文字'));
console.log(chalk.green('绿色文字'));
console.log(chalk.blue('蓝色文字'));
console.log(chalk.yellow('黄色文字'));
console.log(chalk.magenta('品红'));
console.log(chalk.cyan('青色'));
console.log(chalk.gray('灰色'));
console.log(chalk.redBright('亮红色'));
```

### 2. 背景颜色

在颜色前加 `bg` 前缀。

```javascript
console.log(chalk.bgRed('红底'));
console.log(chalk.bgGreen('绿底'));
console.log(chalk.bgBlue.white('蓝底白字'));
console.log(chalk.bgYellow.black('黄底黑字'));
```

### 3. 文本样式（Modifiers）

| 样式 | 说明 |
|------|------|
| `bold` | 加粗 |
| `dim` | 变暗/降低不透明度 |
| `italic` | 斜体（终端支持有限） |
| `underline` | 下划线 |
| `overline` | 上划线 |
| `inverse` | 前景色与背景色互换 |
| `hidden` | 隐藏文字 |
| `strikethrough` | 删除线 |
| `reset` | 重置当前样式 |

```javascript
console.log(chalk.bold('加粗'));
console.log(chalk.dim('变暗'));
console.log(chalk.underline('下划线'));
console.log(chalk.italic('斜体'));
console.log(chalk.strikethrough('删除线'));
console.log(chalk.inverse('反色'));
```

### 4. 链式调用

多个样式可链式书写，顺序无关；同类型（如两种前景色）时后者覆盖前者。

```javascript
console.log(chalk.blue.bold('蓝字加粗'));
console.log(chalk.red.underline('红字下划线'));
console.log(chalk.green.bgWhite.bold('绿字、白底、加粗'));
console.log(chalk.yellow.bold.italic('黄字加粗斜体'));
```

### 5. 多参数

传入多个参数时，会以空格拼接后再应用样式。

```javascript
console.log(chalk.blue('Hello', 'World!', 'Foo', 'bar'));
// 等价于 chalk.blue('Hello World! Foo bar')
```

---

## 示例与组合

### 1. 组合普通字符串与样式字符串

```javascript
const log = console.log;

log(chalk.blue('Hello') + ' World' + chalk.red('!'));
log('状态: ' + chalk.green('成功') + ' 或 ' + chalk.red('失败'));
```

### 2. 嵌套样式

同一段文字内可嵌套不同颜色或样式。

```javascript
log(chalk.red('这是红色，' + chalk.blue('这是蓝色') + '，又回到红色。'));

log(chalk.green(
  '整行绿色，' +
  chalk.blue.underline.bold('中间一段蓝字、下划线、加粗') +
  '，再回到绿色。'
));
```

### 3. 模板字符串

在模板字符串中嵌入 chalk 调用，便于按变量上色。

```javascript
const cpu = 90;
const ram = 40;
const disk = 70;

console.log(`
CPU: ${chalk.red(cpu + '%')}
RAM: ${chalk.green(ram + '%')}
DISK: ${chalk.yellow(disk + '%')}
`);
```

### 4. 自定义主题（语义化颜色）

把常用组合封装成函数，便于在日志、错误、警告中复用。

```javascript
const error = chalk.bold.red;
const warning = chalk.hex('#FFA500');  // 橙色
const success = chalk.bold.green;
const info = chalk.blue;

console.log(error('Error!'));
console.log(warning('Warning!'));
console.log(success('Done.'));
console.log(info('Info: something.'));
```

### 5. 与 console 占位符一起用

```javascript
const name = '张三';
console.log(chalk.green('Hello %s'), name);
// 输出: Hello 张三（其中 "Hello " 为绿色，取决于环境对 %s 与样式组合的处理）
```

### 6. CLI 状态输出示例

```javascript
console.log(chalk.green('✔ 构建成功'));
console.log(chalk.yellow('⚠ 存在警告'));
console.log(chalk.red('✖ 构建失败'));
console.log(chalk.blue('ℹ 提示信息'));
```

---

## 高级特性

### 1. HEX 与 RGB 颜色

在支持 Truecolor 的终端下，可直接使用十六进制或 RGB。

```javascript
// 十六进制
console.log(chalk.hex('#DEADED')('自定义颜色'));
console.log(chalk.hex('#FF8800').bold('橙色加粗'));

// RGB
console.log(chalk.rgb(255, 136, 0)('橙色'));
console.log(chalk.rgb(123, 45, 67).underline('深红下划线'));

// 背景色
console.log(chalk.bgHex('#333333').white('深灰底白字'));
console.log(chalk.bgRgb(15, 100, 204)('蓝底'));
```

### 2. ANSI 256 色

适合只支持 256 色的终端。

```javascript
console.log(chalk.ansi256(194)('ANSI256 色'));
console.log(chalk.bgAnsi256(28)('绿色背景'));
```

### 3. 颜色支持级别（chalk.level）

Chalk 会根据终端自动选择级别，也可手动指定：

| level | 说明 |
|-------|------|
| `0` | 关闭所有颜色 |
| `1` | 基础 16 色 |
| `2` | 256 色（ANSI256） |
| `3` | Truecolor（约 1600 万色） |

```javascript
import chalk from 'chalk';

// 仅在自身代码中覆盖（会影响全局 chalk）
chalk.level = 2;  // 强制 256 色

// 在可复用模块中，建议使用独立实例，避免影响其他使用方
import { Chalk } from 'chalk';

const noColorChalk = new Chalk({ level: 0 });
const basicChalk = new Chalk({ level: 1 });

console.log(noColorChalk.red('不会上色'));
console.log(basicChalk.red('仅基础红色'));
```

### 4. supportsColor

用于检测当前终端是否支持颜色（以及支持到哪一级），一般由 Chalk 内部使用，也可自行读取。

```javascript
import chalk from 'chalk';

// 环境变量强制开关：
// FORCE_COLOR=1 启用 | FORCE_COLOR=0 禁用
// 或运行时的 --color / --no-color
console.log('当前 level:', chalk.level);
```

常见用法：在 CI 或脚本中通过 `FORCE_COLOR=1` 打开颜色，或 `FORCE_COLOR=0` 关闭。

### 5. chalkStderr 与 stderr 颜色

若希望对 stdout 和 stderr 使用不同的颜色策略，可使用 `chalkStderr`。

```javascript
import { chalkStderr } from 'chalk';

console.error(chalkStderr.red('标准错误输出为红色'));
```

### 6. 样式名列表（用于校验或包装）

需要自己封装或校验“样式名”时，可使用导出的名称数组：

```javascript
import { modifierNames, foregroundColorNames, backgroundColorNames, colorNames } from 'chalk';

console.log(modifierNames);        // ['bold', 'dim', 'italic', ...]
console.log(foregroundColorNames); // ['black', 'red', 'green', ...]
console.log(backgroundColorNames); // ['bgBlack', 'bgRed', ...]
console.log(colorNames);           // 前景 + 背景名合并

// 简单校验示例
function isValidModifier(name) {
  return modifierNames.includes(name);
}
```

### 7. 去除 ANSI 转义码（strip-ansi）

Chalk 本身不提供 strip，若需要得到“去掉样式后的纯文本”（例如写日志、算长度），可配合社区包使用：

```bash
pnpm add strip-ansi
```

```javascript
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

const styled = chalk.red.bold('Hello');
console.log(stripAnsi(styled));  // 'Hello'
console.log(styled.length);      // 含转义码的长度
console.log(stripAnsi(styled).length);  // 纯文本长度
```

---

## 最佳实践

### 1. 按语义封装，少写魔法颜色

```javascript
const styles = {
  error: chalk.bold.red,
  warning: chalk.hex('#FFA500'),
  success: chalk.green,
  dim: chalk.dim,
};

export function logError(msg) {
  console.error(styles.error('Error:'), msg);
}
export function logSuccess(msg) {
  console.log(styles.success('✔'), msg);
}
```

### 2. 在无 TTY 时考虑关闭或降级

脚本被管道、重定向或跑在 CI 时，可检测后关闭颜色，避免在日志文件里留下乱码：

```javascript
const useColor = process.stdout.isTTY && process.env.FORCE_COLOR !== '0';
import { Chalk } from 'chalk';
const chalk = useColor ? (await import('chalk')).default : new (await import('chalk')).Chalk({ level: 0 });
```

或简单使用 `FORCE_COLOR=0` 统一关色。

### 3. Windows 终端建议

在 Windows 下推荐使用 **Windows Terminal** 或 **VS Code 集成终端**，对 256 色和 Truecolor 支持更好；老版 cmd 可能仅基础色。

### 4. 性能与依赖

Chalk 无额外依赖，链式调用在运行时才拼接字符串，一般无需为性能单独优化；若在热路径中需要极简着色，可了解 [yoctocolors](https://github.com/sindresorhus/yoctocolors) 等轻量替代。

### 5. 与 Commander / 脚本结合

```javascript
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

program
  .command('build')
  .action(() => {
    console.log(chalk.blue('Building...'));
    // 模拟构建
    console.log(chalk.green('✔ Build done'));
  });

program.parse();
```

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 红色 | `chalk.red('文字')` |
| 加粗 | `chalk.bold('文字')` |
| 红字加粗 | `chalk.red.bold('文字')` |
| 白字红底 | `chalk.white.bgRed('文字')` |
| 自定义色 | `chalk.hex('#FF0000')('文字')`、`chalk.rgb(255,0,0)('文字')` |
| 主题 | `const err = chalk.bold.red; err('Error')` |
| 嵌套 | `chalk.red('A' + chalk.blue('B') + 'A')` |
| 模板 | `` chalk.green(`Hello ${name}`) `` |

---

## 参考与延伸

- [Chalk GitHub](https://github.com/chalk/chalk)
- [chalk-template](https://github.com/chalk/chalk-template) - 标签模板字符串
- [strip-ansi](https://github.com/chalk/strip-ansi) - 去除 ANSI 转义码
- [supports-color](https://github.com/chalk/supports-color) - 检测终端颜色能力
