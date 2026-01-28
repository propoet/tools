/**
 * @clack/prompts 基础示例
 * 运行: node src/25_clack_prompts/1.base.js
 *
 * 需先安装: pnpm add @clack/prompts
 */
import {
  intro,
  outro,
  text,
  confirm,
  select,
  isCancel,
  cancel,
  spinner,
} from '@clack/prompts'

function handleCancel(value) {
  if (isCancel(value)) {
    cancel('已取消')
    process.exit(0)
  }
}

intro('@clack/prompts 示例')

// 1. 文本输入
const name = await text({
  message: '你的名字？',
  placeholder: '张三',
  validate(v) {
    if (!v || v.length < 2) return '至少 2 个字符'
  },
})
handleCancel(name)

// 2. 确认
const go = await confirm({
  message: `你好 ${name}，是否继续？`,
})
handleCancel(go)
if (!go) {
  cancel('已退出')
  process.exit(0)
}

// 3. 单选
const framework = await select({
  message: '选一个框架',
  options: [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte', hint: '编译时框架' },
  ],
})
handleCancel(framework)

// 4. 加载圈
const s = spinner()
s.start('正在模拟安装…')
await new Promise((r) => setTimeout(r, 1500))
s.stop(`已选 ${framework}，示例结束`)

outro('感谢使用')
