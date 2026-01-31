/**
 * publint 示例：用 JavaScript API 检查当前包目录
 *
 * 运行：node src/76_publint/1.base.js
 * 建议在项目根目录执行（或传 pkgDir 指向含 package.json 的目录）
 *
 * 依赖：pnpm add -D publint
 */

import { publint } from 'publint';
import { formatMessage } from 'publint/utils';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..'); // 项目根目录，含 package.json

(async () => {
  const { messages, pkg } = await publint({
    pkgDir: rootDir,
    level: 'suggestion',
    pack: false, // 不执行 pack，仅用目录内文件检查；要模拟发布可改为 'auto'
    strict: false,
  });

  console.log('--- publint 检查结果 ---');
  console.log('包名:', pkg?.name ?? '(未解析到 package.json)');
  console.log('消息数:', messages.length);

  if (messages.length > 0) {
    console.log('\n--- 消息列表 ---');
    for (const message of messages) {
      console.log(formatMessage(message, pkg));
    }
  } else {
    console.log('\n无 suggestion/warning/error。');
  }
})();
