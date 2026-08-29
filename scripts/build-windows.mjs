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
 *   --zip, -z    额外生成 zip 便携版压缩包（默认仅生成 NSIS .exe 安装包）
 *   --no-bump    打包前不自动递增 patch 版本号
 *
 * 默认不进行代码签名。如需签名，请自行设置 electron-builder 签名相关的环境变量。
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'apps', 'electron');
const webDir = path.join(rootDir, 'apps', 'web');
const serverDir = path.join(rootDir, 'apps', 'server');
const serverDeployDir = path.join(electronDir, 'resources', 'server');

const args = process.argv.slice(2);
const includeZip = args.includes('--zip') || args.includes('-z') || args.includes('--include-zip');
const noBump = args.includes('--no-bump');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`usage: node scripts/build-windows.mjs [options]

options:
  --zip, -z    额外生成 zip 便携版压缩包（默认仅生成 .exe 安装包）
  --no-bump    打包前不自动递增 patch 版本号
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

function bumpPatch(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) {
    throw new Error(`无法解析版本号: ${version}`);
  }
  const [, major, minor, patch, rest] = match;
  return `${major}.${minor}.${Number(patch) + 1}${rest}`;
}

function bumpPackageJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const pkg = JSON.parse(raw);
  const oldVersion = pkg.version;
  const newVersion = bumpPatch(oldVersion);
  pkg.version = newVersion;
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
  return { name: pkg.name, oldVersion, newVersion };
}

function trimBundledServer() {
  const runtimeEntries = new Set(['dist', 'node_modules']);
  for (const entry of fs.readdirSync(serverDeployDir)) {
    if (!runtimeEntries.has(entry)) {
      fs.rmSync(path.join(serverDeployDir, entry), { recursive: true, force: true });
    }
  }
}

async function main() {
  if (!noBump) {
    console.log('🔢 自动递增 patch 版本号...');
    const results = [
      bumpPackageJson(path.join(electronDir, 'package.json')),
      bumpPackageJson(path.join(webDir, 'package.json')),
      bumpPackageJson(path.join(serverDir, 'package.json')),
    ];
    for (const { name, oldVersion, newVersion } of results) {
      console.log(`   ${name}: ${oldVersion} → ${newVersion}`);
    }
  }

  console.log('\n🔨 步骤 1/3：构建前端、核心库、Electron 主进程与 Nest 服务...');
  await run('构建项目', 'pnpm', ['run', 'build'], { cwd: rootDir });

  console.log('\n🚚 步骤 2/3：部署 Nest 服务到 Electron 资源目录...');
  fs.rmSync(serverDeployDir, { recursive: true, force: true });
  await run(
    '部署服务端',
    'pnpm',
    ['--filter', '@wemd/server', 'deploy', '--prod', serverDeployDir],
    { cwd: rootDir }
  );
  // pnpm deploy 不一定会带上构建产物，缺失时从 apps/server/dist 补齐
  if (!fs.existsSync(path.join(serverDeployDir, 'dist', 'main.js'))) {
    fs.cpSync(path.join(serverDir, 'dist'), path.join(serverDeployDir, 'dist'), { recursive: true });
  }
  const deployEntry = path.join(serverDeployDir, 'dist', 'main.js');
  const deployNestCore = path.join(serverDeployDir, 'node_modules', '@nestjs', 'core');
  if (!fs.existsSync(deployEntry)) {
    throw new Error(`服务端部署产物缺失: ${deployEntry}`);
  }
  if (!fs.existsSync(deployNestCore)) {
    throw new Error(`服务端依赖部署缺失: ${deployNestCore}`);
  }
  trimBundledServer();

  console.log('\n📦 步骤 3/3：使用 electron-builder 打包 Windows 应用...');
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
  console.log('   提示:     打包版使用微信图床需在 %APPDATA%\\WeMD\\server.env 配置凭据，');
  console.log('             字段格式同 apps/server/.env.example，详见 apps/server/README.md');
}

main().catch((err) => {
  console.error('\n❌ 构建失败:', err.message);
  process.exit(1);
});
