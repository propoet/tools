import { Command } from "commander";

const program = new Command();

//  设置程序基本信息
// program.name("tools").description("一个简单的工具库").version("1.0.0");
// 添加命令
// program.command("create <name>")
// .description("创建一个新项目")
// .action((name) => {
//     console.log(`正在创建项目: ${name}`);
// });

// // 添加选项
// program.option('-d --debug', '开启调试模式').option('-s --silent', '静默模式');

// // 解析命令行参数
// program.parse(process.argv);

// const options = program.opts();
// if(options.debug) {
//     console.log('调试模式已开启');
// }
// if(options.silent) {
//     console.log('静默模式已开启');
// }

// program
//   .option('-p, --port <number>', '指定端口号', '3000')
//   .option('-o, --output <file>', '输出文件路径');

// program.parse();

// const options = program.opts();
// console.log(`端口: ${options.port}`);
// console.log(`输出文件: ${options.output}`);

// 必填
// program
//   .requiredOption('-t, --token <token>', 'API Token（必填）');

// program.parse();

// program
//   .option('-p, --port <number>', '端口号', (value) => {
//     const port = parseInt(value, 10);
//     if (isNaN(port) || port < 1 || port > 65535) {
//       throw new Error('端口号必须是 1-65535 之间的数字');
//     }
//     return port;
//   }, 3000);
//   program.parse();

// program
//   .command('clone <url> [destination]')
//   .description('克隆仓库')
//   .action((url, destination) => {
//     console.log(`从 ${url} 克隆到 ${destination || './'}`);
//   });
//   program.parse();


program
  .command('build')
  .description('构建项目')
  .option('-e, --env <environment>', '环境变量', 'development')
  .option('-w, --watch', '监听模式')
  .option('-o, --output <dir>', '输出目录', 'dist')
  .action((options) => {
    console.log(`环境: ${options.env}`);
    console.log(`监听: ${options.watch ? '是' : '否'}`);
    console.log(`输出: ${options.output}`);
  });
  program.parse();