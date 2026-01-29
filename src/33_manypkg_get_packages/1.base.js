/**
 * @manypkg/get-packages 基础示例
 * 从当前目录（或指定目录）向上查找 monorepo 根，并列出所有包
 *
 * 运行：node src/33_manypkg_get_packages/1.base.js
 * 或在 monorepo 子目录：node src/33_manypkg_get_packages/1.base.js
 */

import { getPackages, getPackagesSync, PackageJsonMissingNameError } from '@manypkg/get-packages';

async function main() {
  const cwd = process.cwd();

  // ---------- 异步 ----------
  console.log('=== getPackages (async) ===');
  try {
    const { tool, packages, rootPackage, rootDir } = await getPackages(cwd);
    console.log('工具类型:', tool.type);
    console.log('根目录:', rootDir);
    console.log('包数量:', packages.length);
    if (rootPackage) {
      console.log('根包:', rootPackage.packageJson.name);
    }
    console.log('\n包列表:');
    packages.forEach((pkg) => {
      const { name, version } = pkg.packageJson;
      console.log(`  - ${name}@${version || '(无 version)'}  [${pkg.relativeDir}]`);
    });
  } catch (err) {
    if (err instanceof PackageJsonMissingNameError) {
      console.error('以下 package.json 缺少 name 字段:', err.directories);
    } else {
      console.error(err);
    }
    process.exit(1);
  }

  // ---------- 同步 ----------
  console.log('\n=== getPackagesSync ===');
  try {
    const { tool, packages, rootDir } = getPackagesSync(cwd);
    console.log('工具类型:', tool.type);
    console.log('根目录:', rootDir);
    console.log('包数量:', packages.length);
  } catch (err) {
    if (err instanceof PackageJsonMissingNameError) {
      console.error('缺少 name:', err.directories);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
