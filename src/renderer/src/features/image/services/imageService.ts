// 镜像服务 - 处理镜像文件相关逻辑

import { SUCCESS_MESSAGES } from '../constants'
import { validateFilePath } from '../utils'
import { AppError } from '@renderer/types/common'

// 镜像文件类型
interface ImageFileInfo {
  size: number
  name: string
  path: string
  isValid: boolean
  lastModified: number
}

// 镜像缓存
const imageCache = new Map<string, ImageFileInfo>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

/**
 * 镜像服务类
 */
export class ImageService {
  private static readonly SUPPORTED_EXTENSIONS = ['.img', '.bin', '.zip', '.7z', '.tar', '.gz']
  private static readonly MIN_FILE_SIZE = 1024 * 1024 // 1MB
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024 // 10GB

  /**
   * 清理过期缓存
   */
  private static cleanupCache(): void {
    const now = Date.now()
    for (const [path, info] of imageCache.entries()) {
      if (now - info.lastModified > CACHE_TTL) {
        imageCache.delete(path)
      }
    }
  }
  /**
   * 选择镜像文件
   */
  static async selectImageFile(): Promise<string | null> {
    try {
      this.cleanupCache()

      const result = await window.electron.ipcRenderer.invoke('selectImageFile')

      if (result && result.canceled === false && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]

        // 验证文件格式和大小
        const validationResult = await this.validateImageFile(filePath)
        if (validationResult.isValid) {
          console.log(SUCCESS_MESSAGES.IMAGE_SELECTED)

          // 缓存文件信息
          const fileInfo = await this.getImageInfo(filePath)
          imageCache.set(filePath, {
            ...fileInfo,
            path: filePath,
            isValid: true,
            lastModified: Date.now()
          })

          return filePath
        } else {
          throw new AppError(
            `选择的文件格式不支持或文件异常: ${validationResult.errors.join(', ')}`,
            'IMAGE_VALIDATION_FAILED',
            { filePath, errors: validationResult.errors }
          )
        }
      }

      return null
    } catch (error) {
      console.error('镜像选择失败:', error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('镜像选择失败', 'IMAGE_SELECTION_FAILED', { originalError: error })
    }
  }

  /**
   * 验证镜像文件
   */
  static async validateImageFile(
    filePath: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!filePath) {
      errors.push('文件路径为空')
      return { isValid: false, errors, warnings }
    }

    // 检查文件扩展名
    const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.')).toLowerCase()
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      errors.push(`文件格式不支持，支持的文件格式: ${this.SUPPORTED_EXTENSIONS.join(', ')}`)
    }

    // 检查文件路径有效性
    if (!validateFilePath(filePath)) {
      errors.push('文件路径无效或包含非法字符')
    }

    // 检查文件大小（异步）
    try {
      const fileInfo = await this.getImageInfo(filePath)

      if (fileInfo.size === 0) {
        errors.push('镜像文件为空')
      } else if (fileInfo.size < this.MIN_FILE_SIZE) {
        errors.push(`镜像文件大小过小，最小要求: ${this.formatFileSize(this.MIN_FILE_SIZE)}`)
      } else if (fileInfo.size > this.MAX_FILE_SIZE) {
        warnings.push(`镜像文件较大，可能会影响性能: ${this.formatFileSize(fileInfo.size)}`)
      }
    } catch (error) {
      errors.push(`无法获取文件信息: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 格式化文件大小
   */
  private static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * 获取镜像文件信息
   */
  static async getImageInfo(filePath: string): Promise<{ size: number; name: string }> {
    try {
      const result = await window.electron.ipcRenderer.invoke('getFileInfo', filePath)
      return {
        size: result.size,
        name: result.name
      }
    } catch (error) {
      console.error('获取镜像文件信息失败:', error)
      throw error
    }
  }

  /**
   * 验证镜像文件完整性
   */
  static async validateImageIntegrity(filePath: string): Promise<boolean> {
    try {
      // 这里可以添加更复杂的验证逻辑
      // 例如检查文件哈希值、文件大小等
      const info = await this.getImageInfo(filePath)

      // 简单的文件大小验证
      if (info.size === 0) {
        throw new Error('镜像文件为空')
      }

      // 文件大小合理性检查（假设最小镜像文件为1MB）
      if (info.size < 1024 * 1024) {
        throw new Error('镜像文件大小异常')
      }

      return true
    } catch (error) {
      console.error('镜像文件验证失败:', error)
      throw error
    }
  }

  /**
   * 获取默认镜像列表
   */
  static getDefaultImages(): Array<{
    id: string
    name: string
    version: string
    size: string
    description: string
    recommended: boolean
  }> {
    return [
      {
        id: 'ubuntu-touch',
        name: 'Ubuntu Touch',
        version: '20.04',
        size: '1.2 GB',
        description: '专为移动设备优化的Ubuntu系统',
        recommended: true
      },
      {
        id: 'postmarketos',
        name: 'postmarketOS',
        version: '21.12',
        size: '800 MB',
        description: '基于Alpine Linux的移动设备系统',
        recommended: false
      },
      {
        id: 'sailfishos',
        name: 'Sailfish OS',
        version: '4.5',
        size: '1.5 GB',
        description: '基于MeeGo的移动操作系统',
        recommended: false
      }
    ]
  }
}
