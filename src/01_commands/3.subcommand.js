
// 子命令
import { Command } from "commander";
const program = new Command();

program.name('my-git').description('Git 命令模拟器').version('1.0.0');

// git clone 
program.command('clone <url>').description('克隆仓库').option('-b, --branch <branch>', '指定分支', 'main').option('--depth <number>', '浅克隆深度').action((url, options) => {
  console.log(`正在克隆 ${url}`);
  console.log(`分支: ${options.branch}`);
  if (options.depth) {
    console.log(`深度: ${options.depth}`);
  }
});
//  git commit 
program.command('commit').description('提交更改').option('-m, --message <message>', '提交信息', 'update').option('-a, --all', '提交所有更改').action((options) => {
  console.log(`提交信息: ${options.message}`);
  console.log(`提交所有: ${options.all ? '是' : '否'}`);
});

//  git push
program.command('push').description('推送到远程').option('--force,-f', '强制推送').argument('[remote]', '远程仓库', 'origin').argument('[branch]', '分支名', 'main').action((remote, branch, options) => {
  console.log(`推送到 ${remote}/${branch}`);
  if (options.force) {
    console.log('强制推送');
  }
})

program.parse();