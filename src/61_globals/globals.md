# globals 学习文档

> 各 JavaScript 运行环境的全局标识符列表（JSON 数据），供 ESLint 等静态分析工具识别「预定义全局变量」；支持 browser、node、jest、mocha 等

## 📚 目录

1. [用大白话说：globals 是啥](#用大白话说globals-是啥)
2. [原理：true/false 的含义](#原理truefalse-的含义)
3. [安装与使用方式](#安装与使用方式)
4. [环境一览](#环境一览)
5. [Node 相关：node 与 nodeBuiltin](#node-相关node-与-nodebuiltin)
6. [与 ESLint 的配合](#与-eslint-的配合)
7. [常见场景与示例](#常见场景与示例)
8. [参考与延伸阅读](#参考与延伸阅读)

---

## 用大白话说：globals 是啥

### 你遇到的问题（静态分析/ESLint 时）

- **未定义变量报错**：代码里用了 `window`、`process`、`require`、`describe`、`it` 等，这些是运行环境提供的全局，但 linter 不知道，会报「未定义」。
- **环境不一致**：浏览器有 `document`、Node 有 `__dirname`、测试有 `expect`，要按运行环境告诉工具「哪些算已定义」。
- **不想手写一大串**：每个环境几十上百个全局，手写易漏、难维护。

也就是说：**给「浏览器 / Node / 测试框架 / 其它环境」一份「预定义全局变量列表」，让 ESLint 等工具不把它们当未定义**，就是 globals 要解决的问题。

### globals 帮你做啥

**globals**（Sindre Sorhus 维护）是一个 **「各 JavaScript 环境的全局标识符」** 数据包：

1. **本质是 JSON**：就是一个 `globals.json`，键是**环境名**（如 `browser`、`node`、`jest`），值是该环境下「全局名 → true/false」的对象；可在任何环境里用（Node、浏览器、构建时）。
2. **多环境**：内置 **browser**、**node**、**nodeBuiltin**、**commonjs**、**builtin**（ES 标准全局）、**es2015**～**es2024**、**jest**、**mocha**、**jasmine**、**webextensions**、**worker**、**serviceworker**、**shelljs**、**greasemonkey** 等几十种环境。
3. **true/false**：每个全局对应 `true`（可覆盖）或 `false`（只读），供静态分析工具判断「赋值给只读全局」等错误。
4. **ESLint 使用**：ESLint 8 及更早版本内部依赖它；ESLint 9+ 需要在你的配置里**直接依赖 globals**，并在 `languageOptions.globals` 里引用。

一句话：**globals = 各运行环境的「预定义全局变量清单」**，给 ESLint 等工具用，避免把 `window`、`process`、`describe` 等报成未定义。

---

## 原理：true/false 的含义

- **false**：该全局应视为**只读**；若静态分析发现你对它赋值，可报错或警告。绝大多数内置全局为 `false`。
- **true**：该全局**允许被覆盖**；例如 `window.location`、`onclick` 等可写属性为 `true`。

默认策略：**未特别说明的都标为 false（只读）**；若有环境里某全局确实可写，再标为 true。工具可根据 true/false 做「只读全局被赋值」等规则。

---

## 安装与使用方式

### 安装

```bash
pnpm add globals
# 或
npm i globals
```

### 使用

```js
import globals from 'globals';

// 浏览器全局（document、window、fetch 等）
console.log(globals.browser);

// Node 全局（含 CommonJS：require、module、exports、__dirname 等）
console.log(globals.node);

// 仅 Node 内置（process、Buffer 等，不含 require/module/exports）
console.log(globals.nodeBuiltin);

// 测试框架
console.log(globals.jest);   // describe、it、expect、jest
console.log(globals.mocha);  // describe、it、before、after
console.log(globals.jasmine);
```

每个环境的值是一个对象：`{ 全局名: true|false, ... }`。

---

## 环境一览

| 环境名 | 说明 |
|--------|------|
| **browser** | 浏览器全局（window、document、fetch、HTMLElement 等） |
| **node** | Node 全局 = nodeBuiltin + CommonJS（require、module、exports、__dirname、__filename） |
| **nodeBuiltin** | 仅 Node 内置（process、Buffer、global、console 等），不含 CommonJS 模块作用域 |
| **commonjs** | CommonJS 模块作用域（exports、module、require） |
| **builtin** | ES 标准全局（Array、Object、Promise、globalThis 等） |
| **es5** / **es2015**～**es2024** | 各 ES 版本对应的标准全局 |
| **jest** | Jest（describe、it、expect、jest、test 等） |
| **mocha** | Mocha（describe、it、before、after、context 等） |
| **jasmine** | Jasmine |
| **qunit** | QUnit |
| **worker** | Web Worker 全局（self、postMessage、importScripts 等） |
| **serviceworker** | Service Worker 全局 |
| **webextensions** | 浏览器扩展（browser、chrome、opr） |
| **devtools** | 开发者工具控制台（$、$$、copy、debug 等） |
| **shelljs** | ShellJS（cd、ls、exec 等） |
| **greasemonkey** | Greasemonkey（GM_*、unsafeWindow 等） |
| **amd** | AMD（define、require） |
| **jquery** | jQuery（$、jQuery） |
| **meteor**、**prototypejs**、**yui**、**couch**、**mongo**、**nashorn**、**rhino**、**wsh**、**phantomjs**、**embertest**、**protractor**、**atomtest**、**applescript** 等 | 其它运行环境或框架 |

具体列表以 [globals 仓库 globals.json](https://github.com/sindresorhus/globals/blob/main/globals.json) 为准。

---

## Node 相关：node 与 nodeBuiltin

- **globals.nodeBuiltin**：所有 Node 代码都能访问的全局（通常在 `globalThis` 上），如 `process`、`Buffer`、`console`、`setTimeout`、`fetch` 等；**不包含** CommonJS 的 `require`、`module`、`exports`。
- **globals.node**：**nodeBuiltin + CommonJS 模块作用域**（`require`、`module`、`exports`、`__dirname`、`__filename`、`global`）。

**使用建议**：

- 分析**普通 Node 脚本/CommonJS**：用 **globals.node**。
- 分析**纯 ESM 或已知不在 CommonJS 包装里运行的代码**：用 **globals.nodeBuiltin**，可发现误用 `require`、`__dirname` 等（在 ESM 里应用 `import`、`import.meta.url` 等）。

---

## 与 ESLint 的配合

### ESLint 8 及更早

ESLint 内置或通过插件使用 globals；配置里通常写 `env: { node: true, browser: true }` 等，由 ESLint 自己解析成对应的 globals。

### ESLint 9+

ESLint 9 使用 **flat config**，需要在项目中**直接安装 globals**，并在 `languageOptions.globals` 里传入：

```js
import globals from 'globals';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,  // 若同时有浏览器代码
      },
    },
  },
];
```

若只做 Node、且含 CommonJS：

```js
languageOptions: {
  globals: globals.node,
}
```

若只做浏览器：

```js
languageOptions: {
  globals: globals.browser,
}
```

测试（Jest）：

```js
languageOptions: {
  globals: {
    ...globals.node,
    ...globals.jest,
  },
}
```

这样 ESLint 不会把 `process`、`window`、`describe`、`it`、`expect` 等报成未定义。详见 [ESLint - Predefined Global Variables](https://eslint.org/docs/latest/use/configure/language-options#predefined-global-variables)。

---

## 常见场景与示例

### 在工具里按环境取全局列表

```js
import globals from 'globals';

function getGlobalsForEnv(env) {
  if (env === 'browser') return globals.browser;
  if (env === 'node') return globals.node;
  if (env === 'jest') return { ...globals.node, ...globals.jest };
  return {};
}
```

### 合并多环境（如 Node + Jest）

```js
const globals = {
  ...globals.node,
  ...globals.jest,
};
```

### 自定义：在现有环境上增加几个全局

```js
languageOptions: {
  globals: {
    ...globals.node,
    myGlobal: 'readonly',  // ESLint 的 readonly/writable
    MY_CONST: 'readonly',
  },
}
```

（ESLint 的 globals 值可以是 `'readonly'` 或 `'writable'`，与 globals 包的 true/false 语义对应。）

---

## 参考与延伸阅读

- [GitHub - sindresorhus/globals](https://github.com/sindresorhus/globals)
- [npm - globals](https://www.npmjs.com/package/globals)
- [globals.json](https://github.com/sindresorhus/globals/blob/main/globals.json)（所有环境数据）
- [ESLint - Configure Language Options](https://eslint.org/docs/latest/use/configure/language-options)
- [ESLint - Predefined Global Variables](https://eslint.org/docs/latest/use/configure/language-options#predefined-global-variables)
- [Node.js Globals](https://nodejs.org/api/globals.html)
- [Node.js Module scope](https://nodejs.org/api/modules.html#modules_the_module_scope)

---

**小结**：**globals** 提供各 JavaScript 环境（browser、node、jest、mocha 等）的**预定义全局变量**列表，每项带 **true（可写）/ false（只读）**；ESLint 9+ 需在配置里直接依赖并设置 **languageOptions.globals**；Node 场景下 **node** = nodeBuiltin + CommonJS，纯 ESM 分析可用 **nodeBuiltin** 避免误用 `require` 等。
