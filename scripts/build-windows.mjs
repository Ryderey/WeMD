#!/usr/bin/env node
/**
 * 一键构建 WeMD Windows 安装包
 *
 * 用法:
 *   node scripts/build-windows.mjs
 *   node scripts/build-windows.mjs --zip
 *   pnpm run build:windows
 *   pnpm run build:windows -- --zip
 *
 * 选项:
 *   --zip, -z   额外生成 zip 便携版压缩包（默认仅生成 NSIS .exe 安装包）
 *
 * 默认不进行代码签名。如需签名，请自行设置 electron-builder 签名相关的环境变量。
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'apps', 'electron');

const args = process.argv.slice(2);
const includeZip = args.includes('--zip') || args.includes('-z') || args.includes('--include-zip');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`usage: node scripts/build-windows.mjs [options]

options:
  --zip, -z    额外生成 zip 便携版压缩包（默认仅生成 .exe 安装包）
  --help, -h   显示帮助信息

environment:
  默认设置 CSC_IDENTITY_AUTO_DISCOVERY=false，不进行代码签名。
  如需签名，请自行导出 CSC_LINK / WIN_CSC_LINK 等环境变量后再运行。`);
  process.exit(0);
}

// 默认不需要签名
if (!process.env.CSC_IDENTITY_AUTO_DISCOVERY) {
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
}

function run(label, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${label}: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
      env: { ...process.env, ...options.env },
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`命令退出码非 0: ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  console.log('🔨 步骤 1/2：构建前端、核心库与 Electron 主进程...');
  await run('构建项目', 'pnpm', ['run', 'build'], { cwd: rootDir });

  console.log('\n📦 步骤 2/2：使用 electron-builder 打包 Windows 应用...');
  const targets = includeZip ? ['nsis', 'zip'] : ['nsis'];
  await run(
    '打包 Windows',
    'pnpm',
    ['--filter', 'wemd-electron', 'exec', 'electron-builder', '--win', ...targets, '-c', 'electron-builder.json'],
    { cwd: electronDir }
  );

  const releaseDir = path.join(electronDir, 'release');
  console.log('\n✅ Windows 包构建完成');
  console.log(`   输出目录: ${releaseDir}`);
  console.log(`   安装包:   ${path.join(releaseDir, 'WeMD Setup *.exe')}`);
  if (includeZip) {
    console.log(`   便携包:   ${path.join(releaseDir, 'WeMD-*-win.zip')}`);
  } else {
    console.log('   未生成 zip 便携包，如需生成请加上 --zip 参数');
  }
}

main().catch((err) => {
  console.error('\n❌ 构建失败:', err.message);
  process.exit(1);
});
