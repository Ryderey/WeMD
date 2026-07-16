# WeMD Electron App

WeMD 桌面端基于 Electron，复用 `apps/web` 的前端产物。生产打包时，Electron Builder 会把 `apps/web/dist` 复制到应用资源目录。

## 开发

在项目根目录安装依赖：

```bash
pnpm install
```

启动 Web 开发服务器：

```bash
pnpm dev:web
```

另开一个终端启动桌面端：

```bash
pnpm dev:desktop
```

开发模式下，Electron 会加载 `http://localhost:5173`。

## 生产构建

先构建 Web：

```bash
pnpm --filter @wemd/web build
```

再按目标平台打包桌面端：

```bash
pnpm --filter wemd-electron build:mac
pnpm --filter wemd-electron build:win
pnpm --filter wemd-electron build:linux
```

也可以使用项目根目录的一键打包脚本（推荐 Windows 使用）：

```bash
# 仅生成 NSIS 安装包（.exe），并自动递增 patch 版本号
pnpm run build:windows

# 同时生成 zip 便携版压缩包
pnpm run build:windows -- --zip

# 跳过自动版本递增
pnpm run build:windows -- --no-bump
```

一键打包脚本会同时更新 `apps/electron/package.json` 和 `apps/web/package.json` 的 patch 版本号，确保安装包文件名与 UI 展示版本一致。

打包产物输出到 `apps/electron/release/`。

### Windows 产物

Windows 打包会生成：

- `WeMD Setup <版本号>.exe`：NSIS 安装包
- `WeMD-<版本号>-win.zip`：免安装压缩包
- `win-unpacked/`：解包后的应用目录，便于本地检查

如果下载 Electron 或 NSIS 依赖时遇到 GitHub 证书或网络问题，可在 PowerShell 中临时切换镜像源：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
pnpm --filter wemd-electron build:win
```

## 目录结构

```text
apps/electron/
├── assets/                # 平台图标
├── src/                   # Electron 主进程、preload、更新逻辑
├── dist/                  # TypeScript 编译产物
├── release/               # Electron Builder 打包产物
├── package.json           # 桌面端脚本和依赖
└── electron-builder.json  # 打包配置
```

## 注意事项

- 生产打包前必须先构建 `apps/web/dist`。
- Windows 安装包未签名时，系统可能提示“未知发布者”。
- 修改图标时，请同步维护 `apps/electron/assets/` 下对应平台的图标文件。
