#!/usr/bin/env node
/**
 * 应用程序主入口
 */

import { MCPVideoDownloaderServer } from './services/mcp-server-fixed.js';
import { RestApiServer } from './services/rest-api-server.js';
import { logger } from './utils/logger.js';
import config from './config.js';

async function main() {
  try {
    logger.info('启动 MCP 视频下载服务...');

    // 检查启动模式
    const mode = process.argv[2] || 'mcp';

    if (mode === 'api' || mode === 'rest') {
      // REST API 模式
      logger.info('启动 REST API 服务器模式');
      const apiServer = new RestApiServer();
      await apiServer.start();
    } else {
      // MCP 服务器模式（默认）
      logger.info('启动 MCP 服务器模式');
      const mcpServer = new MCPVideoDownloaderServer();
      await mcpServer.start();
    }

  } catch (error) {
    logger.error('启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务...');
  process.exit(0);
});

// 启动应用
main();