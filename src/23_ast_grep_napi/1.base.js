/**
 * @ast-grep/napi 基础示例
 * 运行: node src/23_ast_grep_napi/1.base.js
 *
 * 需先安装: pnpm add @ast-grep/napi
 */
import { parse, Lang, kind } from '@ast-grep/napi'

const source = `
console.log("hello world")
function add(a, b) { return a + b }
add(1, 2)
`

const ast = parse(Lang.JavaScript, source)
const root = ast.root()

// 1. 按模式查找第一个 console.log
const logNode = root.find('console.log($A)')
if (logNode) {
  const arg = logNode.getMatch('A')
  console.log('找到 console.log 参数:', arg?.text())
}

// 2. findAll 查找所有函数声明
const fns = root.findAll('function $NAME($$$) { $$$ }')
console.log('函数声明数量:', fns.length)
fns.forEach((n, i) => {
  const name = n.getMatch('NAME')
  console.log(`  函数 ${i + 1}:`, name?.text())
})

// 3. 按 kind 查找所有 call_expression
const callKind = kind(Lang.JavaScript, 'call_expression')
const calls = root.findAll(callKind)
console.log('调用表达式数量:', calls.length)
calls.forEach((n, i) => console.log(`  调用 ${i + 1}:`, n.text().trim()))
