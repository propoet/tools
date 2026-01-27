// 简单的文件操作cli
import { Command } from "commander";
import fs from "fs";
import path from "path";

const program = new Command();
program
.name('file-cli').description('文件操作工具').version('1.0.0');

// 创建文件命令
program.command('create <filename>').description('创建文件').option('-c, --content <content>', '文件内容', '')
.action((filename,options)=>{
  fs.writeFileSync(filename, options.content);
  console.log(`文件 ${filename} 创建成功`);
})
// 读取文件命令
program.command('read <filename>').description('读取文件内容').action((filename)=>{
  if(fs.existsSync(filename)){
    const content = fs.readFileSync(filename, 'utf-8');
    console.log(content);
  }else{
    console.error(`文件 ${filename} 不存在`);
  }

})
// 删除文件命令
program.command('delete <filename>').description('删除文件').option('-f, --force', '强制删除，不提示').action((filename,options)=>{
  if (fs.existsSync(filename)) {
    if (options.force || confirm('确定要删除吗？')) {
      fs.unlinkSync(filename);
      console.log(`✅ 文件 ${filename} 已删除`);
    }
  } else {
    console.error(`❌ 文件 ${filename} 不存在`);
  }
})

program.parse(process.argv);
