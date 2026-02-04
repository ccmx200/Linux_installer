// 解压服务 - 处理7z和ZIP文件的解压

/**
 * 解压服务
 */
export class ExtractService {
  /**
   * 解压文件
   * @param filePath 压缩文件路径
   * @param outputDir 输出目录
   * @param progressCallback 进度回调函数
   */
  static async extractFile(
    filePath: string,
    outputDir: string,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    try {
      // 通过IPC调用主进程的解压功能
      const result = await window.api.extract.extractFile(filePath, outputDir)

      if (!result.success) {
        throw new Error(result.error || '解压失败')
      }

      // 解压完成，调用进度回调
      if (progressCallback) {
        progressCallback(100)
      }
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
    const lastDotIndex = filePath.lastIndexOf('.')
    if (lastDotIndex === -1) {
      return false
    }
    const extension = filePath.substring(lastDotIndex).toLowerCase()
    return ['.7z', '.zip'].includes(extension)
  }

  /**
   * 获取压缩文件中的文件列表
   * @param filePath 压缩文件路径
   */
  static async getFileList(filePath: string): Promise<string[]> {
    try {
      // 通过IPC调用主进程的获取文件列表功能
      const result = await window.api.extract.getFileList(filePath)

      // 直接返回结果，因为main进程返回的是string[]
      return (result as string[]) || []
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
    try {
      // 通过IPC调用主进程的压缩功能
      const result = await window.api.extract.compressFile(sourcePath, outputPath)

      if (!result.success) {
        throw new Error(result.error || '压缩失败')
      }
    } catch (error) {
      console.error('压缩文件失败:', error)
      throw new Error(`压缩文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}
