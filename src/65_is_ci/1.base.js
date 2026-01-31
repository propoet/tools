/**
 * is-ci 基础示例：程序里判断是否在 CI 中
 *
 * 运行：node src/65_is_ci/1.base.js
 * 本地通常为 false；在 GitHub Actions / GitLab CI 等里为 true
 * 需先：pnpm add is-ci
 */

import isCI from "is-ci";

if (isCI) {
  console.log("当前在 CI 环境中");
} else {
  console.log("当前在本地或非 CI 环境");
}

// 常见用法：分支逻辑
console.log("isCI 值:", isCI);
