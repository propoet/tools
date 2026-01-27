// 交互式命令：select 单选、checkbox 多选，均支持方向键
import { Command } from "commander";
import { input, select, checkbox, confirm } from "@inquirer/prompts";

const program = new Command();

program
  .command('init')
  .description('初始化项目')
  .action(async () => {
    const name = await input({ message: '模块名称' });
    // 多选：用 checkbox，空格勾选/取消，回车确认
    const templates = await checkbox({
      message: '选择模板 (空格勾选，回车确认):',
      choices: [
        { name: 'Form', value: 'Form' },
        { name: 'Table', value: 'Table' },
        { name: 'Search', value: 'Search' },
        { name: 'Detail', value: 'Detail' },
      ],
      required: true, // 至少选一项
    });
    const install = await confirm({ message: '是否安装依赖?', default: true });

    const answers = { name, templates, install };
    console.log(answers);
  });
program.parse();
