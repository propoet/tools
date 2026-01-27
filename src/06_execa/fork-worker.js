/**
 * 供 fork() 使用的子进程脚本：收到父进程消息后回一条并退出
 */
process.on('message', (msg) => {
  process.send({ reply: 'pong', received: msg });
  process.exit(0);
});
