/**
 * html-minifier-terser 基础示例：minify(html, options)
 *
 * 运行：node src/64_html_minifier_terser/1.base.js
 * 需先：pnpm add -D html-minifier-terser
 */

import { minify } from "html-minifier-terser";

const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>示例</title>
  <style type="text/css">
    .box { margin: 10px 20px; padding: 0; }
  </style>
</head>
<body>
  <!-- 这是注释 -->
  <p title="提示" id="main">   hello   </p>
  <script type="text/javascript">
    const x = 1;
    console.log( x );
  </script>
</body>
</html>
`;

const result = await minify(html, {
  collapseWhitespace: true,
  removeComments: true,
  removeAttributeQuotes: true,
  removeStyleLinkTypeAttributes: true,
  removeScriptTypeAttributes: true,
  useShortDoctype: true,
  minifyJS: true,
  minifyCSS: true,
});

console.log("原始长度:", html.length);
console.log("压缩后长度:", result.length);
console.log("--- 压缩结果（前 400 字符）---");
console.log(result.slice(0, 400));
