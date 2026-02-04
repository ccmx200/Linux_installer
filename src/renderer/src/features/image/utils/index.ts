// 镜像相关工具函数

/**
 * 验证文件路径是否为有效的镜像文件
 */
export function validateFilePath(filePath: string): boolean {
  if (!filePath) return false

  // 支持的镜像文件扩展名
  const validExtensions = ['.img', '.bin', '.zip', '.7z', '.gz']

  // 获取文件扩展名
  const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'))

  // 检查扩展名是否在有效列表中
  return validExtensions.includes(ext)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成唯一ID
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
