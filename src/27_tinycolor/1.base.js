/**
 * @ctrl/tinycolor 基础示例
 * 运行: node src/27_tinycolor/1.base.js
 *
 * 需先安装: pnpm add @ctrl/tinycolor
 */
import { TinyColor, random, isReadable } from '@ctrl/tinycolor'

// 1. 解析与输出
const red = new TinyColor('red')
console.log('red.toHexString():', red.toHexString())
console.log('red.toRgbString():', red.toRgbString())
console.log('red.toHslString():', red.toHslString())
console.log('red.toRgb():', red.toRgb())
console.log('red.toName():', red.toName())

// 2. 从不同输入创建
const fromHex = new TinyColor('#00ff00')
const fromRgb = new TinyColor({ r: 0, g: 128, b: 255 })
const fromHsl = new TinyColor('hsl(270, 100%, 50%)')
console.log('fromHex:', fromHex.toHexString())
console.log('fromRgb:', fromRgb.toHexString())
console.log('fromHsl:', fromHsl.toHexString())

// 3. 修改（返回新实例）
const base = new TinyColor('#ff0000')
console.log('lighten(30):', base.lighten(30).toHexString())
console.log('darken(30):', base.darken(30).toHexString())
console.log('saturate(50):', base.saturate(50).toHexString())
console.log('greyscale():', base.greyscale().toHexString())
console.log('spin(120):', base.spin(120).toHexString())
console.log('tint(50):', base.tint(50).toHexString())
console.log('shade(50):', base.shade(50).toHexString())
console.log('mix(#00ff00, 50):', base.mix('#00ff00', 50).toHexString())

// 4. 属性与判断
console.log('isValid:', base.isValid)
console.log('getBrightness():', base.getBrightness())
console.log('getLuminance():', base.getLuminance())
console.log('isDark():', base.isDark())
console.log('isLight():', base.isLight())

// 5. 配色
console.log('complement():', base.complement().toHexString())
console.log('triad():', base.triad().map((t) => t.toHexString()))
console.log('tetrad():', base.tetrad().map((t) => t.toHexString()))
console.log('analogous(4):', base.analogous(4).map((t) => t.toHexString()))
console.log('monochromatic(4):', base.monochromatic(4).map((t) => t.toHexString()))

// 6. 工具函数
const rand = random()
console.log('random():', rand.toHexString())

console.log('isReadable(#000, #fff):', isReadable('#000', '#fff'))
console.log('isReadable(#333, #444):', isReadable('#333', '#444'))
