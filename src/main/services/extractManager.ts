// 解压管理器 - 在主进程中处理文件解压

import _7z from '7zip-min'
import * as fs from 'fs'
import * as path from 'path'
import { ipcMain } from 'electron'

/**
 * 解压管理器
 */
export class ExtractManager {
  /**
   * 初始化解压管理器
   */
  static initialize(): void {
    // 注册IPC事件处理程序
    ipcMain.handle('extract:extractFile', async (_, filePath: string, outputDir: string) => {
      try {
        await this.extractFile(filePath, outputDir)
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    })

    ipcMain.handle('extract:isCompressedFile', (_, filePath: string) => {
      return this.isCompressedFile(filePath)
    })

    ipcMain.handle('extract:getFileList', async (_, filePath: string) => {
      try {
        const list = await this.getFileList(filePath)
        return { success: true, list }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    })

    ipcMain.handle('extract:compressFile', async (_, sourcePath: string, outputPath: string) => {
      try {
        await this.compressFile(sourcePath, outputPath)
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    })
  }
  /**
   * 解压文件
   * @param filePath 压缩文件路径
   * @param outputDir 输出目录
   */
  static async extractFile(filePath: string, outputDir: string): Promise<void> {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    try {
      // 开始解压
      await _7z.unpack(filePath, outputDir)
    } catch (error) {
      console.error('解压文件失败:', error)
      throw new Error(`解压文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 检查文件是否为压缩文件
   * @param filePath 文件路径
   */
  static isCompressedFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase()
    return ['.7z', '.zip'].includes(extension)
  }

  /**
   * 获取压缩文件中的文件列表
   * @param filePath 压缩文件路径
   */
  static async getFileList(filePath: string): Promise<string[]> {
    try {
      const list = await _7z.list(filePath)
      // 将ListItem数组转换为字符串数组
      return list.map((item: any) => item.name || item.path)
    } catch (error) {
      console.error('获取文件列表失败:', error)
      return []
    }
  }

  /**
   * 压缩文件或目录
   * @param sourcePath 源文件或目录路径
   * @param outputPath 输出压缩文件路径
   */
  static async compressFile(sourcePath: string, outputPath: string): Promise<void> {
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    try {
      await _7z.pack(sourcePath, outputPath)
    } catch (error) {
      console.error('压缩文件失败:', error)
      throw new Error(`压缩文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}
