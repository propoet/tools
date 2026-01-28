import { execa, $ } from 'execa'

// const {stdout} = await execa('echo', ['hello'])
// console.log(stdout)
// const {stdout:out} = await execa('node', ['--version'])
// console.log(out)

// const branch = await $`git branch --show-current`
// console.log(branch.stdout.trim())

// windows 没有 ls 命令，所以会报错
// const out = await $`ls -la`;
// console.log(out.stdout)

// 获取退出码与错误
// const result = await execa('false', [], { reject: false });
// console.log(result.exitCode)

// 继承 stdio(实时输出)
await execa('npm', ['run', 'dev'], {
  stdio: 'inherit', // 直接打到当前终端
});