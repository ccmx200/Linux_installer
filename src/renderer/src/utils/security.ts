// 安全工具 - 处理输入验证和权限控制

/**
 * 安全验证工具类
 */
export class SecurityValidator {
  /**
   * 验证文件路径安全性
   */
  static validateFilePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') {
      return false
    }

    // 检查路径注入攻击
    const dangerousPatterns = [
      /\/\.\.\//, // 路径遍历攻击
      /\\\.\.\\/, // Windows路径遍历攻击
      /\0/, // 空字节注入
      /\|/, // 命令注入
      /&/, // 命令注入
      /;/, // 命令注入
      /`/, // 命令注入
      /\$/, // 命令注入
      /\(/, // 命令注入
      /\)/, // 命令注入
      /\{/, // 命令注入
      /\}/, // 命令注入
      /\*/, // 通配符注入
      /\?/ // 通配符注入
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(filePath)) {
        return false
      }
    }

    // 检查路径长度限制
    if (filePath.length > 4096) {
      return false
    }

    return true
  }

  /**
   * 验证URL安全性
   */
  static validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false
    }

    try {
      const parsedUrl = new URL(url)

      // 只允许HTTP和HTTPS协议
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false
      }

      // 检查域名白名单（可选）
      const allowedDomains = [
        'github.com',
        'gitlab.com',
        'sourceforge.net',
        'ubuntu.com',
        'kernel.org'
      ]

      const domain = parsedUrl.hostname
      if (
        allowedDomains.length > 0 &&
        !allowedDomains.some((allowed) => domain.endsWith(allowed))
      ) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * 验证命令安全性
   */
  static validateCommand(command: string): boolean {
    if (!command || typeof command !== 'string') {
      return false
    }

    // 危险命令黑名单
    const dangerousCommands = [
      'rm ',
      'rm -rf',
      'del ',
      'format ',
      'mkfs',
      'dd ',
      'shutdown',
      'reboot',
      'init 0',
      'poweroff',
      'halt',
      'sudo',
      'su '
    ]

    const lowerCommand = command.toLowerCase()
    for (const dangerous of dangerousCommands) {
      if (lowerCommand.includes(dangerous)) {
        return false
      }
    }

    // 只允许特定的fastboot命令
    const allowedCommands = [
      'fastboot',
      'adb',
      'devices',
      'getvar',
      'erase',
      'flash',
      'reboot',
      'boot',
      'oem',
      'format',
      'set_active'
    ]

    const firstWord = lowerCommand.split(' ')[0]
    if (!allowedCommands.includes(firstWord)) {
      return false
    }

    return true
  }

  /**
   * 清理用户输入
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    // 移除危险字符
    return input
      .replace(/[<>"'&;`|$(){}\[\]*?]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000) // 限制长度
  }

  /**
   * 验证镜像文件哈希值（可选功能）
   */
  static async validateFileHash(
    filePath: string,
    expectedHash: string,
    algorithm: string = 'sha256'
  ): Promise<boolean> {
    try {
      // 这里可以实现文件哈希验证
      // 由于Electron的限制，需要主进程支持
      const result = await window.electron.ipcRenderer.invoke('validateFileHash', {
        filePath,
        expectedHash,
        algorithm
      })

      return result.success
    } catch (error) {
      console.error('文件哈希验证失败:', error)
      return false
    }
  }
}

/**
 * 权限管理类
 */
export class PermissionManager {
  private static permissions = new Map<string, boolean>()

  /**
   * 检查权限
   */
  static hasPermission(permission: string): boolean {
    return this.permissions.get(permission) || false
  }

  /**
   * 授予权限
   */
  static grantPermission(permission: string): void {
    this.permissions.set(permission, true)
  }

  /**
   * 撤销权限
   */
  static revokePermission(permission: string): void {
    this.permissions.set(permission, false)
  }

  /**
   * 验证操作权限
   */
  static validateOperation(operation: string, requiredPermissions: string[]): boolean {
    for (const permission of requiredPermissions) {
      if (!this.hasPermission(permission)) {
        console.warn(`操作"${operation}"需要权限: ${permission}`)
        return false
      }
    }
    return true
  }
}

// 预定义权限
export const PERMISSIONS = {
  DOWNLOAD_FILES: 'download_files',
  EXTRACT_FILES: 'extract_files',
  FLASH_DEVICE: 'flash_device',
  EXECUTE_COMMANDS: 'execute_commands',
  ACCESS_FILESYSTEM: 'access_filesystem'
} as const
