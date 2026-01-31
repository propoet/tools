/**
 * Node 下启动 h3 的入口：把 app 转成 Node requestListener 并监听端口
 * 运行：node server.mjs
 */

import { createServer } from "node:http";
import { toNodeListener } from "h3";
import { app } from "./1.base.js";

const port = Number(process.env.PORT) || 3000;
createServer(toNodeListener(app)).listen(port, () => {
  console.log(`h3 server at http://localhost:${port}`);
  console.log("  GET /         -> JSON 欢迎");
  console.log("  GET /hello    -> Hello world!");
  console.log("  GET /hello/:name -> JSON say");
  console.log("  GET /api?key=value -> JSON query");
});
