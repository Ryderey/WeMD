# WeMD Electron App

## 打包

### 前置条件

打包前需先构建前端和核心库：

```bash
# 在项目根目录安装依赖
pnpm install

# 一键构建所有子包（web + core + electron）
pnpm run build
```

### 各平台打包

```bash
# Windows（NSIS 安装包 + zip 便携版）
pnpm --filter wemd-electron run build:win

# macOS（DMG + zip）
pnpm --filter wemd-electron run build:mac

# Linux（AppImage + deb）
pnpm --filter wemd-electron run build:linux
```

### Windows 一键打包脚本（推荐）

项目根目录提供了更便捷的打包脚本，会自动递增 patch 版本号：

```bash
# 仅生成 NSIS 安装包（.exe），并自动 bump 版本号
pnpm run build:windows

# 同时生成 zip 便携版
pnpm run build:windows -- --zip

# 跳过自动版本递增
pnpm run build:windows -- --no-bump
```

### 版本号

打包版本号读取自 `apps/electron/package.json` 的 `version` 字段。如需修改版本，直接编辑该文件即可。

一键打包脚本（`pnpm run build:windows`）会自动递增 patch 版本号，同时更新 `apps/electron/package.json` 和 `apps/web/package.json`。

### 产物位置

打包产物输出到 `apps/electron/release/`：

- `WeMD Setup <版本号>.exe` — NSIS 安装包
- `WeMD-<版本号>-win.zip` — 免安装便携版（需 `--zip` 参数）
- `win-unpacked/` — 解包目录，方便本地验证

### 镜像加速

下载 Electron / NSIS 依赖遇到网络问题时，可切换镜像源：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
pnpm --filter wemd-electron run build:win
```

---

## 调试

### 开发模式启动

开发模式下 Electron 加载 `http://localhost:5173`（Vite dev server），支持热更新：

```bash
# 终端 1：启动 Web 开发服务器
pnpm dev:web

# 终端 2：启动 Electron（等待 Web 就绪后自动打开）
pnpm dev:desktop
```

也可以手动分别启动：

```bash
# 终端 1
pnpm dev:web

# 终端 2
pnpm dev:electron
```

### 打开开发者工具

应用启动后，通过菜单栏 **查看 → 开发者工具** 打开 Chrome DevTools，即可调试渲染进程（前端代码）。

快捷键：`Ctrl+Shift+I`（Windows/Linux）或 `Cmd+Option+I`（macOS）。

### 调试主进程

使用 `--inspect` 参数启动 Electron 以启用 Node.js 调试器：

```bash
# 先编译 TypeScript
pnpm --filter wemd-electron run build

# 以调试模式启动，监听 9229 端口
electron --inspect=9229 .
```

然后在 Chrome 中打开 `chrome://inspect`，点击 "Open dedicated DevTools for Node" 即可断点调试主进程代码。

也可以用 VS Code 的调试配置，在 `.vscode/launch.json` 中添加：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/apps/electron",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": ["."],
      "env": {
        "ELECTRON_START_URL": "http://localhost:5173"
      }
    }
  ]
}
```

### 调试渲染进程

在开发模式下，渲染进程就是 Vite 的 Web 页面，可以直接：

1. 在 Chrome DevTools 的 Sources 面板设置断点
2. 使用 React DevTools 浏览器扩展检查组件状态
3. 在 Console 中访问 `window.electron` 检查 preload 暴露的 API

### 调试生产构建

如果需要在生产模式下调试（使用 `file://` 加载打包后的静态文件），可以直接运行打包产物：

```bash
# 构建后，解包目录可直接运行
cd apps/electron/release/win-unpacked
./WeMD.exe
```

仍然可以通过菜单栏打开 DevTools 进行调试。
