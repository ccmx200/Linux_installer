// 下载管理器 - 在主进程中处理文件下载

import { DownloaderHelper } from 'node-downloader-helper'
import { ipcMain } from 'electron'
import * as fs from 'fs'

// 下载状态类型
export type DownloadState = 'idle' | 'downloading' | 'paused' | 'completed' | 'failed'

// 下载进度信息
export interface DownloadProgress {
  progress: number
  speed: number
  downloaded: number
  total: number
  state: DownloadState
}

// 下载选项
export interface DownloadOptions {
  method?: string
  headers?: Record<string, string>
  retry?: { maxRetries: number; delay: number }
  fileName?: (filename: string) => string
  override?: boolean | { skip: boolean; skipSmaller: boolean }
  metadata?: Record<string, unknown>
  forceResume?: boolean
  removeOnStop?: boolean
  removeOnFail?: boolean
  onProgress?: (progress: DownloadProgress) => void
}

// 下载队列任务类型
interface DownloadQueueTask {
  url: string
  destination: string
  options: DownloadOptions
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}

/**
 * 下载管理器
 */
export class DownloadManager {
  private static activeDownloads: Map<string, DownloaderHelper> = new Map()
  private static downloadQueue: DownloadQueueTask[] = []
  private static maxConcurrentDownloads = 3
  private static currentDownloads = 0

  /**
   * 初始化下载管理器
   */
  static initialize(): void {
    // 注册IPC事件处理程序
    ipcMain.handle(
      'download:start',
      (_, url: string, destination: string, options: DownloadOptions = {}) => {
        return this.downloadFile(url, destination, options)
      }
    )

    ipcMain.handle('download:pause', (_, downloadId: string) => {
      return this.pauseDownload(downloadId)
    })

    ipcMain.handle('download:resume', (_, downloadId: string) => {
      return this.resumeDownload(downloadId)
    })

    ipcMain.handle('download:stop', (_, downloadId: string) => {
      return this.stopDownload(downloadId)
    })

    ipcMain.handle('download:getStatus', () => {
      return {
        activeDownloads: this.currentDownloads,
        queuedDownloads: this.downloadQueue.length,
        maxConcurrent: this.maxConcurrentDownloads
      }
    })

    ipcMain.handle('download:setConcurrentLimit', (_, limit: number) => {
      this.maxConcurrentDownloads = Math.max(1, Math.min(10, limit))
      this.processQueue()
      return { success: true }
    })
  }

  /**
   * 处理下载队列
   */
  private static processQueue(): void {
    while (this.currentDownloads < this.maxConcurrentDownloads && this.downloadQueue.length > 0) {
      const task = this.downloadQueue.shift()
      if (task) {
        this.currentDownloads++
        this.startDownload(task.url, task.destination, task.options)
          .then(task.resolve)
          .catch(task.reject)
          .finally(() => {
            this.currentDownloads--
            this.processQueue()
          })
      }
    }
  }

  /**
   * 下载文件
   */
  static async downloadFile(
    url: string,
    destination: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // 如果达到并发限制，加入队列
      if (this.currentDownloads >= this.maxConcurrentDownloads) {
        this.downloadQueue.push({ url, destination, options, resolve, reject })
        console.log(`下载任务已加入队列，当前队列长度: ${this.downloadQueue.length}`)
        return
      }

      // 直接开始下载
      this.currentDownloads++
      this.startDownload(url, destination, options)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.currentDownloads--
          this.processQueue()
        })
    })
  }

  /**
   * 实际开始下载
   */
  private static async startDownload(
    url: string,
    destination: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // 确保目标目录存在
        if (!fs.existsSync(destination)) {
          fs.mkdirSync(destination, { recursive: true })
        }

        // 文件名由DownloaderHelper自动处理

        const dl = new DownloaderHelper(url, destination, {
          method: (options.method as 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS') || 'GET',
          headers: options.headers || {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.3 Safari/605.1.15',
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive'
          },
          retry: options.retry || { maxRetries: 5, delay: 2000 }, // 增加重试次数，减少延迟
          fileName: options.fileName,
          override: options.override || { skip: true, skipSmaller: true }, // 支持断点续传，不强制覆盖文件
          metadata: options.metadata,
          forceResume: options.forceResume || true, // 强制启用断点续传
          removeOnStop: options.removeOnStop || false, // 不删除文件，以便后续续传
          removeOnFail: options.removeOnFail || false // 不删除文件，以便后续重试
        })

        // 生成唯一ID
        const downloadId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        this.activeDownloads.set(downloadId, dl)

        // 监听下载事件
        dl.on('download', (downloadInfo) => {
          console.log('Download Begins: ', {
            name: downloadInfo.fileName,
            total: downloadInfo.totalSize
          })
        })
          .on('end', (downloadInfo) => {
            console.log('Download Completed: ', downloadInfo)
            this.activeDownloads.delete(downloadId)
            resolve(downloadInfo.filePath)
          })
          .on('skip', (skipInfo) => {
            console.log('Download skipped. File already exists: ', skipInfo)
            this.activeDownloads.delete(downloadId)
            resolve(skipInfo.filePath)
          })
          .on('error', (err) => {
            console.error('Download error: ', err)
            this.activeDownloads.delete(downloadId)
            reject(err)
          })
          .on('retry', (attempt, opts, err) => {
            console.log({
              RetryAttempt: `${attempt}/${opts.maxRetries}`,
              StartsOn: `${opts.delay / 1000} secs`,
              Reason: err ? err.message : 'unknown'
            })
          })
          .on('resume', (isResumed) => {
            if (!isResumed) {
              console.warn("This URL doesn't support resume, it will start from the beginning")
            }
          })
          .on('stateChanged', (state) => {
            console.log('State: ', state)
          })
          .on('renamed', (filePaths) => {
            console.log('File Renamed to: ', filePaths.fileName)
          })
          .on('redirected', (newUrl, oldUrl) => {
            console.log(`Redirect from '${oldUrl}' => '${newUrl}'`)
          })
          .on('progress', (stats) => {
            const progress = stats.progress
            const speed = stats.speed
            const downloaded = stats.downloaded
            const total = stats.total

            // 发送进度更新到渲染进程
            if (global.mainWindow) {
              global.mainWindow.webContents.send('download:progress', downloadId, {
                progress,
                speed,
                downloaded,
                total,
                state: 'downloading' as DownloadState
              })
            }

            // 调用回调函数
            if (options.onProgress) {
              options.onProgress({
                progress,
                speed,
                downloaded,
                total,
                state: 'downloading' as DownloadState
              })
            }
          })

        // 开始下载
        dl.start().catch((error) => {
          console.error('Download start error: ', error)
          this.activeDownloads.delete(downloadId)
          reject(error)
        })
      } catch (error) {
        console.error('Download initialization error: ', error)
        reject(error)
      }
    })
  }

  /**
   * 暂停下载
   */
  static async pauseDownload(downloadId: string): Promise<void> {
    const dl = this.activeDownloads.get(downloadId)
    if (dl) {
      await dl.pause()
    }
  }

  /**
   * 恢复下载
   */
  static async resumeDownload(downloadId: string): Promise<void> {
    const dl = this.activeDownloads.get(downloadId)
    if (dl) {
      await dl.resume()
    }
  }

  /**
   * 停止下载
   */
  static async stopDownload(downloadId: string): Promise<void> {
    const dl = this.activeDownloads.get(downloadId)
    if (dl) {
      await dl.stop()
      this.activeDownloads.delete(downloadId)
    }
  }
}
