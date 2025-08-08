/**
 * 视频下载服务的类型定义
 */

export interface VideoDownloadRequest {
  /** 视频链接 */
  url: string;
  /** 本地保存路径 */
  outputPath: string;
  /** 视频质量选项 */
  quality?: 'best' | 'worst' | 'bestvideo' | 'bestaudio' | string;
  /** 输出文件名模板 */
  outputTemplate?: string;
  /** 是否提取音频 */
  extractAudio?: boolean;
  /** 音频格式 */
  audioFormat?: 'mp3' | 'aac' | 'wav' | 'flac';
  /** 是否下载字幕 */
  downloadSubtitles?: boolean;
  /** 字幕语言 */
  subtitleLangs?: string[];
}

export interface VideoDownloadResponse {
  /** 任务ID */
  taskId: string;
  /** 下载状态 */
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  /** 进度百分比 */
  progress?: number;
  /** 下载速度 */
  speed?: string;
  /** 预计剩余时间 */
  eta?: string;
  /** 错误信息 */
  error?: string;
  /** 输出文件路径 */
  outputFile?: string;
  /** 视频信息 */
  videoInfo?: VideoInfo;
}

export interface VideoInfo {
  /** 视频标题 */
  title: string;
  /** 视频描述 */
  description?: string;
  /** 视频时长（秒） */
  duration: number;
  /** 上传者 */
  uploader: string;
  /** 视频平台 */
  platform: string;
  /** 视频ID */
  videoId: string;
  /** 缩略图URL */
  thumbnail?: string;
  /** 可用格式列表 */
  formats: VideoFormat[];
}

export interface VideoFormat {
  /** 格式ID */
  formatId: string;
  /** 格式描述 */
  formatNote: string;
  /** 文件扩展名 */
  ext: string;
  /** 分辨率 */
  resolution?: string;
  /** 视频编码 */
  vcodec?: string;
  /** 音频编码 */
  acodec?: string;
  /** 文件大小（字节） */
  filesize?: number;
  /** 码率 */
  tbr?: number;
}

export interface DownloadTask {
  /** 任务ID */
  id: string;
  /** 请求参数 */
  request: VideoDownloadRequest;
  /** 当前状态 */
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  /** 进度信息 */
  progress: number;
  /** 下载速度 */
  speed?: string;
  /** 预计剩余时间 */
  eta?: string;
  /** 错误信息 */
  error?: string;
  /** 输出文件路径 */
  outputFile?: string;
  /** 视频信息 */
  videoInfo?: VideoInfo;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

export interface MCPToolRequest {
  /** 工具名称 */
  name: string;
  /** 工具参数 */
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  /** 响应内容 */
  content: Array<{
    type: 'text';
    text: string;
  }>;
  /** 是否出错 */
  isError?: boolean;
}

export interface PlatformParser {
  /** 平台名称 */
  name: string;
  /** 支持的域名模式 */
  domains: string[];
  /** 解析方法 */
  parse: (url: string) => Promise<VideoInfo>;
  /** 下载方法 */
  download: (url: string, options: VideoDownloadRequest) => Promise<string>;
}