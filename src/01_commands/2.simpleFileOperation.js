// 简单的文件操作cli
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { createInterface } from "readline/promises";

/** Node 环境下替代浏览器 confirm，返回 Promise<boolean>（使用 readline/promises） */
async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(question + " (y/n): ");
    return /^y|yes$/i.test((answer || "").trim());
  } finally {
    rl.close();
  }
}

const program = new Command();
program
  .name('file-cli').description('文件操作工具').version('1.0.0');

// 创建文件命令
program.command('create <filename>').description('创建文件').option('-c, --content <content>', '文件内容', '')
  .action((filename, options) => {
    fs.writeFileSync(filename, options.content);
    console.log(`文件 ${filename} 创建成功`);
  })
// 读取文件命令
program.command('read <filename>').description('读取文件内容').action((filename) => {
  if (fs.existsSync(filename)) {
    const content = fs.readFileSync(filename, 'utf-8');
    console.log(content);
  } else {
    console.error(`文件 ${filename} 不存在`);
  }

})
// 删除文件命令
program.command('delete <filename>').description('删除文件').option('-f, --force', '强制删除，不提示').action(async (filename, options) => {
  if (fs.existsSync(filename)) {
    const shouldDelete = options.force || (await confirm('确定要删除吗？'));
    if (shouldDelete) {
      fs.unlinkSync(filename);
      console.log(`✅ 文件 ${filename} 已删除`);
    } else {
      console.log('已取消删除');
    }
  } else {
    console.error(`❌ 文件 ${filename} 不存在`);
  }
})

program.parse(process.argv);
