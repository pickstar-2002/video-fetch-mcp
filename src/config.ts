/**
 * 应用配置文件
 */

export const config = {
  /** 服务端口 */
  port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
  
  /** MCP 服务器配置 */
  mcp: {
    /** 服务器名称 */
    name: 'video-downloader',
    /** 服务器版本 */
    version: '1.0.0',
    /** 服务器描述 */
    description: '基于 MCP 协议的多平台视频下载服务',
  },

  /** yt-dlp 配置 */
  ytDlp: {
    /** yt-dlp 可执行文件路径 */
    executablePath: 'python',
    /** 默认下载选项 */
    defaultOptions: [
      '--no-warnings',
      '--extract-flat',
      '--write-info-json',
      '--write-thumbnail',
      '--embed-metadata',
      '--add-metadata',
    ],
    /** 超时时间（毫秒） */
    timeout: 300000, // 5分钟
  },

  /** 下载配置 */
  download: {
    /** 默认输出目录 */
    defaultOutputDir: './downloads',
    /** 最大并发下载数 */
    maxConcurrentDownloads: 3,
    /** 任务保留时间（毫秒） */
    taskRetentionTime: 24 * 60 * 60 * 1000, // 24小时
    /** 支持的视频格式 */
    supportedFormats: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv'],
    /** 支持的音频格式 */
    supportedAudioFormats: ['mp3', 'aac', 'wav', 'flac', 'ogg'],
  },

  /** 日志配置 */
  logging: {
    /** 日志级别 */
    level: process.env.LOG_LEVEL || 'info',
    /** 日志文件路径 */
    file: './logs/app.log',
    /** 是否输出到控制台 */
    console: true,
    /** 日志格式 */
    format: 'combined',
  },

  /** API 配置 */
  api: {
    /** API 前缀 */
    prefix: '/api/v1',
    /** 请求体大小限制 */
    bodyLimit: '10mb',
    /** 是否启用 CORS */
    enableCors: true,
    /** 是否启用安全头 */
    enableSecurity: true,
  },

  /** 支持的视频平台 */
  supportedPlatforms: [
    'youtube.com',
    'youtu.be',
    'bilibili.com',
    'douyin.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'facebook.com',
    'vimeo.com',
    'dailymotion.com',
    'twitch.tv',
    'reddit.com',
  ],
};

export default config;