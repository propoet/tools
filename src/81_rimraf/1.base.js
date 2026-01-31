/**
 * rimraf 示例：异步删除目录（演示用，删除前会先创建临时目录）
 *
 * 运行：node src/81_rimraf/1.base.js
 *
 * 依赖：pnpm add -D rimraf
 */

import { rimraf, rimrafSync } from 'rimraf';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = path.join(__dirname, '.tmp-demo');

(async () => {
  // 先创建临时目录，再删除（仅演示）
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'demo');

  console.log('--- 异步删除 ---');
  await rimraf(tmpDir);
  console.log('已删除:', tmpDir);
  console.log('存在?', fs.existsSync(tmpDir));

  // 同步删除示例（再建再删）
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log('\n--- 同步删除 ---');
  rimrafSync(tmpDir);
  console.log('已删除:', tmpDir);
  console.log('存在?', fs.existsSync(tmpDir));
})();
