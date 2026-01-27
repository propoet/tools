
/**
 * child_process 示例（含 exec / execFile / fork 等 API）
 * 运行: node src/06_execa/child-process-example.js
 */
import { spawn, spawnSync, exec, execSync, execFileSync, fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 示例1：spawnSync —— 命令+参数数组，默认不经 shell
const result = spawnSync('node', ['--version'], { encoding: 'utf-8' });
console.log('[spawnSync] stdout:', result.stdout.trim(), '退出码:', result.status);

// 示例2：execSync —— 整句命令字符串，经 shell，可用 &&、| 等
const out = execSync('node --version', { encoding: 'utf-8' });
console.log('[execSync] 输出:', out.trim());

// 示例3：spawn（异步）—— 用流拿输出，Promise 包一层方便 await
function spawnAsync(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, opts);
    let stdout = '', stderr = '';
    if (child.stdout) { child.stdout.setEncoding('utf8'); child.stdout.on('data', (c) => (stdout += c)); }
    if (child.stderr) { child.stderr.setEncoding('utf8'); child.stderr.on('data', (c) => (stderr += c)); }
    child.on('close', (code) => (code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr || `exit ${code}`))));
  });
}
const { stdout: s3 } = await spawnAsync('node', ['--version']);
console.log('[spawn 异步] 输出:', s3.trim());

// 示例4：cwd —— 在指定目录下执行，子进程里的「当前目录」会变
const r4 = spawnSync('node', ['-e', 'console.log(process.cwd())'], { encoding: 'utf-8', cwd: 'src' });
console.log('[cwd] 子进程所在目录:', r4.stdout.trim());

// 示例5：exec —— 异步、整句命令、经 shell，结果通过回调拿到（这里包成 Promise 便于 await）
const execAsync = (cmd, opts = {}) =>
  new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf-8', ...opts }, (err, stdout, stderr) => (err ? reject(err) : resolve({ stdout, stderr })));
  });
const { stdout: s5 } = await execAsync('node --version');
console.log('[exec 异步] 输出:', s5.trim());

// 示例6：execFileSync —— 直接执行可执行文件，默认不经 shell（比 exec 更安全）
const r6 = execFileSync('node', ['--version'], { encoding: 'utf-8' });
console.log('[execFileSync] 输出:', r6.trim());

// 示例7：fork —— 专门“拉起来一个 Node 脚本”作为子进程，自带 IPC 通道，可收发消息
const child = fork(path.join(__dirname, 'fork-worker.js'));
await new Promise((resolve) => {
  child.on('message', (msg) => { console.log('[fork] 子进程回复:', msg); resolve(); });
  child.send({ ping: true });
});
