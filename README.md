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

桌面端启动时会自动拉起本地图床 Nest 服务（监听 14000 端口），无需手动执行
`pnpm --filter @wemd/server dev`；若 14000 端口已被占用，则直接复用现有服务。
退出应用时服务会随之关闭。单独调试服务端时仍可手动启动，此时默认监听 4000
端口。

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

一键打包脚本会完成 web、core、Electron 主进程与 Nest 图床服务的完整构建，并把
Nest 服务及其生产依赖部署进安装包的资源目录，应用启动时自动拉起该服务。脚本会
同时更新 `apps/electron/package.json`、`apps/web/package.json` 与
`apps/server/package.json` 的 patch 版本号，确保安装包文件名与 UI 展示版本一致。

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

## 内嵌图床服务

桌面端（开发模式与打包版）启动时会自动拉起内嵌的 Nest 图床服务，固定监听
14000 端口；若端口已被占用则直接复用现有服务，退出应用时自动关闭。请在 WeMD
“图床设置”中把服务端地址配置为 `http://localhost:14000/api`。

打包版的微信图床凭据（AppID/AppSecret/上传密钥等）放在用户数据目录的
`server.env` 文件中，即 `%APPDATA%\WeMD\server.env`，格式为每行 `KEY=VALUE`，
字段与 `apps/server/.env.example` 一致；文件缺失时应用照常启动，仅微信图床相关
接口不可用。开发模式的凭据仍由 `apps/server/.env` 提供。

服务端接口与鉴权说明详见 `apps/server/README.md`。其中“导出图片”功能遇到
跨域图床（如 `img.wemd.app` 不返回 CORS 头）时，会自动回退到 Nest 的
`GET /api/proxy/image` 公开代理接口取图，无需额外配置；服务不可达时导出图
中对应图片留白并弹出提示。

## 目录结构

```text
apps/electron/
├── assets/                # 平台图标
├── src/                   # Electron 主进程、preload、更新逻辑
├── dist/                  # TypeScript 编译产物
├── resources/             # 打包时生成的内嵌 Nest 服务产物（不入 Git）
├── release/               # Electron Builder 打包产物
├── package.json           # 桌面端脚本和依赖
└── electron-builder.json  # 打包配置
```

## 注意事项

- 生产打包前必须先构建 `apps/web/dist`。
- Windows 安装包未签名时，系统可能提示“未知发布者”。
- 修改图标时，请同步维护 `apps/electron/assets/` 下对应平台的图标文件。
