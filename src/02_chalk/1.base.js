import chalk from "chalk";

// 颜色
console.log(chalk.red('红色文字'));
console.log(chalk.redBright('亮红色'));
console.log(chalk.green('绿色文字'));
console.log(chalk.blue('蓝色文字'));
console.log(chalk.yellow('黄色文字'));
console.log(chalk.magenta('品红'));
console.log(chalk.cyan('青色'));
console.log(chalk.gray('灰色'));
console.log(chalk.redBright('亮红色'));
console.log(chalk.bgRed('红底'));
console.log(chalk.bgGreen('绿底'));
console.log(chalk.bgBlue('蓝底'));
console.log(chalk.bgYellow('黄底'));

// 文本样式
console.log(chalk.bold('加粗'));
console.log(chalk.dim('变暗'));
console.log(chalk.italic('斜体'));
console.log(chalk.underline('下划线'));
console.log(chalk.strikethrough('删除线'));
console.log(chalk.inverse('反色'));
console.log(chalk.hidden('隐藏'));
console.log(chalk.reset('重置'));

// 链式调用
console.log(chalk.blue.bold('蓝字加粗'));
console.log(chalk.red.underline('红字下划线'));

// 组合普通字符串与样式字符串
console.log(chalk.blue.bold('Hello') + ' World' + chalk.red('!'));

// 嵌套样式
console.log(chalk.red('这是红色，' + chalk.blue('这是蓝色') + '，又回到红色。'));


// 模板字符串
const cpu = 90;
const ram = 40;
const disk = 70;
console.log(`CPU: ${chalk.red(cpu + '%')}
RAM: ${chalk.green(ram + '%')}
DISK: ${chalk.yellow(disk + '%')}
`);
// 自定义主题
const error = chalk.bold.red;
const warning = chalk.hex('#FFA500');  // 橙色
const success = chalk.bold.green;
const info = chalk.blue;

console.log(error('Error!'));
console.log(warning('Warning!'));
console.log(success('Done.'));
console.log(info('Info: something.'));

// 与 console 占位符一起用
const name = '张三';
console.log(chalk.green('Hello %s'), name);
// 输出: Hello 张三（其中 "Hello " 为绿色，取决于环境对 %s 与样式组合的处理）

// CLI 状态输出示例
console.log(chalk.green('✔ 构建成功'));
console.log(chalk.yellow('⚠ 存在警告'));
console.log(chalk.red('✖ 构建失败'));
console.log(chalk.blue('ℹ 提示信息'));