// 高级特性
import { Command } from "commander";

const program = new Command();

// 自定义帮助信息
program.configureHelp({
  // 帮助信息宽度
  helpWidth: 100,
  // 排序子命令
  sortSubcommands: true,
  // 排序选项
  sortOptions: true
}).addHelpText('after', `
示例:
  $ my-cli create app --template react
  $ my-cli build --watch
  $ my-cli deploy --env production
`);
//错误处理
// program
//   .command('dangerous')
//   .action(() => {
//     throw new Error('操作失败');
//   });

// program.exitOverride();
// try {
//   program.parse();
// } catch (err) {
//   console.error('❌ 发生错误:', err.message);
//   process.exit(1);
// }

// 钩子函数
program.command('build')
  .description('构建项目')
  .action(() => {
    console.log('构建项目');
  });
program
  .hook('preAction', (command, action) => {
    console.log('执行命令前的钩子');
  })
  .hook('postAction', (command, action) => {
    console.log('执行命令后的钩子');
  });

  program
  .command('remove <name>')
  .alias('rm')
  .description('删除项目')
  .action((name) => {
    console.log(`删除 ${name}`);
  });
program.parse();