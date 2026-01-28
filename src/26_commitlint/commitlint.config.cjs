/**
 * Commitlint 配置示例（CommonJS 格式）
 * 
 * 若项目使用 CommonJS（package.json 无 "type": "module"），使用此文件
 * 用法：复制到项目根目录并改名为 commitlint.config.js
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [2, 'always', [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'chore',
      'revert',
      'build',
      'ci',
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },

  ignores: [
    (commit) => commit.includes('Merge'),
    (commit) => commit.includes('Revert'),
    (commit) => /^v\d+\.\d+\.\d+/.test(commit),
  ],

  defaultIgnores: true,
};
