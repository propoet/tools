/**
 * @jspm/generator 最小示例（仅演示用）
 *
 * 运行前提：
 * - Node ESM（本文件是 .mjs）
 * - 安装依赖：npm i @jspm/generator
 *
 * 目标：
 * - 生成一个浏览器生产环境的 import map
 * - 演示 install / getMap / htmlInject 的基本用法
 */

import { Generator } from '@jspm/generator'

const generator = new Generator({
  mapUrl: import.meta.url,
  defaultProvider: 'jspm',
  env: ['browser', 'production', 'module'],
})

await generator.install('react')
await generator.install('react-dom')

const map = generator.getMap()
console.log('--- import map ---')
console.log(JSON.stringify(map, null, 2))

const html = await generator.htmlInject(
  '<!doctype html><script type="module">import "react"</script>',
  {
    esModuleShims: true,
    preload: true,
    integrity: true,
  }
)

console.log('--- injected html ---')
console.log(html)

