/**
 * json-bigint 基础示例：大整数不丢精度的 parse/stringify
 *
 * 运行：node src/67_json_bigint/1.base.js
 * 需先：pnpm add json-bigint
 */

import JSONbig from "json-bigint";

// 默认用 BigNumber；若要原生 BigInt 可：json-bigint({ useNativeBigInt: true })
const JSONbigNative = JSONbig({ useNativeBigInt: true });

const json = '{"id":9223372036854775807,"name":"item","count":100}';

// 原生 JSON.parse 会丢精度
const nativeParsed = JSON.parse(json);
console.log("原生 JSON.parse(id):", nativeParsed.id);
console.log("原生 是否丢精度:", nativeParsed.id !== 9223372036854775807n);

// json-bigint 不丢精度（原生 BigInt）
const parsed = JSONbigNative.parse(json);
console.log("json-bigint parse(id):", parsed.id, typeof parsed.id);
console.log("json-bigint 精度正确:", parsed.id === 9223372036854775807n);

// stringify 大数输出为数字形式
const str = JSONbigNative.stringify(parsed);
console.log("stringify 结果:", str);
