/**
 * jsonc-eslint-parser 示例：Flat Config 下对 JSON 文件使用该 parser
 *
 * 用法：将本文件复制为项目根目录的 eslint.config.js，并安装：
 *   pnpm add -D jsonc-eslint-parser eslint-plugin-jsonc eslint
 */

import * as jsoncParser from "jsonc-eslint-parser";
import jsonc from "eslint-plugin-jsonc";

export default [
  {
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
    languageOptions: {
      parser: jsoncParser,
      parserOptions: {
        jsonSyntax: "JSONC", // "JSON" | "JSONC" | "JSON5"，不写则接受多种写法
      },
    },
    plugins: {
      jsonc,
    },
    rules: {
      "jsonc/auto": "error",
      "jsonc/sort-keys": "off",
    },
  },
];
