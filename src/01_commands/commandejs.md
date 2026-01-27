# Commander.js 从零开始学习指南

## 📚 目录
1. [什么是 Commander.js](#什么是-commanderjs)
2. [安装与配置](#安装与配置)
3. [基础概念](#基础概念)
4. [核心 API 详解](#核心-api-详解)
5. [实战示例](#实战示例)
6. [高级特性](#高级特性)
7. [最佳实践](#最佳实践)

---

## 什么是 Commander.js

Commander.js 是 Node.js 中最流行的命令行界面（CLI）工具库，用于快速构建命令行应用程序。它提供了简洁的 API 来处理命令行参数、选项、子命令等。

### 为什么选择 Commander.js？
- ✅ 简单易用，API 清晰直观
- ✅ 功能强大，支持复杂的命令行场景
- ✅ 社区活跃，文档完善
- ✅ 自动生成帮助信息
- ✅ 支持 TypeScript

---

## 安装与配置

### 1. 安装依赖

```bash
npm install commander
# 或
pnpm add commander
# 或
yarn add commander
```

### 2. 项目结构

```
tools/
├── package.json
├── index.js          # 主入口文件
├── commands/         # 命令模块目录（可选）
│   ├── create.js
│   └── delete.js
└── README.md
```

---

## 基础概念

### 核心概念理解

1. **程序（Program）**：整个 CLI 应用的入口
2. **命令（Command）**：用户执行的具体操作，如 `git commit`、`npm install`
3. **选项（Option）**：命令的配置参数，如 `--version`、`-v`、`--output=file.txt`
4. **参数（Argument）**：命令的位置参数，如 `git clone <url>` 中的 `url`

---

## 核心 API 详解

### 1. 基础用法 - 创建程序

```javascript
const { Command } = require('commander');
const program = new Command();

// 设置程序基本信息
program
  .name('my-cli')
  .description('一个简单的 CLI 工具')
  .version('1.0.0');

// 解析命令行参数
program.parse();
```

**运行效果：**
```bash
node index.js --help
# 输出帮助信息

node index.js --version
# 输出 1.0.0
```

### 2. 添加命令（Command）

```javascript
program
  .command('create <name>')
  .description('创建一个新项目')
  .action((name) => {
    console.log(`正在创建项目: ${name}`);
  });
```

**运行：**
```bash
node index.js create my-project
# 输出: 正在创建项目: my-project
```

### 3. 添加选项（Option）

#### 3.1 布尔选项（Flag）

```javascript
program
  .option('-d, --debug', '开启调试模式')
  .option('-s, --silent', '静默模式');

program.parse();

const options = program.opts();
if (options.debug) {
  console.log('调试模式已开启');
}
```

**运行：**
```bash
node index.js --debug
# 或
node index.js -d
```

#### 3.2 带值的选项

```javascript
program
  .option('-p, --port <number>', '指定端口号', '3000')
  .option('-o, --output <file>', '输出文件路径');

program.parse();

const options = program.opts();
console.log(`端口: ${options.port}`);
console.log(`输出文件: ${options.output}`);
```

**运行：**
```bash
node index.js --port 8080 --output result.txt
# 端口: 8080
# 输出文件: result.txt
```

#### 3.3 必填选项

```javascript
program
  .requiredOption('-t, --token <token>', 'API Token（必填）');

program.parse();
```

#### 3.4 选项的默认值和验证

```javascript
program
  .option('-p, --port <number>', '端口号', (value) => {
    const port = parseInt(value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('端口号必须是 1-65535 之间的数字');
    }
    return port;
  }, 3000);
```

### 4. 命令参数（Arguments）

```javascript
program
  .command('clone <url> [destination]')
  .description('克隆仓库')
  .action((url, destination) => {
    console.log(`从 ${url} 克隆到 ${destination || './'}`);
  });
```

**参数说明：**
- `<url>`：必填参数
- `[destination]`：可选参数

**运行：**
```bash
node index.js clone https://github.com/user/repo.git
node index.js clone https://github.com/user/repo.git ./my-repo
```

### 5. 命令选项组合

```javascript
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
```

---

## 实战示例

### 示例 1：简单的文件操作 CLI

```javascript
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('file-cli')
  .description('文件操作工具')
  .version('1.0.0');

// 创建文件命令
program
  .command('create <filename>')
  .description('创建新文件')
  .option('-c, --content <text>', '文件内容', '')
  .action((filename, options) => {
    fs.writeFileSync(filename, options.content);
    console.log(`✅ 文件 ${filename} 创建成功`);
  });

// 读取文件命令
program
  .command('read <filename>')
  .description('读取文件内容')
  .action((filename) => {
    if (fs.existsSync(filename)) {
      const content = fs.readFileSync(filename, 'utf-8');
      console.log(content);
    } else {
      console.error(`❌ 文件 ${filename} 不存在`);
    }
  });

// 删除文件命令
program
  .command('delete <filename>')
  .description('删除文件')
  .option('-f, --force', '强制删除，不提示')
  .action((filename, options) => {
    if (fs.existsSync(filename)) {
      if (options.force || confirm('确定要删除吗？')) {
        fs.unlinkSync(filename);
        console.log(`✅ 文件 ${filename} 已删除`);
      }
    } else {
      console.error(`❌ 文件 ${filename} 不存在`);
    }
  });

program.parse();
```

**使用示例：**

```bash
node index.js create test.txt --content "Hello World"
node index.js read test.txt
node index.js delete test.txt --force
```

### 示例 2：带子命令的 CLI（类似 git）

```javascript
const { Command } = require('commander');

const program = new Command();

program
  .name('my-git')
  .description('Git 命令模拟器')
  .version('1.0.0');

// git clone
program
  .command('clone <url>')
  .description('克隆仓库')
  .option('-b, --branch <branch>', '指定分支', 'main')
  .option('--depth <number>', '浅克隆深度')
  .action((url, options) => {
    console.log(`正在克隆 ${url}`);
    console.log(`分支: ${options.branch}`);
    if (options.depth) {
      console.log(`深度: ${options.depth}`);
    }
  });

// git commit
program
  .command('commit')
  .description('提交更改')
  .option('-m, --message <msg>', '提交信息', 'Update')
  .option('-a, --all', '提交所有更改')
  .action((options) => {
    console.log(`提交信息: ${options.message}`);
    console.log(`提交所有: ${options.all ? '是' : '否'}`);
  });

// git push
program
  .command('push')
  .description('推送到远程')
  .option('--force', '强制推送')
  .argument('[remote]', '远程仓库', 'origin')
  .argument('[branch]', '分支名', 'main')
  .action((remote, branch, options) => {
    console.log(`推送到 ${remote}/${branch}`);
    if (options.force) {
      console.log('⚠️  强制推送模式');
    }
  });

program.parse();
```

**使用示例：**
```bash
node index.js clone https://github.com/user/repo.git --branch dev
node index.js commit -m "feat: 新功能" --all
node index.js push origin main --force
```

### 示例 3：交互式 CLI

```javascript
const { Command } = require('commander');
const readline = require('readline');

const program = new Command();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.(query, resolve));
}

program
  .name('interactive-cli')
  .description('交互式 CLI 工具')
  .version('1.0.0');

program
  .command('init')
  .description('初始化项目')
  .action(async () => {
    console.log('欢迎使用项目初始化工具！\n');
    
    const name = await question('项目名称: ');
    const version = await question('版本号 (1.0.0): ') || '1.0.0';
    const description = await question('项目描述: ');
    const author = await question('作者: ');
    
    const packageJson = {
      name,
      version,
      description,
      author,
      main: 'index.js'
    };
    
    console.log('\n生成的 package.json:');
    console.log(JSON.stringify(packageJson, null, 2));
    
    rl.close();
  });

program.parse();
```

---

## 高级特性

### 1. 自定义帮助信息

```javascript
program
  .configureHelp({
    helpWidth: 100,
    sortSubcommands: true,
    sortOptions: true
  })
  .addHelpText('after', `
示例:
  $ my-cli create app --template react
  $ my-cli build --watch
  $ my-cli deploy --env production
`);
```

### 2. 错误处理

```javascript
program
  .command('dangerous')
  .action(() => {
    throw new Error('操作失败');
  });

// 全局错误处理
program.exitOverride();

try {
  program.parse();
} catch (err) {
  console.error('❌ 发生错误:', err.message);
  process.exit(1);
}
```

### 3. 钩子函数（Hooks）

```javascript
program
  .hook('preAction', (thisCommand, actionCommand) => {
    console.log('执行命令前的钩子');
  })
  .hook('postAction', (thisCommand, actionCommand) => {
    console.log('执行命令后的钩子');
  });
```

### 4. 命令别名

```javascript
program
  .command('remove <name>')
  .alias('rm')
  .description('删除项目')
  .action((name) => {
    console.log(`删除 ${name}`);
  });

// 可以使用 remove 或 rm
```

### 5. 命令分组

```javascript
const buildCommand = program
  .command('build')
  .description('构建相关命令');

buildCommand
  .command('dev')
  .description('开发环境构建')
  .action(() => {
    console.log('开发构建');
  });

buildCommand
  .command('prod')
  .description('生产环境构建')
  .action(() => {
    console.log('生产构建');
  });
```

### 6. 使用 TypeScript

```typescript
import { Command } from 'commander';

interface BuildOptions {
  env: string;
  watch: boolean;
  output: string;
}

const program = new Command();

program
  .command('build')
  .option<BuildOptions, '-e, --env <env>'>('-e, --env <env>', '环境', 'development')
  .option<BuildOptions, '-w, --watch'>('-w, --watch', '监听模式')
  .option<BuildOptions, '-o, --output <dir>'>('-o, --output <dir>', '输出目录', 'dist')
  .action((options: BuildOptions) => {
    console.log(options);
  });

program.parse();
```

---

## 最佳实践

### 1. 模块化组织命令

**commands/create.js:**
```javascript
const { Command } = require('commander');

function createCommand() {
  const cmd = new Command('create');
  
  cmd
    .description('创建新项目')
    .argument('<name>', '项目名称')
    .option('-t, --template <template>', '项目模板', 'default')
    .action((name, options) => {
      console.log(`创建项目 ${name}，使用模板 ${options.template}`);
    });
  
  return cmd;
}

module.exports = createCommand;
```

**index.js:**
```javascript
const { Command } = require('commander');
const createCommand = require('./commands/create');

const program = new Command();

program
  .name('my-cli')
  .version('1.0.0')
  .addCommand(createCommand());

program.parse();
```

### 2. 统一的错误处理

```javascript
program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  if (err.code === 'commander.version') {
    process.exit(0);
  }
  console.error('❌ 错误:', err.message);
  process.exit(1);
}
```

### 3. 配置验证

```javascript
program
  .option('-p, --port <port>', '端口号', (value) => {
    const port = parseInt(value, 10);
    if (isNaN(port)) {
      throw new commander.InvalidArgumentError('端口必须是数字');
    }
    return port;
  });
```

### 4. 使用环境变量

```javascript
program
  .option('--api-key <key>', 'API Key', process.env.API_KEY)
  .option('--env <env>', '环境', process.env.NODE_ENV || 'development');
```

### 5. 输出格式化

```javascript
const chalk = require('chalk');

program
  .command('status')
  .action(() => {
    console.log(chalk.green('✅ 运行正常'));
    console.log(chalk.yellow('⚠️  警告信息'));
    console.log(chalk.red('❌ 错误信息'));
  });
```

---

## 完整示例项目

### package.json 配置

```json
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "description": "一个基于 Commander.js 的 CLI 工具",
  "main": "index.js",
  "bin": {
    "my-cli": "./index.js"
  },
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "commander": "^11.0.0"
  }
}
```

### index.js（完整示例）

```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

// 程序基本信息
program
  .name('my-cli')
  .description('一个功能完整的 CLI 工具示例')
  .version('1.0.0');

// 全局选项
program
  .option('-v, --verbose', '显示详细信息')
  .option('-q, --quiet', '静默模式');

// 创建命令
program
  .command('create <name>')
  .description('创建新项目')
  .option('-t, --template <template>', '项目模板', 'default')
  .option('-d, --dir <directory>', '目标目录', process.cwd())
  .action((name, options) => {
    const { template, dir } = options;
    const projectPath = path.join(dir, name);
    
    if (fs.existsSync(projectPath)) {
      console.error(`❌ 目录 ${projectPath} 已存在`);
      process.exit(1);
    }
    
    fs.mkdirSync(projectPath, { recursive: true });
    console.log(`✅ 项目 ${name} 创建成功`);
    console.log(`   模板: ${template}`);
    console.log(`   路径: ${projectPath}`);
  });

// 列表命令
program
  .command('list')
  .description('列出所有项目')
  .option('-a, --all', '显示所有文件')
  .action((options) => {
    const files = fs.readdirSync(process.cwd());
    files.forEach(file => {
      const stats = fs.statSync(file);
      if (stats.isDirectory() || options.all) {
        console.log(file);
      }
    });
  });

// 删除命令
program
  .command('delete <name>')
  .description('删除项目')
  .option('-f, --force', '强制删除')
  .action((name, options) => {
    const projectPath = path.join(process.cwd(), name);
    
    if (!fs.existsSync(projectPath)) {
      console.error(`❌ 项目 ${name} 不存在`);
      process.exit(1);
    }
    
    if (options.force) {
      fs.rmSync(projectPath, { recursive: true, force: true });
      console.log(`✅ 项目 ${name} 已删除`);
    } else {
      console.log(`⚠️  使用 --force 标志来确认删除`);
    }
  });

// 自定义帮助信息
program.addHelpText('after', `
示例:
  $ my-cli create my-app --template react
  $ my-cli list
  $ my-cli delete my-app --force
`);

// 错误处理
program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (err.code !== 'commander.helpDisplayed' && 
      err.code !== 'commander.version') {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}
```

---

## 总结

### 核心要点回顾

1. ✅ **基础结构**：使用 `new Command()` 创建程序
2. ✅ **命令定义**：使用 `.command()` 添加命令
3. ✅ **选项处理**：使用 `.option()` 添加选项
4. ✅ **参数处理**：在命令中使用 `<required>` 和 `[optional]` 定义参数
5. ✅ **动作执行**：使用 `.action()` 定义命令执行逻辑
6. ✅ **帮助信息**：自动生成，也可自定义

### 下一步学习

- 📖 阅读 [Commander.js 官方文档](https://github.com/tj/commander.js)
- 🔧 尝试构建自己的 CLI 工具
- 🎯 学习其他 CLI 工具库（如 `yargs`、`inquirer`）
- 🚀 发布你的 CLI 工具到 npm

---

## 常见问题 FAQ

### Q1: `parse()` 方法的参数可以省略吗？

**A:** 可以！`program.parse()` 和 `program.parse(process.argv)` 是等价的。如果不传参数，Commander.js 会自动使用 `process.argv`。

```javascript
// 这两种写法完全等价
program.parse();
program.parse(process.argv);
```

### Q2: `--help` 和 `--version` 是固定的吗？

**A:** 
- `--help` / `-h`：默认提供，无需配置
- `--version` / `-V`：调用 `.version()` 后自动添加

可以通过配置禁用或自定义，但通常不需要。

### Q3: 如何触发选项的默认值？

**A:** 当用户不提供该选项时，会自动使用默认值：

```javascript
program.option('-p, --port <number>', '端口号', 3000);

// 不提供 --port，会使用默认值 3000
node index.js

// 提供 --port，会使用自定义值
node index.js --port 8080
```

### Q4: 必填参数和可选参数的区别？

**A:** 
- `<name>`：必填参数，必须提供
- `[name]`：可选参数，可以不提供

```javascript
// 必填参数
.command('create <name>')  // name 必须提供

// 可选参数
.command('clone <url> [destination]')  // destination 可以不提供
```

### Q5: 如何获取命令的选项值？

**A:** 使用 `program.opts()` 或 `command.opts()`：

```javascript
// 全局选项
const options = program.opts();

// 命令选项（在 action 中）
.action((name, options) => {
  // options 是命令的选项对象
});
```

### Q6: 如何处理多个命令选项？

**A:** 在 `.action()` 回调中，选项会自动作为参数传入：

```javascript
program
  .command('build')
  .option('-e, --env <env>', '环境')
  .option('-w, --watch', '监听')
  .action((options) => {
    // options.env, options.watch
  });
```

### Q7: 如何自定义错误信息？

**A:** 使用 `InvalidArgumentError` 或 `InvalidOptionArgumentError`：

```javascript
const { InvalidArgumentError } = require('commander');

program
  .option('-p, --port <port>', '端口号', (value) => {
    const port = parseInt(value, 10);
    if (isNaN(port)) {
      throw new InvalidArgumentError('端口必须是数字');
    }
    return port;
  });
```

---

## 调试技巧

### 1. 查看解析后的参数

```javascript
program.parse();

// 查看所有选项
console.log('选项:', program.opts());

// 查看原始参数
console.log('原始参数:', process.argv);

// 查看解析后的参数
console.log('解析后:', program.args);
```

### 2. 启用详细输出

```javascript
program
  .option('-v, --verbose', '详细输出')
  .action((options) => {
    if (options.verbose) {
      console.log('调试信息:', {
        options: program.opts(),
        args: program.args,
        rawArgs: process.argv
      });
    }
  });
```

### 3. 使用 Node.js 调试器

```bash
# 启动调试
node --inspect index.js build --env production

# 或使用 Chrome DevTools
node --inspect-brk index.js build --env production
```

### 4. 测试命令解析

```javascript
// 测试时使用模拟参数
program.parse(['node', 'script.js', 'build', '--env', 'production']);

// 验证解析结果
const options = program.opts();
console.assert(options.env === 'production');
```

---

## 测试 CLI 工具

### 使用 Jest 测试

```javascript
// __tests__/cli.test.js
const { Command } = require('commander');
const { execSync } = require('child_process');

describe('CLI 测试', () => {
  test('应该正确解析选项', () => {
    const program = new Command();
    program.option('-p, --port <port>', '端口号', '3000');
    
    program.parse(['node', 'script.js', '--port', '8080']);
    const options = program.opts();
    
    expect(options.port).toBe('8080');
  });

  test('应该使用默认值', () => {
    const program = new Command();
    program.option('-p, --port <port>', '端口号', '3000');
    
    program.parse(['node', 'script.js']);
    const options = program.opts();
    
    expect(options.port).toBe('3000');
  });

  test('应该执行命令', () => {
    const output = execSync('node index.js build --env production', {
      encoding: 'utf-8'
    });
    expect(output).toContain('production');
  });
});
```

### 使用 Commander.js 的测试工具

```javascript
// 测试命令执行
const program = new Command();

program
  .command('test')
  .action(() => {
    console.log('测试通过');
  });

// 模拟执行
program.parse(['node', 'script.js', 'test']);
```

---

## 发布到 npm

### 1. 准备 package.json

```json
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "description": "一个 CLI 工具",
  "main": "index.js",
  "bin": {
    "my-cli": "./index.js",
    "mct": "./index.js"
  },
  "files": [
    "index.js",
    "commands/"
  ],
  "keywords": ["cli", "command-line"],
  "author": "Your Name",
  "license": "MIT"
}
```

### 2. 添加 shebang

在 `index.js` 文件开头添加：

```javascript
#!/usr/bin/env node

const { Command } = require('commander');
// ... 其他代码
```

### 3. 设置文件权限（Linux/Mac）

```bash
chmod +x index.js
```

### 4. 发布步骤

```bash
# 1. 登录 npm
npm login

# 2. 检查包名是否可用
npm search my-cli-tool

# 3. 发布
npm publish

# 4. 发布后测试安装
npm install -g my-cli-tool
my-cli --help
```

### 5. 版本管理

```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 自动发布
npm version patch && npm publish
```

---

## 与其他工具集成

### 1. 使用 Inquirer.js 实现交互式提示

```javascript
const { Command } = require('commander');
const inquirer = require('inquirer');

const program = new Command();

program
  .command('init')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '项目名称:'
      },
      {
        type: 'list',
        name: 'template',
        message: '选择模板:',
        choices: ['react', 'vue', 'angular']
      },
      {
        type: 'confirm',
        name: 'install',
        message: '是否安装依赖?'
      }
    ]);
    
    console.log('答案:', answers);
  });

program.parse();
```

### 2. 使用 Chalk 美化输出

```javascript
const chalk = require('chalk');

program
  .command('status')
  .action(() => {
    console.log(chalk.green('✅ 运行正常'));
    console.log(chalk.yellow('⚠️  警告信息'));
    console.log(chalk.red('❌ 错误信息'));
    console.log(chalk.blue.bold('重要提示'));
  });
```

### 3. 使用 Ora 显示加载动画

```javascript
const ora = require('ora');

program
  .command('build')
  .action(async () => {
    const spinner = ora('正在构建...').start();
    
    try {
      // 模拟构建过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.succeed('构建完成！');
    } catch (error) {
      spinner.fail('构建失败');
    }
  });
```

### 4. 使用 dotenv 加载环境变量

```javascript
require('dotenv').config();

program
  .option('--api-key <key>', 'API Key', process.env.API_KEY)
  .option('--env <env>', '环境', process.env.NODE_ENV || 'development');
```

### 5. 使用 fs-extra 处理文件

```javascript
const fs = require('fs-extra');

program
  .command('init <name>')
  .action(async (name) => {
    const projectPath = path.join(process.cwd(), name);
    
    // 确保目录存在
    await fs.ensureDir(projectPath);
    
    // 复制模板文件
    await fs.copy(templatePath, projectPath);
    
    // 写入配置文件
    await fs.writeJSON(
      path.join(projectPath, 'package.json'),
      { name, version: '1.0.0' },
      { spaces: 2 }
    );
  });
```

---

## 性能优化建议

### 1. 延迟加载命令

```javascript
// 不推荐：立即加载所有命令
const createCommand = require('./commands/create');
const deleteCommand = require('./commands/delete');

// 推荐：按需加载
program
  .command('create')
  .action(() => {
    const createCommand = require('./commands/create');
    createCommand();
  });
```

### 2. 使用异步操作

```javascript
program
  .command('fetch <url>')
  .action(async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
  });
```

### 3. 批量处理选项

```javascript
// 一次性获取所有选项，而不是多次调用 opts()
const options = program.opts();
const { port, host, timeout } = options;
```

---

## 更多实战案例

### 案例 1: 配置文件管理 CLI

```javascript
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('config-cli')
  .description('配置文件管理工具')
  .version('1.0.0');

// 设置配置
program
  .command('set <key> <value>')
  .description('设置配置项')
  .action((key, value) => {
    const configPath = path.join(process.cwd(), '.config.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    
    config[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ 设置 ${key} = ${value}`);
  });

// 获取配置
program
  .command('get <key>')
  .description('获取配置项')
  .action((key) => {
    const configPath = path.join(process.cwd(), '.config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ 配置文件不存在');
      return;
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(config[key] || '未设置');
  });

// 列出所有配置
program
  .command('list')
  .description('列出所有配置')
  .action(() => {
    const configPath = path.join(process.cwd(), '.config.json');
    
    if (!fs.existsSync(configPath)) {
      console.log('暂无配置');
      return;
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    Object.entries(config).forEach(([key, value]) => {
      console.log(`${key} = ${value}`);
    });
  });

program.parse();
```

### 案例 2: 批量文件处理 CLI

```javascript
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('batch-processor')
  .description('批量文件处理工具')
  .version('1.0.0');

program
  .command('rename <pattern> <replacement>')
  .description('批量重命名文件')
  .option('-d, --dir <directory>', '目标目录', process.cwd())
  .option('-e, --ext <extension>', '文件扩展名过滤')
  .option('--dry-run', '预览模式，不实际执行')
  .action((pattern, replacement, options) => {
    const dir = options.dir;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      if (options.ext && !file.endsWith(options.ext)) {
        return;
      }
      
      const newName = file.replace(new RegExp(pattern, 'g'), replacement);
      
      if (options.dryRun) {
        console.log(`预览: ${file} -> ${newName}`);
      } else {
        fs.renameSync(
          path.join(dir, file),
          path.join(dir, newName)
        );
        console.log(`✅ 重命名: ${file} -> ${newName}`);
      }
    });
  });

program
  .command('convert <format>')
  .description('批量转换文件格式')
  .option('-d, --dir <directory>', '目标目录', process.cwd())
  .option('-f, --from <ext>', '源格式', 'jpg')
  .option('-t, --to <ext>', '目标格式', 'png')
  .action((format, options) => {
    // 实现转换逻辑
    console.log(`转换 ${options.from} -> ${options.to}`);
  });

program.parse();
```

### 案例 3: API 测试 CLI

```javascript
const { Command } = require('commander');

const program = new Command();

program
  .name('api-tester')
  .description('API 测试工具')
  .version('1.0.0');

program
  .command('get <url>')
  .description('发送 GET 请求')
  .option('-H, --header <header>', '请求头', (value, prev) => {
    return prev.concat([value]);
  }, [])
  .action(async (url, options) => {
    const headers = {};
    options.header.forEach(header => {
      const [key, value] = header.split(':');
      headers[key.trim()] = value.trim();
    });
    
    try {
      const response = await fetch(url, { headers });
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ 请求失败:', error.message);
    }
  });

program
  .command('post <url>')
  .description('发送 POST 请求')
  .option('-d, --data <data>', '请求体（JSON）')
  .option('-H, --header <header>', '请求头')
  .action(async (url, options) => {
    const body = options.data ? JSON.parse(options.data) : {};
    const headers = { 'Content-Type': 'application/json' };
    
    if (options.header) {
      const [key, value] = options.header.split(':');
      headers[key.trim()] = value.trim();
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ 请求失败:', error.message);
    }
  });

program.parse();
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **模块化组织代码**：将命令拆分到独立文件
2. **统一错误处理**：使用 `exitOverride()` 捕获错误
3. **参数验证**：使用转换函数验证输入
4. **清晰的帮助信息**：提供详细的描述和示例
5. **使用环境变量**：支持从环境变量读取配置
6. **异步操作**：使用 `async/await` 处理异步任务
7. **测试覆盖**：为命令编写单元测试

### ❌ 避免的做法

1. **不要硬编码路径**：使用 `process.cwd()` 或配置选项
2. **不要忽略错误**：始终处理可能的错误情况
3. **不要过度复杂**：保持命令简单直观
4. **不要缺少验证**：验证用户输入的有效性
5. **不要忘记文档**：提供清晰的 README 和使用示例

---

## 参考资源

### 官方资源

- 📖 [Commander.js GitHub](https://github.com/tj/commander.js)
- 📚 [Commander.js 文档](https://github.com/tj/commander.js/blob/master/README.md)
- 🔍 [API 参考](https://github.com/tj/commander.js/blob/master/docs/README.md)

### 相关工具

- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - 交互式命令行提示
- [Chalk](https://github.com/chalk/chalk) - 终端字符串样式
- [Ora](https://github.com/sindresorhus/ora) - 优雅的终端加载动画
- [Yargs](https://github.com/yargs/yargs) - 另一个流行的 CLI 框架
- [Meow](https://github.com/sindresorhus/meow) - 轻量级 CLI 辅助工具

### 学习资源

- 📺 YouTube 教程
- 📝 博客文章
- 💬 社区讨论

---

## 结语

Commander.js 是一个强大而灵活的命令行工具库，通过本指南，你应该已经掌握了：

- ✅ 基础概念和 API 使用
- ✅ 命令、选项、参数的配置
- ✅ 高级特性和最佳实践
- ✅ 实战项目开发
- ✅ 测试和发布流程

现在，开始构建你自己的 CLI 工具吧！🚀

**祝你学习愉快！** 🎉

---

*最后更新：2026-01-26*