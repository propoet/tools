/**
 * postcss-html 示例：对 HTML 字符串中的 <style> 做 PostCSS 处理
 *
 * 运行：node src/75_postcss/postcss-html.example.js
 *
 * 依赖：pnpm add -D postcss postcss-html
 */

import postcss from 'postcss';
import postcssHtml from 'postcss-html';

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .box { display: flex; color: red; }
  </style>
</head>
<body></body>
</html>
`;

(async () => {
  const result = await postcss([]).process(html, {
    from: undefined,
    syntax: postcssHtml,
  });
  console.log('--- 处理后的 HTML（此处未改内容）---');
  console.log(result.content || result.css);
})();
