# child_process 通俗讲解

> 用大白话和比喻讲清楚：Node 里的「子进程」是什么、为什么要有、怎么用。

---

## 一、先搞懂「子进程」是啥

### 1. 一个比喻

你的 Node 程序就像一个**办公室**，里面只有**一个人**（主线程）在干活。  
这个人不能亲自去跑 `git`、`npm`、`ls` 这些程序，因为那些是**别人家的事**——在电脑里是另一些**独立的程序**。

那怎么办？他就要**打电话叫别人来干活**：  
在电脑里，就是让系统**再启动一个进程**，去执行「别人家的程序」。  
这个**被你的 Node 程序启动的、干具体活的那个进程**，就叫**子进程（child process）**。  
你的 Node 程序叫**父进程（parent process）**。

所以：  
**子进程 = 你的 Node 程序「请来的外援」，专门跑某一条命令或另一个程序。**

### 2. 为啥 Node 非要「请外援」？

- Node 是**单线程**的，主线程只跑你的 JavaScript。
- `git`、`npm`、`ls` 这些是**别的可执行文件**，不能在你的 JS 里「直接跑」。
- 要执行它们，**唯一办法**就是让操作系统再起一个**新进程**，由 Node 去**创建并管理**它。

**child_process** 就是 Node 自带的、用来「创建并管理子进程」的模块。  
不用装任何包，`import { ... } from 'node:child_process'` 就行。

---

## 二、两大家族：exec 和 spawn

child_process 里常用的有四个 API，可以看成**两对**：

| 一对 | 另一对 |
|------|--------|
| **exec** / **execSync** | **spawn** / **spawnSync** |

- 带 **Sync** 的 = **同步**：命令没跑完，代码就卡在那儿等，跑完再往下执行。
- 不带 Sync 的 = **异步**：发起命令后立刻往下走，结果通过**回调**或 **Promise** 给你。

区别重点在 **exec 和 spawn**：

- **exec**：你传的是**一整句命令字符串**（比如 `"node --version"`），Node 会交给**系统自带的 shell**（如 cmd、bash）去「翻译」并执行。  
  - 好处：能写 `&&`、`|`、环境变量等 shell 语法。  
  - 坏处：容易有**命令注入**风险，一般不建议把用户输入拼进这条字符串里。
- **spawn**：你传的是**「命令 + 参数数组」**（比如 `'node'` 和 `['--version']`），**默认不经过 shell**，由 Node 直接去启动那个程序。  
  - 好处：参数和命令分开，更安全、更可控。  
  - 坏处：不能直接用 `|`、`&&` 这种 shell 语法（除非你主动开 `shell: true`）。

**一句话记：**  
- 想**简单、用 shell 语法** → 用 **exec**（但要小心别把用户输入拼进字符串）。  
- 想**安全、可控、参数化** → 用 **spawn**（大多数脚本、工具推荐）。

---

## 原理：子进程如何被创建与通信

Node 的 child_process 核心是：**通过操作系统 API 创建新进程、把命令与参数传给它、用管道（stdin/stdout/stderr）与父进程通信**。

1. **创建进程**：`spawn` 调用系统 API（如 Unix 的 `fork`+`exec`、Windows 的 `CreateProcess`），在新进程中加载目标可执行文件（如 `git`、`node`），并传入参数数组。
2. **默认不经过 shell**：`spawn` 不传 `shell: true` 时，直接执行目标程序，参数由 Node 以数组形式传递，避免被 shell 解析，降低注入风险；`exec` 则把整句字符串交给 shell 解释。
3. **管道通信**：子进程的 stdin/stdout/stderr 与父进程之间通过管道（pipe）连接；父进程可往 stdin 写、从 stdout/stderr 读，或设为 `inherit` 与当前终端共享。
4. **异步与同步**：异步版本在子进程启动后立即返回，通过事件（`data`、`close`）或 Promise 拿到结果；Sync 版本在子进程结束前阻塞当前线程。

---

## 三、四个 API 各干什么、怎么用

### 1. exec —— 异步 + 整句命令 + 经 shell

- **干啥**：给你一句完整命令，比如 `"node --version"`，Node 交给 shell 去执行，**不卡住**后面的代码，结果通过**回调**给你。
- **咋用**：`exec(命令字符串, 选项, 回调(err, stdout, stderr))`。
- **适合**：你就是要用 `&&`、`|`、变量替换，且能保证命令字符串是「自己写的」或严格校验过的。

```javascript
import { exec } from 'node:child_process';
exec('node --version', (err, stdout, stderr) => {
  if (err) return console.error(err);
  console.log('版本:', stdout.trim());
});
```

### 2. execSync —— 同步 + 整句命令 + 经 shell

- **干啥**：和 exec 一样是「整句命令 + shell」，但是**同步**的：命令没跑完，下面代码不会执行，跑完直接把 stdout 当返回值给你（或抛错）。
- **咋用**：`execSync(命令字符串, 选项)`，常见选项里加 `encoding: 'utf-8'` 方便拿到字符串。
- **适合**：脚本里**简单跑一条命令**、不需要异步，比如构建前检查环境。

```javascript
import { execSync } from 'node:child_process';
const out = execSync('node --version', { encoding: 'utf-8' });
console.log('版本:', out.trim());
```

### 3. spawn —— 异步 + 命令+参数数组 + 默认不经 shell

- **干啥**：你告诉它「运行谁」「传哪些参数」，**不卡住**后面的代码，结果通过**流（stream）**一点点给你，你要自己监听 `stdout.on('data')`、`close` 等。
- **咋用**：`spawn(命令, 参数数组, 选项)`，返回一个**子进程对象**，从上面读 stdout、stderr、退出码。
- **适合**：输出很多、要**边跑边处理**，或要**管道**、要**安全传参**的场景。

```javascript
import { spawn } from 'node:child_process';
const child = spawn('node', ['--version']);
let data = '';
child.stdout.on('data', (chunk) => (data += chunk));
child.on('close', (code) => console.log('输出:', data.trim(), '退出码:', code));
```

### 4. spawnSync —— 同步 + 命令+参数数组 + 默认不经 shell

- **干啥**：和 spawn 一样是「命令+参数数组、默认不经 shell」，但是**同步**：卡住等到跑完，然后把 stdout、stderr、退出码包在一个对象里一次性给你。
- **咋用**：`spawnSync(命令, 参数数组, 选项)`，返回值里有 `stdout`、`stderr`、`status`（退出码）等。
- **适合**：脚本里**跑一条外部命令、马上要结果**，又希望**参数化、安全**，这是最常用、也最推荐的一种「单次调用」方式。

```javascript
import { spawnSync } from 'node:child_process';
const result = spawnSync('node', ['--version'], { encoding: 'utf-8' });
console.log('stdout:', result.stdout.trim());
console.log('退出码:', result.status);
```

---

## 四、常用选项（通俗版）

调用 exec / spawn 时，第二个（或第三个）参数可以传一个**选项对象**，常见的有这些：

| 选项 | 通俗理解 | 示例 |
|------|----------|------|
| **encoding** | 输出当啥给你：不设可能是 Buffer，设成 `'utf-8'` 就是字符串 | `{ encoding: 'utf-8' }` |
| **cwd** | 子进程在「哪个目录」里干活 | `{ cwd: './src' }` |
| **env** | 子进程能看到的环境变量（不设就继承父进程的） | `{ env: { NODE_ENV: 'production' } }` |
| **shell** | 是否请 shell 来帮你「翻译」这条命令；spawn 默认是 false，exec 默认是 true | `{ shell: true }` |
| **stdio** | 子进程的 stdin/stdout/stderr 怎么接：默认是 pipe（Node 帮你接着），也可以 `'inherit'`（直接打到当前终端） | `{ stdio: 'inherit' }` |

**一句话：**  
- 想直接拿**字符串** → 设 `encoding: 'utf-8'`。  
- 想**在别的目录**跑命令 → 设 `cwd`。  
- 想**实时看到**子进程打印的东西 → 设 `stdio: 'inherit'`。

---

## 五、和 shell、安全的关系（通俗版）

### 1. 啥叫「经 shell」、啥叫「不经 shell」？

- **经 shell**：你要跑的那句话，先交给**系统自带的 shell**（Windows 上常见是 cmd，Mac/Linux 是 bash 等）去「翻译」，再执行。  
  - 所以你可以写 `node --version && echo ok`、`ls | grep js` 这种** shell 语法**。
- **不经 shell**：Node 直接让操作系统「启动这个程序、传这些参数」，不经过 shell。  
  - 所以**没有** `|`、`&&`、`$VAR` 这些语法，但**更安全**：参数是数组，不会因为用户输入里带 `;`、`|` 就被当成新命令。

### 2. 为啥「整句字符串」容易出事？

如果你把**用户输入**拼进命令字符串，比如：

```javascript
exec(`git log ${userInput}`);  // 危险！
```

用户只要输入类似 `; rm -rf /` 或 `| 恶意命令`，就会被 shell 当成**新命令**执行，这就是**命令注入**。

**更安全的做法**：用 **spawn**，把「命令」和「参数」分开，参数用数组传，不让用户输入变成「一整句命令」的一部分。

```javascript
spawnSync('git', ['log', userInput]);  // 相对安全：userInput 只是其中一个参数
```

---

## 六、怎么选？一张表搞定

| 需求 | 推荐用法 |
|------|----------|
| 就跑一条简单命令，要结果，不关心是否经 shell | **spawnSync(命令, [参数], { encoding: 'utf-8' })** |
| 要用 `&&`、`|`、环境变量等 shell 语法，且命令字符串可信 | **exec** / **execSync** |
| 要边跑边看输出、或做管道、流式处理 | **spawn**，自己监听 stdout/stderr |
| 要子进程的打印直接出现在当前终端 | 任意 API + **stdio: 'inherit'** |

---

## 七、和本目录示例的对应关系

本目录下的 `child-process-example.js` 用的是 **spawnSync**：  
执行 `node --version`，用「命令 + 参数数组」，同步拿结果。  
这是最常用、也最容易懂的一种用法，适合作为「第一笔」子进程代码。

后面学 **Execa** 时，可以理解为：  
Execa 在「spawn + 不经过 shell」这一套之上，帮你包好了 Promise、模板字符串、管道等，写起来更省事，底层仍然是 child_process 的能力。

---

## 八、小结（背这几句就够）

1. **子进程** = Node 程序请来的「外援进程」，专门跑某一条命令或别的程序；**child_process** 是 Node 自带的、用来创建和管理子进程的模块。
2. **exec** = 传一整句命令给 shell，**spawn** = 传「命令+参数数组」，默认不经 shell，更安全。
3. **Sync** = 同步，卡住等结果；不带 Sync = 异步，用回调或流拿结果。
4. 平常脚本里「跑一条命令、马上要结果」：优先用 **spawnSync(命令, [参数], { encoding: 'utf-8' })**。
5. 别把用户输入拼进 **exec** 的整句字符串里，否则有命令注入风险；用 **spawn + 参数数组** 更稳。
