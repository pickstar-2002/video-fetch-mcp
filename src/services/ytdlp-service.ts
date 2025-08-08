/**
 * yt-dlp 服务类 - 核心视频下载服务
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { VideoDownloadRequest, VideoDownloadResponse, VideoInfo, DownloadTask } from '../types.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';

export class YtDlpService {
  private activeTasks: Map<string, DownloadTask> = new Map();
  private activeProcesses: Map<string, ChildProcess> = new Map();

  /**
   * 获取视频信息（不下载）
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    logger.info(`获取视频信息: ${url}`);
    
    return new Promise((resolve, reject) => {
      const args = [
        '-m', 'yt_dlp',
        '--dump-json',
        '--no-warnings',
        '--flat-playlist',
        url
      ];

      const process = spawn(config.ytDlp.executablePath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(stdout);
            const videoInfo: VideoInfo = {
              title: info.title || '未知标题',
              description: info.description,
              duration: info.duration || 0,
              uploader: info.uploader || '未知上传者',
              platform: info.extractor || '未知平台',
              videoId: info.id || '',
              thumbnail: info.thumbnail,
              formats: info.formats?.map((format: any) => ({
                formatId: format.format_id,
                formatNote: format.format_note || '',
                ext: format.ext,
                resolution: format.resolution,
                vcodec: format.vcodec,
                acodec: format.acodec,
                filesize: format.filesize,
                tbr: format.tbr,
              })) || []
            };
            
            logger.info(`成功获取视频信息: ${videoInfo.title}`);
            resolve(videoInfo);
          } catch (error) {
            logger.error('解析视频信息失败:', error);
            reject(new Error('解析视频信息失败'));
          }
        } else {
          logger.error(`yt-dlp 获取信息失败 (code: ${code}): ${stderr}`);
          reject(new Error(`获取视频信息失败: ${stderr}`));
        }
      });

      // 设置超时
      setTimeout(() => {
        process.kill();
        reject(new Error('获取视频信息超时'));
      }, config.ytDlp.timeout);
    });
  }

  /**
   * 开始下载视频
   */
  async downloadVideo(request: VideoDownloadRequest): Promise<string> {
    const taskId = uuidv4();
    logger.info(`开始下载任务 ${taskId}: ${request.url}`);

    // 确保输出目录存在
    await fs.ensureDir(request.outputPath);

    // 创建下载任务
    const task: DownloadTask = {
      id: taskId,
      request,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeTasks.set(taskId, task);

    // 异步执行下载
    this.executeDownload(taskId).catch((error) => {
      logger.error(`下载任务 ${taskId} 失败:`, error);
      task.status = 'failed';
      task.error = error.message;
      task.updatedAt = new Date();
    });

    return taskId;
  }

  /**
   * 执行实际的下载过程
   */
  private async executeDownload(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    try {
      // 更新任务状态
      task.status = 'downloading';
      task.updatedAt = new Date();

      // 构建 yt-dlp 命令参数
      const args = this.buildDownloadArgs(task.request);
      
      logger.info(`执行 yt-dlp 命令: ${config.ytDlp.executablePath} ${args.join(' ')}`);

      // 启动下载进程  
      const finalArgs = ['-m', 'yt_dlp', ...args];
      const process = spawn(config.ytDlp.executablePath, finalArgs);
      this.activeProcesses.set(taskId, process);

      let stderr = '';

      // 处理进度输出
      process.stdout.on('data', (data) => {
        const output = data.toString();
        this.parseProgress(taskId, output);
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        this.parseProgress(taskId, data.toString());
      });

      // 处理进程结束
      process.on('close', (code) => {
        this.activeProcesses.delete(taskId);
        
        if (code === 0) {
          task.status = 'completed';
          task.progress = 100;
          logger.info(`下载任务 ${taskId} 完成`);
        } else {
          task.status = 'failed';
          task.error = `下载失败 (退出码: ${code}): ${stderr}`;
          logger.error(`下载任务 ${taskId} 失败: ${task.error}`);
        }
        
        task.updatedAt = new Date();
      });

      // 设置超时
      setTimeout(() => {
        if (this.activeProcesses.has(taskId)) {
          process.kill();
          task.status = 'failed';
          task.error = '下载超时';
          task.updatedAt = new Date();
          this.activeProcesses.delete(taskId);
        }
      }, config.ytDlp.timeout);

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : '未知错误';
      task.updatedAt = new Date();
      throw error;
    }
  }

  /**
   * 构建 yt-dlp 下载参数
   */
  private buildDownloadArgs(request: VideoDownloadRequest): string[] {
    const args = [...config.ytDlp.defaultOptions];

    // 输出路径和文件名模板
    const outputTemplate = request.outputTemplate || '%(title)s.%(ext)s';
    args.push('-o', path.join(request.outputPath, outputTemplate));

    // 视频质量
    if (request.quality) {
      args.push('-f', request.quality);
    }

    // 提取音频
    if (request.extractAudio) {
      args.push('--extract-audio');
      if (request.audioFormat) {
        args.push('--audio-format', request.audioFormat);
      }
    }

    // 下载字幕
    if (request.downloadSubtitles) {
      args.push('--write-subs');
      if (request.subtitleLangs && request.subtitleLangs.length > 0) {
        args.push('--sub-langs', request.subtitleLangs.join(','));
      }
    }

    // 添加 URL
    args.push(request.url);

    return args;
  }

  /**
   * 解析下载进度
   */
  private parseProgress(taskId: string, output: string): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    // 解析进度百分比
    const progressMatch = output.match(/(\d+(?:\.\d+)?)%/);
    if (progressMatch) {
      task.progress = parseFloat(progressMatch[1]);
    }

    // 解析下载速度
    const speedMatch = output.match(/(\d+(?:\.\d+)?(?:K|M|G)?iB\/s)/);
    if (speedMatch) {
      task.speed = speedMatch[1];
    }

    // 解析预计剩余时间
    const etaMatch = output.match(/ETA\s+(\d+:\d+)/);
    if (etaMatch) {
      task.eta = etaMatch[1];
    }

    task.updatedAt = new Date();
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): DownloadTask | null {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * 取消下载任务
   */
  cancelTask(taskId: string): boolean {
    const process = this.activeProcesses.get(taskId);
    const task = this.activeTasks.get(taskId);

    if (process) {
      process.kill();
      this.activeProcesses.delete(taskId);
    }

    if (task) {
      task.status = 'failed';
      task.error = '用户取消';
      task.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * 获取所有活跃任务
   */
  getAllTasks(): DownloadTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 清理过期任务
   */
  cleanupExpiredTasks(): void {
    const now = new Date();
    const expiredTasks: string[] = [];

    for (const [taskId, task] of this.activeTasks) {
      const timeDiff = now.getTime() - task.updatedAt.getTime();
      if (timeDiff > config.download.taskRetentionTime && 
          (task.status === 'completed' || task.status === 'failed')) {
        expiredTasks.push(taskId);
      }
    }

    expiredTasks.forEach(taskId => {
      this.activeTasks.delete(taskId);
      logger.info(`清理过期任务: ${taskId}`);
    });
  }
}

export default YtDlpService;