/**
 * resolve.exports 示例：根据 exports 解析入口路径
 *
 * 运行：node src/80_resolve_exports/1.base.js
 *
 * 依赖：pnpm add resolve.exports
 */

import { resolveExports } from 'resolve.exports';

const pkg = {
  name: 'example-pkg',
  exports: {
    '.': {
      import: './dist/esm/index.mjs',
      require: './dist/cjs/index.cjs',
      default: './dist/cjs/index.cjs',
    },
    './utils': './dist/esm/utils.mjs',
  },
};

console.log('--- resolveExports(pkg) [import] ---');
console.log(resolveExports(pkg));

console.log('\n--- resolveExports(pkg, ".", { require: true }) ---');
console.log(resolveExports(pkg, '.', { require: true }));

console.log('\n--- resolveExports(pkg, "./utils") ---');
console.log(resolveExports(pkg, './utils'));
