/**
 * jsonwebtoken 基础示例：sign（签发）与 verify（校验）
 *
 * 运行：node src/69_jsonwebtoken/1.base.js
 * 需先：pnpm add jsonwebtoken
 */

import jwt from "jsonwebtoken";

const secret = "demo-secret-change-in-production";

// 1. 签发：payload + 密钥 + 可选 expiresIn
const payload = { userId: "user-123", role: "user" };
const token = jwt.sign(payload, secret, { expiresIn: "1h" });
console.log("签发的 token（前 50 字符）:", token.slice(0, 50) + "...");

// 2. 校验：token + 同一密钥
try {
  const decoded = jwt.verify(token, secret);
  console.log("校验通过，payload:", decoded);
  console.log("payload.userId:", decoded.userId);
} catch (err) {
  console.error("校验失败:", err.message);
}

// 3. 仅解码（不验签，仅演示，不可用于鉴权）
const decodedOnly = jwt.decode(token);
console.log("decode（不验签）:", decodedOnly);
