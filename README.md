<p align="center">
  <img src="apps/web/public/favicon-dark.svg" width="80" height="80" alt="WeMD Logo" />
</p>

<h1 align="center">WeMD</h1>

<p align="center">
  <strong>更优雅的 Markdown 公众号排版工具</strong>
</p>

<p align="center">
  告别复杂工具。Markdown 写作，一键复制到公众号。<br>
  专为公众号创作者设计的<b>本地优先</b>编辑器。
</p>

<p align="center">
  <a href="https://wemd.app">🌐 官网</a> •
  <a href="https://edit.wemd.app">✏️ 在线使用</a> •
  <a href="https://wemd.app/docs">📖 文档</a> •
  <a href="https://github.com/tenngoxars/WeMD/releases">📦 下载桌面版</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-4CAF50?style=for-the-badge" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/pnpm-9-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

---

## ✨ 特性

|     | 功能              | 说明                                                   |
| --- | ----------------- | ------------------------------------------------------ |
| 📝  | **Markdown 语法** | 支持 GFM、表格、代码高亮、数学公式                     |
| 🎨  | **主题切换**      | 内置十余款精美主题，支持可视化设计器或自定义 CSS       |
| 📋  | **一键复制**      | 完美兼容微信公众号，所见即所得                         |
| 🖼️  | **多图床支持**    | 官方图床 / 七牛云 / 阿里云 / 腾讯云 / S3 兼容          |
| 💾  | **本地优先**      | 数据存储在本地，无需登录，隐私安全                     |
| 📱  | **跨平台**        | Web 端 + 桌面端（macOS / Windows / Linux）             |
| 🌙  | **界面风格**      | 亮色 / 深色 双模式可选                                 |
| 👁️  | **深色模式预览**  | 预览微信深色模式效果，还原度达 98%+                    |
| 🔍  | **高级搜索**      | 支持正则匹配、全词匹配、批量替换                       |
| 🎞️  | **滑动图组**      | 支持水平滑动的多图展示组件，丰富视觉体验               |
| 📊  | **Mermaid 图表**  | 内置流程图、时序图、甘特图等多种图表，自动适配主题配色 |
| 🏷️  | **文件重命名**    | 侧边栏重命名文件/文件夹时同步修改实际磁盘文件名        |
| 🧹  | **稳定性优化**    | 修复搜索面板监听累积、表格渲染、复制渲染等边界问题     |

---

## 💡 技术亮点

### 微信深色模式预览算法

WeMD 内置了一套**色彩语义保全算法**，可在编辑器中预览微信公众号深色模式下的实际效果，还原度达 **98% 以上**。

> 该算法基于微信官方开源的 [wechatjs/mp-darkmode](https://github.com/wechatjs/mp-darkmode) 核心算法迁移并优化，旨在保证高性能 CSS 转换的同时提供最接近官方的渲染效果。

- 智能识别不同元素类型，分别优化
- HSL 色彩空间计算，确保视觉一致性

这（可能）是目前市面上除官方外唯一针对微信公众号深色模式预览的开源解决方案。

👉 **[查看算法详细原理解析](https://wemd.app/docs/reference/dark-mode-algorithm.html)** | **[查看算法源码](packages/core/src/wechatDarkMode.ts)**

---

## 🚀 快速开始

### 在线使用

直接访问 **[edit.wemd.app](https://edit.wemd.app)** 即可开始写作，无需安装，同样支持纯本地存储。

### 桌面版下载

前往 [Releases](https://github.com/tenngoxars/WeMD/releases) 下载对应平台安装包：

- **macOS**: `.dmg`（Intel 版）/ `-arm64.dmg`（Apple Silicon 版）
- **Windows**: `.exe`
- **Linux**: `.AppImage`

> ⚠️ **macOS 用户注意**：首次打开时如提示"应用已损坏"，请在终端执行：
>
> ```bash
> xattr -cr /Applications/WeMD.app
> ```
>
> ⚠️ **Windows 用户注意**：如 SmartScreen 提示"未知发布者"，点击「更多信息」→「仍要运行」
>
> ⚠️ **Linux 用户注意**：运行前需设置可执行权限：`chmod +x WeMD.AppImage`

### Docker 部署

```bash
docker compose pull
docker compose up -d
```

访问 `http://localhost:8080` 即可使用。

默认会拉取 `ghcr.io/tenngoxars/wemd-web:latest`。  
如需指定版本镜像，可覆盖环境变量：

```bash
WEMD_IMAGE=ghcr.io/tenngoxars/wemd-web:<版本号> docker compose up -d
```

---

## 🛠️ 本地开发

### 环境要求

- Node.js ≥ 18
- pnpm ≥ 9（推荐 `corepack enable pnpm`）

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动 Web 开发服务器
pnpm dev:web

# 启动桌面端（需先启动 Web）
pnpm dev:desktop
```

### 构建

```bash
# 构建 Web
pnpm --filter @wemd/web build

# 构建桌面应用
pnpm --filter wemd-electron run build:mac  # macOS
pnpm --filter wemd-electron run build:win  # Windows
```

#### Windows 一键打包（推荐）

项目提供了一键打包脚本，会自动完成 Web / Core / Electron 构建并生成 Windows 安装包，默认不进行代码签名：

```bash
# 仅生成 NSIS 安装包（.exe）
pnpm run build:windows

# 同时生成 zip 便携版压缩包
pnpm run build:windows -- --zip
```

脚本等价于先执行 `pnpm run build`，再调用 `electron-builder --win nsis`；加 `--zip` 时额外生成 `zip` 目标。产物位于 `apps/electron/release/`：

- `WeMD Setup <版本号>.exe`：安装包
- `WeMD-<版本号>-win.zip`：免安装压缩包（仅 `--zip` 时生成）
- `win-unpacked/`：解包后的应用目录

如果 Windows 打包时下载 Electron 运行时失败，可在 PowerShell 中临时使用镜像源后重试：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
pnpm run build:windows
```

---

## 📅 最近更新

### v1.2.10

- 🎨 **主题设计器增强**：修复标题样式预设（左侧竖线、底部下划线、底部高亮等）在长标题换行时的样式错乱问题。
- 🪟 **Windows 打包优化**：新增一键打包脚本 `pnpm run build:windows`，支持生成 `.exe` 安装包和 zip 便携版。
- 🖥️ **macOS UI 修复**：修复 Electron 桌面端红绿灯（关闭/最小化/最大化按钮）渲染失败的问题。
- 📊 **Mermaid 渲染修复**：修复 Mermaid 图表在公众号复制场景下的渲染异常。
- 🔍 **搜索体验优化**：修复搜索面板监听累积问题，避免多次打开后的性能衰减。
- 🏷️ **文件命名一致性**：新建文章/文件夹时保持命名一致性；侧边栏重命名时同步修改实际文件名。
- 🧹 **稳定性改进**：改进 HTML 复制、图片床弹窗滚动、Vite 预加载 chunk 恢复、表格 TS 类型兼容等细节。

### v1.2.9

- 🔗 **复制渲染链路统一**：统一复制与预览渲染链路，收敛 mac bar 行为，减少公众号粘贴后的样式差异。
- 🧪 **回归测试补齐**：补充 mac bar 与复制链路的回归用例，提升核心路径的稳定性。
- 💾 **localStorage 兼容**：兼容非标准 localStorage 运行环境，避免特定浏览器/容器下白屏。
- 📏 **分隔线修复**：修复公众号复制时 `hr` 分隔线页边距丢失的问题。

---

## 📁 项目结构

```
WeMD/
├── apps/
│   ├── web/        # React + Vite 前端
│   ├── electron/   # Electron 桌面端
│   └── server/     # NestJS 图片上传服务
├── packages/
│   └── core/       # Markdown 解析 / 主题 / 工具
├── templates/      # 主题 CSS 模板
└── turbo.json      # Turborepo 配置
```

---

## 📸 截图

![screenshot](.github/assets/screenshot.png)

---

## 💬 反馈

如有问题或建议，欢迎提交 [Issue](https://github.com/tenngoxars/WeMD/issues)。

---

## 🤝 致谢

本项目的微信深色模式预览算法深度参考了微信官方开源的 [wechatjs/mp-darkmode](https://github.com/wechatjs/mp-darkmode) 核心逻辑。感谢微信团队为开发者提供的优秀解决方案！

---

## 📄 License

[MIT](LICENSE) © WeMD Team
