/**
 * theme-colors 示例：从基色生成 11 档色阶
 *
 * 运行：node src/84_theme_colors/1.base.js
 *
 * 依赖：pnpm add theme-colors
 */

import { getColors } from 'theme-colors';

const base = '#3B82F6';
const colors = getColors(base);

console.log('--- getColors("#3B82F6") ---');
console.log('50:', colors[50]);
console.log('500:', colors[500]);
console.log('950:', colors[950]);
console.log('\n--- 全部色阶 ---');
console.log(colors);
