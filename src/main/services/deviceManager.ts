// 设备管理器 - 处理设备检测和fastboot命令执行

import { ipcMain } from 'electron'
import { FastbootService } from './fastbootService'

// 设备信息接口
export interface DeviceInfo {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'unknown'
  type: 'fastboot' | 'adb' | 'recovery'
}

// 命令执行结果
export interface CommandResult {
  success: boolean
  output: string
  error?: string
}

/**
 * 设备管理器类
 */
export class DeviceManager {
  /**
   * 初始化设备管理器
   */
  static initialize(): void {
    FastbootService.initialize()
    this.registerIpcHandlers()
  }

  /**
   * 注册IPC事件处理程序
   */
  private static registerIpcHandlers(): void {
    // 扫描设备
    ipcMain.handle('scanDevices', async (): Promise<string[]> => {
      return this.scanDevices()
    })

    // 执行fastboot命令
    ipcMain.handle(
      'executeFastbootCommand',
      async (_, command: string, args: string[] = []): Promise<CommandResult> => {
        return this.executeFastbootCommand(command, args)
      }
    )

    // 停止命令执行
    ipcMain.handle('stopCommand', async (_, processId: string): Promise<boolean> => {
      return FastbootService.stopProcess(processId)
    })
  }

  /**
   * 扫描连接的设备
   */
  static async scanDevices(): Promise<string[]> {
    return FastbootService.scanDevices()
  }

  /**
   * 执行fastboot命令
   */
  static async executeFastbootCommand(
    command: string,
    args: string[] = []
  ): Promise<CommandResult> {
    const result = await FastbootService.executeCommand(command, args)
    
    return {
      success: result.success,
      output: result.output,
      error: result.error
    }
  }

  /**
   * 停止正在执行的进程
   */
  static stopProcess(processId: string): boolean {
    return FastbootService.stopProcess(processId)
  }

  /**
   * 获取设备信息
   */
  static async getDeviceInfo(deviceId: string): Promise<DeviceInfo | null> {
    try {
      const result = await this.executeFastbootCommand('getvar', ['all'])

      if (result.success) {
        return {
          id: deviceId,
          name: 'Redmi K20 PRO',
          status: 'connected',
          type: 'fastboot'
        }
      }
    } catch (error) {
      console.error('获取设备信息失败:', error)
    }

    return null
  }

  /**
   * 验证设备连接
   */
  static async validateDeviceConnection(deviceId: string): Promise<boolean> {
    const devices = await this.scanDevices()
    return devices.includes(deviceId)
  }
}
