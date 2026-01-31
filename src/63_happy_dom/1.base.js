/**
 * happy-dom 基础示例：Window 类建 DOM、查改节点
 *
 * 运行：node src/63_happy_dom/1.base.js
 * 需先：pnpm add -D happy-dom
 */

import { Window } from "happy-dom";

const window = new Window({ url: "https://localhost:8080" });
const document = window.document;

// 1. 用 innerHTML 挂一段 DOM
document.body.innerHTML = `
  <div class="container">
    <h1>happy-dom 示例</h1>
    <ul id="list"></ul>
  </div>
`;

// 2. 用 API 创建节点并挂上去
const list = document.getElementById("list");
const items = ["Window", "document", "querySelector", "createElement"];
for (const text of items) {
  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
}

// 3. 查节点、读内容
const container = document.querySelector(".container");
console.log("innerHTML 片段:", container.innerHTML.slice(0, 80) + "...");
console.log("li 数量:", document.querySelectorAll("li").length);
console.log("location.href:", window.location.href);

// 4. 用完后释放（脚本里可选，单测里建议调）
await window.happyDOM.abort();
window.close();
console.log("done.");
