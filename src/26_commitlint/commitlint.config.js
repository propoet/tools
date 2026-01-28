/**
 * Commitlint 配置示例
 * 
 * 用法：
 * 1. 复制到项目根目录
 * 2. 安装依赖: pnpm add -D @commitlint/cli @commitlint/config-conventional
 * 3. 集成到 Git hooks（推荐用 Husky）: 见 commitlint.md 文档
 * 
 * 规则说明：
 * - extends: 继承 @commitlint/config-conventional 的预设规则
 * - rules: 自定义规则，会覆盖 extends 中的规则
 * - ignores: 忽略某些提交（如合并、回滚等）
 */

export default {
  // 继承 Conventional Commits 预设配置
  extends: ['@commitlint/config-conventional'],

  // 自定义规则（可选，会覆盖 extends 中的规则）
  rules: {
    // type 必须在以下列表中
    'type-enum': [2, 'always', [
      'feat',     // 新功能
      'fix',      // 修复 bug
      'docs',     // 文档
      'style',    // 代码格式（不影响功能）
      'refactor', // 重构
      'perf',     // 性能优化
      'test',     // 测试
      'chore',    // 构建/工具
      'revert',   // 回滚
      'build',    // 构建系统
      'ci',       // CI 配置
    ]],

    // type 必须小写
    'type-case': [2, 'always', 'lower-case'],

    // type 不能为空
    'type-empty': [2, 'never'],

    // subject 不能为空
    'subject-empty': [2, 'never'],

    // subject 不能以句号结尾
    'subject-full-stop': [2, 'never', '.'],

    // header 总长度不超过 100 字符
    'header-max-length': [2, 'always', 100],

    // body 和 footer 前必须有空行（警告级别）
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],

    // body 和 footer 每行不超过 100 字符
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  },

  // 忽略某些提交（如合并、回滚、版本号等）
  ignores: [
    (commit) => commit.includes('Merge'),
    (commit) => commit.includes('Revert'),
    (commit) => /^v\d+\.\d+\.\d+/.test(commit), // 版本号提交，如 v1.2.3
  ],

  // 是否使用默认忽略规则
  defaultIgnores: true,

  // 失败时显示的帮助链接（可选）
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
