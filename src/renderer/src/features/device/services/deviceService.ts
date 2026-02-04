// 设备服务 - 处理设备检测相关逻辑

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import { AppError } from '@renderer/types/common'

// 设备状态接口
interface DeviceStatus {
  isConnected: boolean
  deviceCount: number
  lastScanTime: number
  error?: string
}

// 设备操作结果（保留供未来使用）
// interface DeviceOperationResult {
//   success: boolean
//   message: string
//   data?: any
//   error?: string
// }

/**
 * 设备服务类
 */
export class DeviceService {
  private static readonly SCAN_INTERVAL = 2000 // 2秒扫描间隔
  private static lastScanTime = 0
  private static scanCache: string[] = []
  private static cacheExpiration = 0

  /**
   * 检查是否可以扫描设备（防止频繁扫描）
   */
  private static canScan(): boolean {
    const now = Date.now()
    return now - this.lastScanTime >= this.SCAN_INTERVAL
  }

  /**
   * 获取缓存的设备列表
   */
  private static getCachedDevices(): string[] | null {
    const now = Date.now()
    if (now < this.cacheExpiration && this.scanCache.length > 0) {
      return this.scanCache
    }
    return null
  }
  /**
   * 扫描连接的设备
   */
  static async scanDevices(): Promise<string[]> {
    try {
      // 检查缓存
      const cachedDevices = this.getCachedDevices()
      if (cachedDevices) {
        return cachedDevices
      }

      // 检查扫描频率限制
      if (!this.canScan()) {
        throw new AppError('设备扫描过于频繁，请稍后再试', 'SCAN_FREQUENCY_LIMIT', {
          lastScanTime: this.lastScanTime
        })
      }

      this.lastScanTime = Date.now()

      const result = await window.electron.ipcRenderer.invoke('scanDevices')
      const devices = result.split('\n').filter((line: string) => line.trim() !== '')

      // 缓存结果（5秒有效期）
      this.scanCache = devices
      this.cacheExpiration = Date.now() + 5000

      if (devices.length > 0) {
        console.log(SUCCESS_MESSAGES.DEVICE_CONNECTED)
      }

      return devices
    } catch (error) {
      console.error('设备扫描失败:', error)

      if (error instanceof AppError) {
        throw error
      }

      throw new AppError(ERROR_MESSAGES.DEVICE_NOT_FOUND, 'DEVICE_SCAN_FAILED', {
        originalError: error
      })
    }
  }

  /**
   * 获取设备状态
   */
  static async getDeviceStatus(): Promise<DeviceStatus> {
    try {
      const devices = await this.scanDevices()

      return {
        isConnected: devices.length > 0,
        deviceCount: devices.length,
        lastScanTime: this.lastScanTime
      }
    } catch (error) {
      return {
        isConnected: false,
        deviceCount: 0,
        lastScanTime: this.lastScanTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 执行fastboot命令
   */
  static async executeFastbootCommand(command: string, args: string[] = []): Promise<string> {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'executeFastbootCommand',
        command,
        args
      )
      return result
    } catch (error) {
      console.error(`Fastboot命令执行失败: ${command}`, error)
      throw error
    }
  }

  /**
   * 擦除分区
   */
  static async erasePartition(partition: string): Promise<void> {
    try {
      await this.executeFastbootCommand('erase', [partition])
      console.log(`分区 ${partition} 擦除成功`)
    } catch (error) {
      console.error(`分区 ${partition} 擦除失败:`, error)
      throw error
    }
  }

  /**
   * 刷入镜像
   */
  static async flashImage(partition: string, imagePath: string): Promise<void> {
    try {
      await this.executeFastbootCommand('flash', [partition, imagePath])
      console.log(`镜像 ${imagePath} 刷入分区 ${partition} 成功`)
    } catch (error) {
      console.error(`镜像刷入失败:`, error)
      throw error
    }
  }

  /**
   * 重启设备
   */
  static async rebootDevice(): Promise<void> {
    try {
      await this.executeFastbootCommand('reboot')
      console.log('设备重启命令已发送')
    } catch (error) {
      console.error('设备重启失败:', error)
      throw error
    }
  }

  /**
   * 验证设备连接状态
   */
  static async validateDeviceConnection(): Promise<boolean> {
    try {
      const devices = await this.scanDevices()
      return devices.length > 0
    } catch {
      return false
    }
  }
}
