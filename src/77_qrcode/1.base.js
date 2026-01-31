/**
 * qrcode 示例：生成 DataURL 与终端字符
 *
 * 运行：node src/77_qrcode/1.base.js
 *
 * 依赖：pnpm add qrcode
 */

import QRCode from 'qrcode';

const text = 'https://example.com';

(async () => {
  // DataURL，可用于 <img src> 或保存
  const dataUrl = await QRCode.toDataURL(text, { width: 200, margin: 2 });
  console.log('--- DataURL 前 80 字符 ---');
  console.log(dataUrl.slice(0, 80) + '...');

  // 终端 UTF-8 输出
  const terminalStr = await QRCode.toString(text, { type: 'terminal', small: true });
  console.log('\n--- 终端二维码 ---');
  console.log(terminalStr);
})();
