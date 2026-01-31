/**
 * h3 基础示例：App + Router + defineEventHandler + Node 适配器
 *
 * 运行方式（二选一）：
 * 1. node server.mjs   （需先 pnpm add h3）
 * 2. npx --yes listhen --open ./app.mjs
 */

import { createApp, createRouter, defineEventHandler, getQuery, getRouterParam } from "h3";

// ---------- 1. 创建 App ----------
export const app = createApp({
  onRequest(event) {
    console.log(`[${event.method}] ${event.path}`);
  },
});

// ---------- 2. 创建路由并注册到 App ----------
const router = createRouter();

// GET /
router.get("/", defineEventHandler(() => ({ message: "⚡️ Tadaa! h3 欢迎你" })));

// GET /hello
router.get("/hello", defineEventHandler(() => "Hello world!"));

// GET /hello/:name 路径参数
router.get("/hello/:name", defineEventHandler((event) => {
  const name = getRouterParam(event, "name");
  return { say: `Hello, ${name}!` };
}));

// GET /api?key=value 查询参数
router.get("/api", defineEventHandler((event) => {
  const query = getQuery(event);
  return { query, path: event.path, method: event.method };
}));

app.use(router);
