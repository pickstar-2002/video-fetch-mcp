/**
 * MCP 服务器实现
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { VideoDownloadRequest, MCPToolResponse } from '../types.js';
import YtDlpService from './ytdlp-service.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';
import Joi from 'joi';

export class MCPVideoDownloaderServer {
  private server: Server;
  private ytdlpService: YtDlpService;

  constructor() {
    this.server = new Server(
      {
        name: config.mcp.name,
        version: config.mcp.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.ytdlpService = new YtDlpService();
    this.setupHandlers();
  }

  /**
   * 设置 MCP 处理器
   */
  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'download_video',
            description: '下载指定URL的视频到本地路径',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '视频链接URL'
                },
                outputPath: {
                  type: 'string',
                  description: '本地保存路径'
                },
                quality: {
                  type: 'string',
                  description: '视频质量选项',
                  enum: ['best', 'worst', 'bestvideo', 'bestaudio'],
                  default: 'best'
                },
                outputTemplate: {
                  type: 'string',
                  description: '输出文件名模板',
                  default: '%(title)s.%(ext)s'
                },
                extractAudio: {
                  type: 'boolean',
                  description: '是否仅提取音频',
                  default: false
                },
                audioFormat: {
                  type: 'string',
                  description: '音频格式',
                  enum: ['mp3', 'aac', 'wav', 'flac'],
                  default: 'mp3'
                },
                downloadSubtitles: {
                  type: 'boolean',
                  description: '是否下载字幕',
                  default: false
                },
                subtitleLangs: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '字幕语言列表',
                  default: ['zh-CN', 'en']
                }
              },
              required: ['url', 'outputPath']
            }
          },
          {
            name: 'get_video_info',
            description: '获取视频信息（不下载）',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '视频链接URL'
                }
              },
              required: ['url']
            }
          },
          {
            name: 'get_task_status',
            description: '获取下载任务状态',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: '任务ID'
                }
              },
              required: ['taskId']
            }
          },
          {
            name: 'cancel_task',
            description: '取消下载任务',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: '任务ID'
                }
              },
              required: ['taskId']
            }
          },
          {
            name: 'list_tasks',
            description: '列出所有下载任务',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'download_video':
            return await this.handleDownloadVideo(args);
          case 'get_video_info':
            return await this.handleGetVideoInfo(args);
          case 'get_task_status':
            return await this.handleGetTaskStatus(args);
          case 'cancel_task':
            return await this.handleCancelTask(args);
          case 'list_tasks':
            return await this.handleListTasks(args);
          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        logger.error(`工具调用失败 ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * 处理视频下载请求
   */
  private async handleDownloadVideo(args: any) {
    // 验证参数
    const schema = Joi.object({
      url: Joi.string().uri().required(),
      outputPath: Joi.string().required(),
      quality: Joi.string().valid('best', 'worst', 'bestvideo', 'bestaudio').default('best'),
      outputTemplate: Joi.string().default('%(title)s.%(ext)s'),
      extractAudio: Joi.boolean().default(false),
      audioFormat: Joi.string().valid('mp3', 'aac', 'wav', 'flac').default('mp3'),
      downloadSubtitles: Joi.boolean().default(false),
      subtitleLangs: Joi.array().items(Joi.string()).default(['zh-CN', 'en'])
    });

    const { error, value } = schema.validate(args);
    if (error) {
      throw new Error(`参数验证失败: ${error.message}`);
    }

    const request: VideoDownloadRequest = value;
    const taskId = await this.ytdlpService.downloadVideo(request);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            taskId,
            message: '下载任务已创建',
            request
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 处理获取视频信息请求
   */
  private async handleGetVideoInfo(args: any) {
    const schema = Joi.object({
      url: Joi.string().uri().required()
    });

    const { error, value } = schema.validate(args);
    if (error) {
      throw new Error(`参数验证失败: ${error.message}`);
    }

    const videoInfo = await this.ytdlpService.getVideoInfo(value.url);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            videoInfo
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 处理获取任务状态请求
   */
  private async handleGetTaskStatus(args: any) {
    const schema = Joi.object({
      taskId: Joi.string().required()
    });

    const { error, value } = schema.validate(args);
    if (error) {
      throw new Error(`参数验证失败: ${error.message}`);
    }

    const task = this.ytdlpService.getTaskStatus(value.taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            task
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 处理取消任务请求
   */
  private async handleCancelTask(args: any) {
    const schema = Joi.object({
      taskId: Joi.string().required()
    });

    const { error, value } = schema.validate(args);
    if (error) {
      throw new Error(`参数验证失败: ${error.message}`);
    }

    const success = this.ytdlpService.cancelTask(value.taskId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success,
            message: success ? '任务已取消' : '任务不存在或无法取消'
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 处理列出所有任务请求
   */
  private async handleListTasks(args: any) {
    const tasks = this.ytdlpService.getAllTasks();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            tasks,
            count: tasks.length
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 启动 MCP 服务器
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      // MCP服务器启动后不应该输出日志到stdout，因为会干扰MCP通信
      // logger.info(`MCP 视频下载服务器已启动 (${config.mcp.name} v${config.mcp.version})`);
      
      // 定期清理过期任务
      const cleanupInterval = setInterval(() => {
        this.ytdlpService.cleanupExpiredTasks();
      }, 60000); // 每分钟清理一次

      // 优雅关闭时清理定时器
      process.on('SIGINT', () => {
        clearInterval(cleanupInterval);
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        clearInterval(cleanupInterval);
        process.exit(0);
      });

    } catch (error) {
      // 错误信息写入stderr，不影响MCP通信
      console.error('MCP服务器启动失败:', error);
      process.exit(1);
    }
  }
}

export default MCPVideoDownloaderServer;