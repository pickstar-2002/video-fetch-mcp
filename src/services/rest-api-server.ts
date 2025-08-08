/**
 * REST API 服务器实现
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { VideoDownloadRequest } from '../types.js';
import YtDlpService from './ytdlp-service.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';
import Joi from 'joi';

export class RestApiServer {
  private app: Application;
  private ytdlpService: YtDlpService;

  constructor() {
    this.app = express();
    this.ytdlpService = new YtDlpService();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 安全头
    if (config.api.enableSecurity) {
      this.app.use(helmet());
    }

    // CORS
    if (config.api.enableCors) {
      this.app.use(cors({
        origin: true,
        credentials: true,
      }));
    }

    // 解析 JSON
    this.app.use(express.json({ limit: config.api.bodyLimit }));
    this.app.use(express.urlencoded({ extended: true, limit: config.api.bodyLimit }));

    // 请求日志
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.method === 'POST' ? req.body : undefined
      });
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    const router = express.Router();

    // 健康检查
    router.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.mcp.version
      });
    });

    // 获取视频信息
    router.post('/video/info', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = Joi.object({
          url: Joi.string().uri().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({
            success: false,
            error: `参数验证失败: ${error.message}`
          });
        }

        const videoInfo = await this.ytdlpService.getVideoInfo(value.url);
        
        return res.json({
          success: true,
          data: videoInfo
        });
      } catch (error) {
        return next(error);
      }
    });

    // 开始下载视频
    router.post('/video/download', async (req: Request, res: Response, next: NextFunction) => {
      try {
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

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({
            success: false,
            error: `参数验证失败: ${error.message}`
          });
        }

        const request: VideoDownloadRequest = value;
        const taskId = await this.ytdlpService.downloadVideo(request);

        return res.json({
          success: true,
          data: {
            taskId,
            message: '下载任务已创建',
            request
          }
        });
      } catch (error) {
        return next(error);
      }
    });

    // 获取任务状态
    router.get('/task/:taskId', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { taskId } = req.params;
        const task = this.ytdlpService.getTaskStatus(taskId);

        if (!task) {
          return res.status(404).json({
            success: false,
            error: '任务不存在'
          });
        }

        return res.json({
          success: true,
          data: task
        });
      } catch (error) {
        return next(error);
      }
    });

    // 取消任务
    router.delete('/task/:taskId', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { taskId } = req.params;
        const success = this.ytdlpService.cancelTask(taskId);

        res.json({
          success,
          message: success ? '任务已取消' : '任务不存在或无法取消'
        });
      } catch (error) {
        next(error);
      }
    });

    // 列出所有任务
    router.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tasks = this.ytdlpService.getAllTasks();

        res.json({
          success: true,
          data: {
            tasks,
            count: tasks.length
          }
        });
      } catch (error) {
        next(error);
      }
    });

    // 获取支持的平台列表
    router.get('/platforms', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          platforms: config.supportedPlatforms,
          count: config.supportedPlatforms.length
        }
      });
    });

    // 应用路由
    this.app.use(config.api.prefix, router);

    // 根路径重定向到 API 文档
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: config.mcp.name,
        version: config.mcp.version,
        description: config.mcp.description,
        endpoints: {
          health: `GET ${config.api.prefix}/health`,
          videoInfo: `POST ${config.api.prefix}/video/info`,
          downloadVideo: `POST ${config.api.prefix}/video/download`,
          getTask: `GET ${config.api.prefix}/task/:taskId`,
          cancelTask: `DELETE ${config.api.prefix}/task/:taskId`,
          listTasks: `GET ${config.api.prefix}/tasks`,
          platforms: `GET ${config.api.prefix}/platforms`
        }
      });
    });
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 404 处理
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.path
      });
    });

    // 全局错误处理
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('API 错误:', error);

      res.status(500).json({
        success: false,
        error: error.message || '内部服务器错误',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      const server = this.app.listen(config.port, () => {
        logger.info(`REST API 服务器已启动，端口: ${config.port}`);
        logger.info(`API 文档: http://localhost:${config.port}`);
        logger.info(`健康检查: http://localhost:${config.port}${config.api.prefix}/health`);
        
        // 定期清理过期任务
        setInterval(() => {
          this.ytdlpService.cleanupExpiredTasks();
        }, 60000); // 每分钟清理一次

        resolve();
      });

      // 优雅关闭
      process.on('SIGINT', () => {
        logger.info('正在关闭服务器...');
        server.close(() => {
          logger.info('服务器已关闭');
          process.exit(0);
        });
      });
    });
  }
}

export default RestApiServer;