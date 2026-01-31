/**
 * postcss-scss 示例：用 PostCSS 解析 SCSS 并跑简单插件
 *
 * 运行：node src/75_postcss/postcss-scss.example.js
 *
 * 依赖：pnpm add -D postcss postcss-scss
 */

import postcss from 'postcss';
import postcssScss from 'postcss-scss';

const scss = `
$color: red;
.card {
  color: $color;
  &:hover { color: darken($color, 10%); }
}
`;

// 仅解析，不编译：postcss-scss 只做语法解析，不会展开 $color / darken
const root = postcssScss.parse(scss);
let declCount = 0;
root.walkDecls(() => { declCount++; });
console.log('--- 解析到的声明数量（含嵌套内）---');
console.log(declCount);

// 跑一个「不改 SCSS 语法」的插件：只打 log
const noop = () => (root) => {
  root.walkRules((rule) => {
    console.log('规则选择器:', rule.selector);
  });
};

const result = await postcss([noop]).process(scss, {
  syntax: postcssScss,
  from: undefined,
});
console.log('\n--- 输出（仍为 SCSS，未编译）---');
console.log(result.css);
