/**
 * qs 示例：parse 与 stringify
 *
 * 运行：node src/78_qs/1.base.js
 *
 * 依赖：pnpm add qs
 */

import qs from 'qs';

// parse
const parsed = qs.parse('foo[bar]=baz&a[]=1&a[]=2');
console.log('--- parse ---');
console.log(parsed);

// stringify
const str = qs.stringify({ name: 'tom', tags: ['a', 'b'] }, { arrayFormat: 'brackets' });
console.log('\n--- stringify ---');
console.log(str);
