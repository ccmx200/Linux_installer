// Fastboot执行服务 - 专门处理Fastboot命令执行
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import { join } from 'path'

// Fastboot命令执行结果
interface FastbootResult {
  success: boolean
  output: string
  error?: string
  exitCode?: number
}

/**
 * Fastboot执行服务类
 */
export class FastbootService {
  private static activeProcesses: Map<string, ChildProcess> = new Map()
  private static fastbootPath: string = ''
  private static isInitialized: boolean = false

  /**
   * 初始化Fastboot服务
   */
  static initialize(): void {
    if (this.isInitialized) return
    
    this.findFastbootPath()
    this.isInitialized = true
    
    console.log('Fastboot service initialized, path:', this.fastbootPath)
  }

  /**
   * 查找fastboot可执行文件路径
   */
  private static findFastbootPath(): void {
    const possiblePaths = [
      // 打包后路径：位于resources目录中
      join(process.resourcesPath, 'bin/fastboot.exe'),
      // 开发环境路径
      join(__dirname, '../../bin/fastboot.exe'),
      join(process.cwd(), 'bin/fastboot.exe'),
      join(process.cwd(), 'fastboot.exe'),
      'fastboot.exe'
    ]

    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        this.fastbootPath = path
        console.log('Found fastboot at:', path)
        return
      }
    }

    // 如果找不到，尝试使用系统PATH中的fastboot
    this.fastbootPath = 'fastboot.exe'
    console.log('Using system fastboot from PATH')
  }

  /**
   * 验证Fastboot是否可用
   */
  static async validateFastboot(): Promise<boolean> {
    try {
      const result = await this.executeCommand('--version')
      return result.success && result.output.includes('version')
    } catch {
      return false
    }
  }

  /**
   * 执行Fastboot命令
   */
  static async executeCommand(command: string, args: string[] = []): Promise<FastbootResult> {
    this.initialize()
    
    return new Promise((resolve) => {
      const processId = `fastboot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const fullCommand = [command, ...args].join(' ')

      console.log(`Fastboot command: ${this.fastbootPath} ${fullCommand}`)

      // 设置超时（2分钟）
      const timeout = setTimeout(() => {
        this.stopProcess(processId)
        resolve({
          success: false,
          output: '',
          error: 'Command execution timeout (2 minutes)',
          exitCode: -1
        })
      }, 120000)

      try {
        const child = spawn(this.fastbootPath, [command, ...args], {
          shell: true,
          cwd: process.cwd()
        })

        this.activeProcesses.set(processId, child)

        let stdout = Buffer.alloc(0)
        let stderr = Buffer.alloc(0)

        child.stdout.on('data', (data: Buffer) => {
          stdout = Buffer.concat([stdout, data])
        })

        child.stderr.on('data', (data: Buffer) => {
          stderr = Buffer.concat([stderr, data])
        })

        child.on('close', (code: number) => {
          clearTimeout(timeout)
          this.activeProcesses.delete(processId)

          const output = this.decodeOutput(stdout, stderr)

          if (code === 0) {
            resolve({ success: true, output, exitCode: code })
          } else {
            resolve({
              success: false,
              output,
              error: `Command failed with exit code: ${code}`,
              exitCode: code
            })
          }
        })

        child.on('error', (error: Error) => {
          clearTimeout(timeout)
          this.activeProcesses.delete(processId)

          console.error(`Fastboot command failed: ${error.message}`)
          resolve({
            success: false,
            output: '',
            error: error.message,
            exitCode: -1
          })
        })
      } catch (error) {
        clearTimeout(timeout)
        resolve({
          success: false,
          output: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          exitCode: -1
        })
      }
    })
  }

  /**
   * 扫描连接的设备
   */
  static async scanDevices(): Promise<string[]> {
    try {
      const result = await this.executeCommand('devices')

      console.log('Fastboot scan devices result:', {
        success: result.success,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode
      })

      if (result.success) {
        const devices = result.output
          .split('\n')
          .filter((line) => line.trim() && !line.includes('List of devices'))
          .map((line) => {
            // Handle format: "deviceID\t fastboot"
            const parts = line.split('\t')
            if (parts.length >= 2 && parts[1].includes('fastboot')) {
              return parts[0]?.trim()
            }
            return null
          })
          .filter((id): id is string => id !== null && id.length > 0)

        console.log('Parsed device list:', devices)
        return devices
      }

      console.log('Fastboot scan devices failed, error:', result.error)
      return []
    } catch (error) {
      console.error('Device scan exception:', error)
      return []
    }
  }

  /**
   * 解码命令输出
   */
  private static decodeOutput(stdout: Buffer, stderr: Buffer): string {
    let output = ''

    // 优先使用stdout
    if (stdout.length > 0) {
      output = stdout.toString('utf8')
    }

    // 如果stdout为空，使用stderr
    if (!output && stderr.length > 0) {
      output = stderr.toString('utf8')
    }

    return output.trim()
  }

  /**
   * 停止正在执行的进程
   */
  static stopProcess(processId: string): boolean {
    const process = this.activeProcesses.get(processId)
    if (process) {
      process.kill()
      this.activeProcesses.delete(processId)
      return true
    }
    return false
  }

  /**
   * 获取Fastboot路径
   */
  static getFastbootPath(): string {
    return this.fastbootPath
  }

  /**
   * 清理所有进程
   */
  static cleanup(): void {
    for (const [processId, process] of this.activeProcesses) {
      process.kill()
      this.activeProcesses.delete(processId)
    }
  }
}