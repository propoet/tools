/**
 * postcss-import 示例：内联 @import
 *
 * 运行：node src/75_postcss/postcss-import.example.js
 *
 * 依赖：pnpm add -D postcss postcss-import
 */

import postcss from 'postcss';
import postcssImport from 'postcss-import';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mainCss = `
@import "./vars.css";
@import "./block.css";

.app {
  color: var(--text);
  padding: var(--space);
}
`;

(async () => {
  const result = await postcss([
    postcssImport({
      path: [__dirname],
    }),
  ]).process(mainCss, {
    from: path.join(__dirname, 'main.css'),
  });

  console.log('--- 内联后的 CSS ---');
  console.log(result.css);
})();
