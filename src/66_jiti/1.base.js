/**
 * jiti 基础示例：createJiti + jiti.import() 加载模块
 *
 * 运行：node src/66_jiti/1.base.js
 * 会加载同目录下的 fixture.js，演示 jiti.import API
 * 需先：pnpm add -D jiti
 */

import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { debug: false });

// 用 jiti 加载相对路径模块（支持 .ts、.mjs、.js 等）
const mod = await jiti.import("./fixture.js");
console.log("jiti.import('./fixture.js') 结果:", mod);
