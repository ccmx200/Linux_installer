// 日志记录工具 - 提供统一的错误处理和日志记录

import { AppError } from '@renderer/types/common'

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 日志条目接口
interface LogContext {
  [key: string]: string | number | boolean | null | undefined
}

interface LogEntry {
  timestamp: number
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
  sessionId?: string
}

/**
 * 日志记录器类
 */
export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO
  private logs: LogEntry[] = []
  private maxLogSize = 1000 // 最大日志条数
  private sessionId: string

  private constructor() {
    this.sessionId = this.generateSessionId()
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this.logLevel) {
      return
    }

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      error,
      sessionId: this.sessionId
    }

    this.logs.push(logEntry)

    // 限制日志大小
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize)
    }

    // 控制台输出
    this.outputToConsole(logEntry)

    // 发送到主进程进行文件记录（可选）
    this.sendToMainProcess(logEntry)
  }

  /**
   * 控制台输出
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const levelName = LogLevel[entry.level]
    const prefix = `[${timestamp}] [${levelName}]`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context || '')
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context || '')
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.context || '', entry.error || '')
        break
    }
  }

  /**
   * 发送到主进程
   */
  private sendToMainProcess(entry: LogEntry): void {
    // 只在生产环境中发送错误日志到文件
    if (entry.level >= LogLevel.ERROR && !import.meta.env.DEV) {
      try {
        window.electron.ipcRenderer.send('log:error', {
          ...entry,
          timestamp: new Date(entry.timestamp).toISOString()
        })
      } catch {
        // 忽略发送失败的错误
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * 信息日志
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * 致命错误日志
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error)
  }

  /**
   * 获取日志
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((entry) => entry.level >= level)
    }
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// 全局日志实例
export const logger = Logger.getInstance()

/**
 * 错误处理装饰器
 */
export function catchError(
  _target: unknown,
  propertyName: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const method = descriptor.value

  descriptor.value = async function (...args: unknown[]) {
    try {
      return await method.apply(this, args)
    } catch (error) {
      logger.error(
        `方法 ${propertyName} 执行失败`,
        error instanceof Error ? error : new Error(String(error)),
        {
          args: args.map((arg) => {
            if (typeof arg === 'object' && arg !== null) {
              return '[Object]'
            }
            return String(arg)
          }).join(', ')
        }
      )

      if (error instanceof AppError) {
        throw error
      }

      throw new AppError(
        `操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'METHOD_EXECUTION_FAILED',
        { originalError: error, method: propertyName }
      )
    }
  }

  return descriptor
}

/**
 * 性能监控装饰器
 */
export function measurePerformance(
  _target: unknown,
  propertyName: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const method = descriptor.value

  descriptor.value = async function (...args: unknown[]) {
    const startTime = performance.now()

    try {
      const result = await method.apply(this, args)
      const endTime = performance.now()
      const duration = endTime - startTime

      logger.debug(`方法 ${propertyName} 执行耗时: ${duration.toFixed(2)}ms`, {
        duration,
        method: propertyName
      })

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      logger.warn(`方法 ${propertyName} 执行失败，耗时: ${duration.toFixed(2)}ms`, {
        duration,
        method: propertyName,
        error: error instanceof Error ? error.message : '未知错误'
      })

      throw error
    }
  }

  return descriptor
}
