/**
 * PostCSS 基础示例：解析 CSS、简单插件、process 输出
 *
 * 运行：node src/75_postcss/1.base.js（PostCSS 核心示例）
 */

import postcss from 'postcss';

const css = `
  .card {
    display: flex;
    color: #333;
  }
  .card:hover { color: #666; }
`;

// 示例插件：把 color 的值转成大写（仅演示 AST 修改）
const upperColor = () => (root) => {
  root.walkDecls('color', (decl) => {
    decl.value = decl.value.toUpperCase();
  });
};

(async () => {
  const result = await postcss([upperColor]).process(css, { from: undefined });
  console.log('--- 处理后 CSS ---');
  console.log(result.css);

  // 仅解析，不跑插件
  const root = postcss.parse(css);
  let count = 0;
  root.walkDecls(() => { count++; });
  console.log('\n--- 声明条数 ---');
  console.log(count);
})();
