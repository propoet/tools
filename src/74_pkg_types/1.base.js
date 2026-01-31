/**
 * pkg-types 基础示例：readPackageJSON、resolvePackageJSON、findWorkspaceDir
 *
 * 运行：node src/74_pkg_types/1.base.js
 * 需先：pnpm add pkg-types
 */

import {
  readPackageJSON,
  resolvePackageJSON,
  findWorkspaceDir,
  resolveLockFile,
} from "pkg-types";

// 1. 从当前工作目录向上找 package.json 并读取
const pkg = await readPackageJSON();
console.log("readPackageJSON():", pkg?.name, pkg?.version);

// 2. 只解析 package.json 路径
const pkgPath = await resolvePackageJSON();
console.log("resolvePackageJSON():", pkgPath);

// 3. 找 workspace 根目录（若有）
try {
  const workspaceDir = await findWorkspaceDir(process.cwd());
  console.log("findWorkspaceDir():", workspaceDir);
} catch (e) {
  console.log("findWorkspaceDir(): 非 workspace 或未找到");
}

// 4. 找 lock 文件路径
try {
  const lockPath = await resolveLockFile(process.cwd());
  console.log("resolveLockFile():", lockPath);
} catch (e) {
  console.log("resolveLockFile(): 未找到 lock 文件");
}
