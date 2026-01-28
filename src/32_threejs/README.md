# 32_threejs · 3D 立体仓库布局图

## 说明

本目录包含基于 **Three.js** 的 3D 立体仓库布局示例，用于展示货架、通道与**库位标识**。

## 文件

- **warehouse.html** — 立体仓库布局图
  - 四个货架（A/B/C/D）分布在仓库四角，中间为通道
  - 每个货架：3 列 × 2 深 × 3 层 = 18 个库位，库位编号格式：`排-列-深-层`（如 `A-01-02-03`）
  - 支持鼠标拖动旋转、滚轮缩放
  - 库位标签随视角投影到屏幕，始终指向对应库位

## 运行方式

用浏览器直接打开 `warehouse.html` 即可（需联网以加载 Three.js CDN）。

```bash
# 若本机有 Python
python -m http.server 8080
# 然后访问 http://localhost:8080/src/32_threejs/warehouse.html
```

或使用 VS Code Live Server 等工具打开该 HTML。

## 依赖

- Three.js（通过 unpkg CDN 加载，无需本地安装）
