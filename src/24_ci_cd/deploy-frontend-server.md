# 新服务器 + 前端项目：CI/CD 发布示例

> 从零开始：假设你有一台**新买的/新开的服务器**和一个**前端项目**（Vite / Vue / React 等），希望「push 到 main 就自动构建并发布到这台服务器」。按下面步骤做，即可实现「成功发布」。

## 📚 目录
1. [整体流程长什么样](#整体流程长什么样)
2. [前提条件](#前提条件)
3. [第一步：服务器准备](#第一步服务器准备)
4. [第二步：为 CI 准备 SSH 密钥](#第二步为-ci-准备-ssh-密钥)
5. [第三步：在 GitHub 里填好密钥和服务器信息](#第三步在-github-里填好密钥和服务器信息)
6. [第四步：在仓库里加部署流水线](#第四步在仓库里加部署流水线)
7. [第五步：推代码触发发布](#第五步推代码触发发布)
8. [如何确认「发布成功」](#如何确认发布成功)
9. [常见问题与排查](#常见问题与排查)
10. [参考与延伸](#参考与延伸)

---

## 整体流程长什么样

```
你在本机 push 代码到 GitHub 的 main 分支
    ↓
GitHub Actions 被触发
    ↓
在云端：拉代码 → 装依赖 → 执行 npm run build（或 pnpm build）→ 得到 dist/
    ↓
用 SSH 登录你的服务器，把 dist/ 里的文件同步到服务器上的目录（如 /var/www/my-app）
    ↓
用户通过浏览器访问你的域名/IP，Nginx 把请求指到该目录，即看到最新前端
```

**你要做的事**：在服务器上「准备好目录和 Nginx」，在 GitHub 上「填好密钥、写好 workflow」，之后每次 push main 就自动完成上述流程。

---

## 前提条件

- **一台新服务器**：能通过 SSH 登录（用户名 + 密码 或 密钥），有 root 或 sudo。
- **一个前端项目**：代码在 **GitHub**，能在本地跑通 `npm run build` 或 `pnpm build`，构建产物在 `dist/`（Vite 默认）或 `build/`（Create React App）等。
- **域名（可选）**：若没有，也可先用服务器 IP 访问；有域名时在 Nginx 里配 `server_name` 即可。

---

## 第一步：服务器准备

在服务器上按顺序执行以下操作（用 SSH 登录后执行）。

### 1.1 创建部署目录

选一个目录用来放前端静态文件，例如：

```bash
sudo mkdir -p /var/www/my-app
sudo chown $USER:$USER /var/www/my-app
```

`my-app` 可改成你的项目名；若你用 `deploy` 用户部署，可改为 `chown deploy:deploy /var/www/my-app`。

### 1.2 安装 Nginx（若尚未安装）

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.3 配置 Nginx 指向该目录

新建站点配置（也可直接改 default）：

```bash
sudo nano /etc/nginx/sites-available/my-app
```

写入（把 `my-app` 和 `/var/www/my-app` 换成你的实际路径；有域名再填 `server_name`）：

```nginx
server {
    listen 80;
    server_name 你的域名或_;
    root /var/www/my-app;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`try_files ... /index.html` 用于前端路由（如 Vue Router history 模式）。

启用配置并重载 Nginx：

```bash
sudo ln -sf /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

此时 `/var/www/my-app` 里若有一个简单的 `index.html`，用浏览器访问服务器 IP 或域名应能看到。接下来让 CI 把构建好的 `dist/` 同步到这个目录即可。

---

## 第二步：为 CI 准备 SSH 密钥

CI 需要用「密钥」登录你的服务器，才能把文件传上去。做法是：**在本机或服务器上生成一对密钥，把公钥放到服务器，把私钥放到 GitHub Secrets**。

### 2.1 生成一对专用于部署的密钥

在**本机**执行（若已有一对专用于部署的密钥可跳过）：

```bash
ssh-keygen -t rsa -b 4096 -f deploy_key -N ""
```

会得到 `deploy_key`（私钥）和 `deploy_key.pub`（公钥）。**私钥不能泄露**，只放到 GitHub Secrets；公钥放到服务器。

### 2.2 把公钥写入服务器的授权列表

把 `deploy_key.pub` 的内容追加到服务器上对应用户的 `~/.ssh/authorized_keys`。

**方式 A：本机执行**（把 `user@你的服务器IP` 换成实际用户和 IP）：

```bash
ssh-copy-id -i deploy_key.pub user@你的服务器IP
```

若 `ssh-copy-id` 不可用，可用方式 B。

**方式 B：手动复制**

1. 本机执行：`cat deploy_key.pub`，复制整行内容。
2. SSH 登录服务器后执行：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "这里粘贴公钥整行" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

完成后，用私钥从本机登录应能免密进入：

```bash
ssh -i deploy_key user@你的服务器IP
```

确认无误后，**把私钥内容复制出来**，下一步放到 GitHub：

```bash
cat deploy_key
```

整段内容（含 `-----BEGIN ... KEY-----` 和 `-----END ... KEY-----`）都要，后面会粘贴到 GitHub Secrets。

---

## 第三步：在 GitHub 里填好密钥和服务器信息

在**前端项目对应的 GitHub 仓库**里：

1. 打开 **Settings → Secrets and variables → Actions**。
2. 点 **New repository secret**，按下面逐个添加：

| Name | 说明 | 示例 |
|------|------|------|
| `SSH_PRIVATE_KEY` | 上一步的**私钥**全文（含 BEGIN/END 两行） | 粘贴 `cat deploy_key` 的完整输出 |
| `SERVER_HOST` | 服务器 IP 或域名 | `123.45.67.89` 或 `app.example.com` |
| `SERVER_USER` | SSH 登录的用户名 | `root` 或 `deploy` |
| `SERVER_DIR` | 前端静态文件要放到的目录 | `/var/www/my-app` |

`SERVER_DIR` 若觉得麻烦，也可在 workflow 里写死，见下一步。

---

## 第四步：在仓库里加部署流水线

在项目**根目录**下创建 `.github/workflows/deploy-frontend.yml`（或把本目录下的 `deploy-frontend.example.yml` 复制过去并改名为 `deploy-frontend.yml`）。

### 4.1 使用本目录示例并改造成你的项目

下面是一份**可直接套用**的示例，需根据项目微调的地方用注释标出：

```yaml
name: 构建并部署前端

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 拉取代码
        uses: actions/checkout@v4

      - name: 安装 pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: 安装 Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: 安装依赖
        run: pnpm install --frozen-lockfile

      - name: 构建
        run: pnpm build
        # 若用 npm：改为 npm ci && npm run build
        # 若产物在 build/：下面 rsync 的 dist 改为 build

      - name: 配置 SSH 并同步到服务器
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
          SERVER_DIR: ${{ secrets.SERVER_DIR }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$SERVER_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true
          rsync -avz --delete -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no" \
            ./dist/ \
            "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/"
```

**你需要改或确认的：**

- **分支**：若主分支是 `master`，把 `branches: [main]` 改成 `branches: [master]`。
- **包管理**：若用 npm，去掉「安装 pnpm」步骤，并把「安装依赖」「构建」改为 `npm ci` 和 `npm run build`。
- **构建产物目录**：Vite 默认是 `dist/`，Create React App 是 `build/`。若在 `build/`，把最后一行的 `./dist/` 改成 `./build/`。
- **SERVER_DIR**：若没在 GitHub 设 `SERVER_DIR`，可把 `$SERVER_DIR` 换成固定路径，如 `/var/www/my-app`。

### 4.2 若使用 npm 的简化版

```yaml
name: 构建并部署前端

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build

      - name: 同步到服务器
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
          SERVER_DIR: ${{ secrets.SERVER_DIR }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$SERVER_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true
          rsync -avz --delete -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no" \
            ./build/ \
            "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/"
```

同样记得：产物在 `dist/` 就改 `./build/` 为 `./dist/`；`SERVER_DIR` 要在 Secrets 里配置或写死。

---

## 第五步：推代码触发发布

1. 把 `.github/workflows/deploy-frontend.yml` 提交并 push 到 `main`（或你配置的分支）。
2. 打开仓库 **Actions** 页，应看到「构建并部署前端」这条 workflow 在跑。
3. 等约 1～3 分钟，若全部绿色，说明**构建 + 同步到服务器**都成功了。

---

## 如何确认「发布成功」

- **Actions**：该次 run 所有 step 为绿色。
- **服务器上**：`ls /var/www/my-app`（或你的 `SERVER_DIR`）应能看到 `index.html` 及 js/css 等构建产物。
- **浏览器**：访问你配的域名或 `http://服务器IP`，应看到最新前端页面；再改代码 push 一次，刷新页面应变为新内容。

---

## 常见问题与排查

| 现象 | 可能原因 | 排查/处理 |
|------|----------|-----------|
| SSH 报 Permission denied | 私钥格式错误、公钥未写入服务器、用户错 | 检查 Secrets 里私钥完整且无多余空格；在服务器上确认 `~/.ssh/authorized_keys` 含对应公钥；`SERVER_USER` 与登录用户一致 |
| rsync 报 No such file or directory | 服务器上目录不存在或无权限 | 在服务器上执行 `mkdir -p $SERVER_DIR` 并 `chown` 给 `SERVER_USER` |
| 构建失败 | 依赖、Node 版本、脚本名不符 | 在 Actions 里看失败 step 的日志；本地跑一遍 `npm ci && npm run build`，确保命令与产物路径一致 |
| 页面 404 或白屏 | Nginx 未指到该目录、前端路由未配 try_files | 确认 Nginx `root` 为 `SERVER_DIR`，且存在 `try_files $uri $uri/ /index.html;` |
| 仍访问到旧页面 | 浏览器缓存、CDN 缓存 | 强刷或无痕打开；若用了 CDN，需在 CDN 侧刷新或缩短缓存 |

---

## 参考与延伸

- 本目录 [ci-cd.md](./ci-cd.md) — CI/CD 概念与最小流水线
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- 本目录 **deploy-frontend.example.yml** — 上述 workflow 的完整示例文件，复制到仓库 `.github/workflows/` 下即可按需修改使用
