/**
 * @pnpm/workspace.read-manifest 基础示例
 * 从当前目录读取 pnpm-workspace.yaml 并输出 packages / catalog / catalogs
 *
 * 安装：pnpm add @pnpm/workspace.read-manifest
 * 运行：在包含 pnpm-workspace.yaml 的 workspace 根目录执行
 *       node src/36_pnpm_workspace_read_manifest/1.base.js
 *
 * 注意：Node >= 18.12；若当前目录不是 workspace 根，请先 cd 到根目录或修改 root 变量
 */

import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest';

async function main() {
  // 传入 workspace 根目录（需包含 pnpm-workspace.yaml）
  const root = process.cwd();

  try {
    const manifest = await readWorkspaceManifest(root);

    console.log('packages:', manifest.packages);

    if (manifest.catalog && Object.keys(manifest.catalog).length > 0) {
      console.log('catalog:', manifest.catalog);
    }

    if (manifest.catalogs && Object.keys(manifest.catalogs).length > 0) {
      console.log('catalogs:', manifest.catalogs);
    }
  } catch (err) {
    console.error('读取 pnpm-workspace.yaml 失败（请确保在 workspace 根目录且存在该文件）:', err.message);
    process.exit(1);
  }
}

main();
