// 应用常量定义

// 设备检测相关常量
export const DEVICE_SCAN_INTERVAL = 3000 // 设备扫描间隔（毫秒）
export const MAX_DEVICE_ID_LENGTH = 20 // 设备ID最大显示长度

// 镜像类型常量
export const IMAGE_TYPES = {
  BOOT: 'boot',
  CACHE: 'cache',
  USERDATA: 'userdata'
} as const

export const IMAGE_TYPE_CONFIG = [
  {
    key: IMAGE_TYPES.BOOT,
    label: 'Boot镜像',
    description: '系统启动镜像文件',
    icon: '🚀',
    required: true
  },
  {
    key: IMAGE_TYPES.CACHE,
    label: 'Cache镜像',
    description: '系统缓存镜像文件',
    icon: '💾',
    required: false
  },
  {
    key: IMAGE_TYPES.USERDATA,
    label: 'UserData镜像',
    description: '用户数据镜像文件',
    icon: '👤',
    required: false
  }
] as const

// 刷入进度阶段常量
export const FLASH_STAGES = {
  PREPARING: '准备中',
  ERASING: '擦除分区',
  FLASHING: '刷入镜像',
  VERIFYING: '验证结果',
  COMPLETED: '完成'
} as const

// 通知类型常量
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
} as const

// 模态框类型常量
export const MODAL_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
} as const

// 颜色主题常量
export const COLORS = {
  PRIMARY: '#1e293b',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',

  GRAY_50: '#f8fafc',
  GRAY_100: '#f1f5f9',
  GRAY_200: '#e2e8f0',
  GRAY_300: '#cbd5e1',
  GRAY_400: '#94a3b8',
  GRAY_500: '#64748b',
  GRAY_600: '#475569',
  GRAY_700: '#334155',
  GRAY_800: '#1e293b',
  GRAY_900: '#0f172a'
} as const

// 动画常量
export const ANIMATION = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)'
  }
} as const

// 响应式断点常量
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
} as const

// 错误消息常量
export const ERROR_MESSAGES = {
  DEVICE_NOT_FOUND: '未检测到设备，请检查连接状态',
  IMAGE_NOT_SELECTED: '请选择镜像文件',
  FLASH_FAILED: '刷入过程失败，请检查日志',
  PERMISSION_DENIED: '权限不足，请以管理员身份运行',
  FILE_NOT_FOUND: '文件不存在或路径错误'
} as const

// 成功消息常量
export const SUCCESS_MESSAGES = {
  DEVICE_CONNECTED: '设备连接成功',
  IMAGE_SELECTED: '镜像选择成功',
  FLASH_COMPLETED: '刷入完成',
  SCAN_COMPLETED: '扫描完成'
} as const
