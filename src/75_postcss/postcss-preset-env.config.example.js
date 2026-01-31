/**
 * postcss-preset-env 示例配置
 *
 * 使用：复制为项目根目录 postcss.config.js，或合并进现有配置
 */
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-preset-env')({
      stage: 2,
      features: {
        'nesting-rules': true,
      },
    }),
    require('autoprefixer'),
  ],
};
