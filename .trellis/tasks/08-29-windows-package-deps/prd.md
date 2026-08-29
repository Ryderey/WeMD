# 修复 Windows 打包依赖并缩减安装包

## Goal

修复 Windows 构建期间嵌入 Nest 服务产生的弃用依赖告警，并在不影响内置服务与图床功能的前提下减少发布产物体积。

## Requirements

- 将服务端 COS SDK 升级至不再引入 `request`、`har-validator` 和 `uuid@3` 的受支持版本；保留 COS 上传行为。
- Windows 打包脚本只部署 Nest 运行时所需的生产依赖和构建产物，不携带服务端源码、测试、开发配置或包管理元数据。
- 保持现有 Windows NSIS 构建入口和可选 ZIP 产物兼容。
- 记录嵌入服务端目录与 Windows 安装包的构建前后大小，报告实际节省值；不为追求体积移除用户可用功能。

## Acceptance Criteria

- [x] `pnpm --filter @wemd/server deploy --prod` 不再报告由旧 COS SDK 引入的 `request`、`har-validator`、`uuid@3` 或其相关弃用链。
- [x] 部署目录仅包含启动内置服务所需的 `dist/`、生产依赖和运行时配置样例。
- [x] COS 上传的单元测试和服务端构建通过。
- [x] `pnpm run build:windows -- --no-bump` 能完成，并输出 NSIS 安装包。
- [x] 安装包尺寸相较当前基线不增大，并记录可量化的节省。

## Constraints

- 保留现有未提交的三个 package.json 版本号修改，不能将其包含进本任务提交。
- 不引入新的打包器或服务端代理层；优先使用现有 pnpm deploy 和 electron-builder。
- 不处理 Docker 镜像或 Docker 构建路径。
