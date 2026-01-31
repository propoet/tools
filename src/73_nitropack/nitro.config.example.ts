/**
 * Nitro 配置示例（复制到 Nitro 项目根目录为 nitro.config.ts 使用）
 * 需先：pnpm add -D nitropack，并创建 server/api/ 或 server/routes/
 */

import { defineNitroConfig } from "nitropack";

export default defineNitroConfig({
  // 部署目标：node-server | vercel | cloudflare_pages | cloudflare_module | netlify | bun 等
  preset: "node-server",

  routeRules: {
    // API 开启 CORS
    "/api/**": { cors: true },
    // 某路径 SWR 缓存 60 秒
    "/blog/**": { swr: 60 },
    // 重定向
    // "/old": { redirect: "/new" },
    // 反向代理
    // "/proxy/**": { proxy: "https://api.example.com/**" },
  },
});
