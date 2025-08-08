# 🎬 Video Fetch MCP

[![npm version](https://badge.fury.io/js/@pickstar-2002%2Fvideo-fetch-mcp.svg)](https://badge.fury.io/js/@pickstar-2002%2Fvideo-fetch-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.2-blue.svg)](https://www.typescriptlang.org/)

> 🚀 基于 MCP 协议的多平台视频下载服务端，支持 1000+ 视频平台

## ✨ 特性

- 🎯 **多平台支持**：基于 yt-dlp，支持 YouTube、哔哩哔哩、抖音、Twitter 等 1000+ 平台
- 🔄 **双模式运行**：支持 MCP 协议模式和 REST API 模式
- 📊 **实时进度跟踪**：提供下载进度、速度、剩余时间等实时信息
- 🎵 **多格式支持**：支持视频下载、音频提取、字幕下载
- 🛡️ **类型安全**：使用 TypeScript 开发，提供完整的类型定义
- 📝 **详细日志**：完整的操作日志记录和错误追踪

## 📦 安装

### 作为 MCP 服务器使用（推荐）

```bash
# 使用 @latest 标签获取最新版本（推荐）
npx @pickstar-2002/video-fetch-mcp@latest
```

### 全局安装

```bash
npm install -g @pickstar-2002/video-fetch-mcp@latest
```

### 本地安装

```bash
npm install @pickstar-2002/video-fetch-mcp@latest
```

## 🚀 快速开始

### MCP 协议模式

在你的 MCP 客户端配置文件中添加：

```json
{
  "mcpServers": {
    "video-fetch": {
      "command": "npx",
      "args": ["@pickstar-2002/video-fetch-mcp@latest"]
    }
  }
}
```

### REST API 模式

```bash
# 启动 REST API 服务器
npx @pickstar-2002/video-fetch-mcp@latest api

# 或者使用已安装的版本
video-fetch-mcp api
```

## 🔧 IDE 配置

### Cursor

在 `.cursor/mcp_config.json` 中添加：

```json
{
  "mcpServers": {
    "video-fetch": {
      "command": "npx",
      "args": ["@pickstar-2002/video-fetch-mcp@latest"]
    }
  }
}
```

### WindSurf

在 `.windsurf/mcp_config.json` 中添加：

```json
{
  "mcpServers": {
    "video-fetch": {
      "command": "npx",
      "args": ["@pickstar-2002/video-fetch-mcp@latest"]
    }
  }
}
```

### CodeBuddy

在 `.codebuddy/mcp_config.json` 中添加：

```json
{
  "mcpServers": {
    "video-fetch": {
      "command": "npx",
      "args": ["@pickstar-2002/video-fetch-mcp@latest"]
    }
  }
}
```

## 📖 使用方法

### MCP 工具

服务器提供以下 MCP 工具：

#### `get_video_info`
获取视频详细信息

```typescript
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

#### `download_video`
下载视频文件

```typescript
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "outputPath": "./downloads",
  "quality": "best",
  "extractAudio": false,
  "downloadSubtitles": true
}
```

#### `get_task_status`
查询下载任务状态

```typescript
{
  "taskId": "uuid-task-id"
}
```

#### `cancel_task`
取消下载任务

```typescript
{
  "taskId": "uuid-task-id"
}
```

### REST API

#### 获取视频信息
```bash
curl -X POST http://localhost:8080/api/v1/video/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

#### 开始下载
```bash
curl -X POST http://localhost:8080/api/v1/video/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "outputPath": "./downloads",
    "quality": "best"
  }'
```

#### 查看任务状态
```bash
curl http://localhost:8080/api/v1/task/{taskId}
```

## 🌐 支持的平台

- 🎥 **YouTube** (youtube.com, youtu.be)
- 📺 **哔哩哔哩** (bilibili.com)
- 🎵 **抖音** (douyin.com)
- 🐦 **Twitter/X** (twitter.com, x.com)
- 📷 **Instagram** (instagram.com)
- 📘 **Facebook** (facebook.com)
- 🎬 **Vimeo** (vimeo.com)
- 🎮 **Twitch** (twitch.tv)
- 📱 **TikTok** (tiktok.com)
- 🔴 **Reddit** (reddit.com)
- 📺 **Dailymotion** (dailymotion.com)
- **...以及 1000+ 其他平台**

## ⚙️ 配置选项

### 环境变量

```bash
# 服务端口（默认：8080）
PORT=8080

# 日志级别（默认：info）
LOG_LEVEL=info

# yt-dlp 超时时间（默认：300000ms）
YTDLP_TIMEOUT=300000
```

### 下载选项

- `quality`: 视频质量 (`best`, `worst`, `bestvideo`, `bestaudio`)
- `outputTemplate`: 文件名模板 (默认: `%(title)s.%(ext)s`)
- `extractAudio`: 是否提取音频
- `audioFormat`: 音频格式 (`mp3`, `aac`, `wav`, `flac`)
- `downloadSubtitles`: 是否下载字幕
- `subtitleLangs`: 字幕语言列表

## 🔧 疑难解答

### 常见问题

#### ❌ Connection closed 错误

这通常是由于 `npx` 缓存问题导致的。请按以下顺序尝试解决：

**1. 确认使用 @latest 标签（首选方案）**
```bash
npx @pickstar-2002/video-fetch-mcp@latest
```

**2. 锁定到特定版本（备用方案）**
```bash
npx @pickstar-2002/video-fetch-mcp@1.0.0
```

**3. 清理 npx 缓存（终极方案）**
```bash
# 清理 npx 缓存
npx clear-npx-cache

# 或者手动清理
rm -rf ~/.npm/_npx
# Windows 用户使用：rmdir /s %USERPROFILE%\.npm\_npx

# 然后重新运行
npx @pickstar-2002/video-fetch-mcp@latest
```

#### ❌ yt-dlp 未找到

确保系统已安装 Python 和 yt-dlp：

```bash
# 安装 yt-dlp
pip install yt-dlp

# 或使用 conda
conda install -c conda-forge yt-dlp
```

#### ❌ 端口被占用

修改端口配置：

```bash
PORT=8081 npx @pickstar-2002/video-fetch-mcp@latest api
```

#### ❌ 权限错误

确保输出目录有写入权限：

```bash
mkdir -p ./downloads
chmod 755 ./downloads
```

### 调试模式

启用详细日志：

```bash
LOG_LEVEL=debug npx @pickstar-2002/video-fetch-mcp@latest
```

## 🛠️ 开发

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/pickstar-2002/video-fetch-mcp.git
cd video-fetch-mcp

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 启动
npm start
```

### 项目结构

```
video-fetch-mcp/
├── src/
│   ├── services/
│   │   ├── mcp-server-fixed.ts    # MCP 服务器实现
│   │   ├── rest-api-server.ts     # REST API 服务器
│   │   └── ytdlp-service.ts       # yt-dlp 核心服务
│   ├── utils/
│   │   └── logger.ts              # 日志工具
│   ├── types.ts                   # 类型定义
│   ├── config.ts                  # 配置文件
│   └── index.ts                   # 入口文件
├── dist/                          # 编译输出
└── downloads/                     # 默认下载目录
```

## 📄 API 文档

### REST API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/v1/health` | 健康检查 |
| POST | `/api/v1/video/info` | 获取视频信息 |
| POST | `/api/v1/video/download` | 开始下载 |
| GET | `/api/v1/task/:taskId` | 查看任务状态 |
| DELETE | `/api/v1/task/:taskId` | 取消任务 |
| GET | `/api/v1/tasks` | 列出所有任务 |
| GET | `/api/v1/platforms` | 获取支持的平台 |

### MCP 工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `get_video_info` | 获取视频信息 | `url` |
| `download_video` | 下载视频 | `url`, `outputPath`, `quality`, etc. |
| `get_task_status` | 查看任务状态 | `taskId` |
| `cancel_task` | 取消任务 | `taskId` |
| `list_tasks` | 列出所有任务 | - |

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0
- 🎉 初始版本发布
- ✅ 支持 MCP 协议和 REST API 双模式
- ✅ 集成 yt-dlp 支持 1000+ 平台
- ✅ 实时进度跟踪和任务管理
- ✅ TypeScript 类型安全

## 📜 许可证

本项目采用 [MIT](https://opensource.org/licenses/MIT) 许可证。

## 📞 联系方式

如有问题或建议，欢迎联系：

**微信**: pickstar_loveXX

---

⭐ 如果这个项目对你有帮助，请给个 Star！