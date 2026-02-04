// 刷入服务 - 处理刷入过程相关逻辑

import { ERROR_MESSAGES, SUCCESS_MESSAGES, FLASH_STAGES } from '../constants'
import { DeviceService } from '../../device/services/deviceService'
import { ImageService } from '../../image/services/imageService'

/**
 * 刷入服务类
 */
export class FlashService {
  private static currentStage: string = FLASH_STAGES.PREPARING
  private static progress = 0
  private static logs: Array<{ timestamp: number; message: string; level: string }> = []

  /**
   * 开始刷入过程
   */
  static async startFlashProcess(imagePaths: Record<string, string>): Promise<void> {
    try {
      this.resetProgress()
      this.addLog('开始刷入过程', 'info')

      // 阶段1: 准备工作
      await this.prepareFlash()

      // 阶段2: 擦除分区
      await this.erasePartitions()

      // 阶段3: 刷入镜像
      await this.flashImages(imagePaths)

      // 阶段4: 验证结果
      await this.verifyFlash()

      this.addLog(SUCCESS_MESSAGES.FLASH_COMPLETED, 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.addLog(`刷入失败: ${errorMessage}`, 'error')
      throw error
    }
  }

  /**
   * 准备工作
   */
  private static async prepareFlash(): Promise<void> {
    this.currentStage = FLASH_STAGES.PREPARING
    this.progress = 10

    this.addLog('验证设备连接状态', 'info')
    const isConnected = await DeviceService.validateDeviceConnection()

    if (!isConnected) {
      throw new Error(ERROR_MESSAGES.DEVICE_NOT_FOUND)
    }

    this.addLog('设备连接验证通过', 'success')
    this.progress = 20
  }

  /**
   * 擦除分区
   */
  private static async erasePartitions(): Promise<void> {
    this.currentStage = FLASH_STAGES.ERASING
    this.progress = 30

    const partitions = ['dtbo', 'boot', 'cache', 'userdata']

    for (const partition of partitions) {
      try {
        this.addLog(`正在擦除分区: ${partition}`, 'info')
        await DeviceService.erasePartition(partition)
        this.addLog(`分区 ${partition} 擦除完成`, 'success')
        this.progress += 10
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        this.addLog(`分区 ${partition} 擦除失败: ${errorMessage}`, 'warning')
        // 继续执行其他分区擦除
      }
    }

    this.progress = 60
  }

  /**
   * 刷入镜像
   */
  private static async flashImages(imagePaths: Record<string, string>): Promise<void> {
    this.currentStage = FLASH_STAGES.FLASHING
    this.progress = 60

    const flashOperations = Object.entries(imagePaths).filter(([, path]) => path) // 只处理有路径的镜像

    const progressIncrement = 30 / flashOperations.length

    for (const [partition, imagePath] of flashOperations) {
      try {
        this.addLog(`正在刷入镜像到分区: ${partition}`, 'info')

        // 验证镜像文件
        await ImageService.validateImageIntegrity(imagePath)

        // 执行刷入
        await DeviceService.flashImage(partition, imagePath)

        this.addLog(`分区 ${partition} 刷入完成`, 'success')
        this.progress += progressIncrement
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        this.addLog(`分区 ${partition} 刷入失败: ${errorMessage}`, 'error')
        throw error // 镜像刷入失败则终止整个流程
      }
    }

    this.progress = 90
  }

  /**
   * 验证刷入结果
   */
  private static async verifyFlash(): Promise<void> {
    this.currentStage = FLASH_STAGES.VERIFYING
    this.progress = 90

    this.addLog('验证刷入结果', 'info')

    // 简单的验证：检查设备是否仍然连接
    const isConnected = await DeviceService.validateDeviceConnection()

    if (isConnected) {
      this.addLog('刷入验证通过', 'success')
      this.progress = 100

      // 重启设备
      this.addLog('正在重启设备...', 'info')
      await DeviceService.rebootDevice()
    } else {
      throw new Error('设备连接丢失，刷入结果验证失败')
    }

    this.currentStage = FLASH_STAGES.COMPLETED
  }

  /**
   * 添加日志
   */
  private static addLog(message: string, level: 'info' | 'warning' | 'error' | 'success'): void {
    const logEntry = {
      timestamp: Date.now(),
      message,
      level
    }

    this.logs.push(logEntry)
    console.log(`[${level.toUpperCase()}] ${message}`)
  }

  /**
   * 重置进度
   */
  private static resetProgress(): void {
    this.currentStage = FLASH_STAGES.PREPARING
    this.progress = 0
    this.logs = []
  }

  /**
   * 获取当前进度
   */
  static getProgress(): { stage: string; progress: number; logs: unknown[] } {
    return {
      stage: this.currentStage,
      progress: this.progress,
      logs: [...this.logs]
    }
  }

  /**
   * 取消刷入过程
   */
  static cancelFlash(): void {
    this.addLog('刷入过程已取消', 'warning')
    this.resetProgress()
  }
}
