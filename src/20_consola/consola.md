# Consola 从零开始学习指南

## 📚 目录
1. [什么是 Consola](#什么是-consola)
2. [安装与引入](#安装与引入)
3. [基础用法](#基础用法)
4. [示例与组合](#示例与组合)
5. [高级特性](#高级特性)
6. [最佳实践](#最佳实践)

---

## 什么是 Consola

Consola 是 Node.js / 浏览器里用的**统一日志库**，提供 `log`、`info`、`success`、`warn`、`error`、`debug` 等方法和可插拔的 reporter，适合在 CLI、构建工具、Nuxt 等里替代或封装 `console.*`，做带图标、级别、包名的输出。

### 为什么选择 Consola？
- ✅ 一套 API 在 Node 与浏览器里都能用
- ✅ 内置多种级别与图标（info/success/warn/error/debug）
- ✅ 可换 reporter（终端、JSON、静默等），便于 CI/测试时关掉或改格式
- ✅ 支持命名空间（如 `consola.withTag('my-pkg')`），方便区分来源

### 典型场景
- CLI/构建工具里统一用 consola 替代 console，输出带图标和级别
- 在测试或 CI 里切到“静默”或“仅 error”的 reporter
- 与 Nuxt、Vite 插件等结合，这些生态里常用 consola

---

## 安装与引入

### 1. 安装依赖

```bash
pnpm add consola
# 或 npm install consola
```

### 2. ESM 引入

```javascript
import { consola } from 'consola';
```

---

## 基础用法

### 1. 各级别输出

```javascript
import { consola } from 'consola';

consola.log('普通日志');
consola.info('信息');
consola.success('成功');
consola.warn('警告');
consola.error('错误');
consola.debug('调试');
```

### 2. 多参数与格式化

```javascript
consola.log('count:', 1, { a: 1 });
consola.info('User %s, id %d', 'tom', 1);
```

### 3. 带 tag 的实例

```javascript
const log = consola.withTag('my-cli');
log.info('来自 my-cli 的信息');
log.error('错误');
```

### 4. 静默与恢复

```javascript
consola.wrapAll();  // 可先备份全局 console
consola.pauseLogs(); // 暂停输出
consola.resumeLogs(); // 恢复
consola.restoreAll();
```

---

## 示例与组合

### 1. 在 CLI 里统一用 consola

```javascript
import { consola } from 'consola';
import { Command } from 'commander';

const program = new Command();
program.command('build').action(() => {
  consola.info('开始构建...');
  // do build
  consola.success('构建完成');
});
program.parse();
```

### 2. 在 CI 里静默或仅 error

```javascript
if (process.env.CI) {
  consola.setReporters([/* 自定义或静默 reporter */]);
}
// 或根据 CI 只输出 error 以上级别
```

### 3. 自定义 Reporter

Consola 支持传入自定义 reporter，控制“每条日志写到哪里、什么格式”；详见官方文档。

### 4. 与 Chalk 结合

consola 本身可带颜色；若需更细控制，可在消息字符串里用 chalk，再传给 consola：

```javascript
import chalk from 'chalk';
consola.info(chalk.blue('提示'));
```

---

## 高级特性

### 1. 常用 API

| API | 说明 |
|-----|------|
| `consola.log/info/success/warn/error/debug` | 各级别输出 |
| `consola.withTag(tag)` | 带 tag 的子实例 |
| `consola.pauseLogs()` / `resumeLogs()` | 暂停/恢复输出 |
| `consola.setReporters(reporters)` | 设置 reporter 列表 |
| `consola.wrapConsole()` / `restoreConsole()` | 替换/恢复全局 console |

### 2. Reporter

默认在 TTY 下会带图标和颜色；可换成 `ConsolaReporter` 的静默/JSON 等变体，或自己实现 `log(logObj)` 接口。

### 3. 日志对象

内部每条日志会变成对象（level、tag、args 等），reporter 据此渲染；自定义 reporter 时可使用这些字段。

---

## 最佳实践

- 在 CLI/工具里统一用 consola，便于后续切换 reporter、做静默或 CI 友好输出。
- 用 `withTag` 区分“构建 / 插件 / 业务”等来源，排查时更好过滤。
- 在测试或 CI 里可 `pauseLogs` 或换静默 reporter，避免日志刷屏。

---

## 速查表

| 需求 | 写法示例 |
|------|----------|
| 各级别 | `consola.log/info/success/warn/error/debug(msg)` |
| 带 tag | `consola.withTag('pkg').info(msg)` |
| 暂停/恢复 | `consola.pauseLogs()` / `consola.resumeLogs()` |
| 多参数 | `consola.log('a', 1, {})` |

---

## 参考与延伸

- [Consola GitHub](https://github.com/unjs/consola)
- [Chalk](https://github.com/chalk/chalk) - 终端颜色
- [debug](https://www.npmjs.com/package/debug) - 按命名空间开关的调试日志
