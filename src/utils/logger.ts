/**
 * 日志工具类
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import config from '../config.js';

// 确保日志目录存在
const logDir = path.dirname(config.logging.file);
fs.ensureDirSync(logDir);

// 创建 Winston 日志实例
export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-video-downloader' },
  transports: [
    // 写入所有日志到文件
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 错误日志单独文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 如果不是生产环境，同时输出到控制台
if (config.logging.console && process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;