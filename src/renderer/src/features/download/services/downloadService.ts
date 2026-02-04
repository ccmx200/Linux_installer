// 下载服务 - 处理文件下载和镜像测速

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

// 镜像测速结果
export interface MirrorTestResult {
  mirror: string
  latency: number
  speed: number
  status: 'available' | 'unavailable'
  error?: string
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
}

/**
 * 下载服务
 */
export class DownloadService {
  /**
   * 下载文件
   */
  static async downloadFile(
    url: string,
    destination: string,
    options: DownloadOptions = {},
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    try {
      // 注册进度更新监听器
      if (onProgress) {
        window.api.ipcRenderer.on(
          'download:progress',
          (_event: unknown, ...args: unknown[]) => {
            const progress = args[2] as DownloadProgress
            onProgress(progress)
          }
        )
      }

      // 调用主进程的下载方法
      const filePath = await window.api.download.start(url, destination, options)

      // 移除进度更新监听器
      if (onProgress) {
        window.api.ipcRenderer.removeAllListeners('download:progress')
      }

      return filePath
    } catch (error) {
      console.error('Download error: ', error)
      throw error
    }
  }

  /**
   * 暂停下载
   */
  static async pauseDownload(downloadId: string): Promise<void> {
    await window.api.download.pause(downloadId)
  }

  /**
   * 恢复下载
   */
  static async resumeDownload(downloadId: string): Promise<void> {
    await window.api.download.resume(downloadId)
  }

  /**
   * 停止下载
   */
  static async stopDownload(downloadId: string): Promise<void> {
    await window.api.download.stop(downloadId)
  }

  /**
   * 测试镜像速度
   * 通过下载index.html来测试镜像速度，不会产生实际文件
   */
  static async testMirrorSpeed(mirror: string, downloadPath?: string): Promise<MirrorTestResult> {
    try {
      const result = await window.api.download.testMirrorSpeed(mirror, downloadPath)
      return result as MirrorTestResult
    } catch (error) {
      console.error(`Mirror speed test failed for ${mirror}:`, error)
      return {
        mirror,
        latency: -1,
        speed: 0,
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 测试多个镜像速度
   */
  static async testMultipleMirrors(
    mirrors: string[],
    downloadPath?: string
  ): Promise<MirrorTestResult[]> {
    try {
      const results = await window.api.download.testMultipleMirrors(mirrors, downloadPath)
      return results as MirrorTestResult[]
    } catch (error) {
      console.error('Multiple mirror speed test failed:', error)
      return mirrors.map((mirror) => ({
        mirror,
        latency: -1,
        speed: 0,
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  /**
   * 获取最佳镜像
   */
  static getBestMirror(results: MirrorTestResult[]): MirrorTestResult | null {
    const availableMirrors = results.filter((result) => result.status === 'available')

    if (availableMirrors.length === 0) {
      return null
    }

    // 首先按速度排序，速度快的优先
    availableMirrors.sort((a, b) => b.speed - a.speed)

    return availableMirrors[0]
  }
}
