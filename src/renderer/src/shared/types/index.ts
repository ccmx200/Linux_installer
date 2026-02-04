// 设备相关类型定义
export interface DeviceInfo {
  exists: boolean
  id: string
  status: string
}

// 镜像相关类型定义
export interface ImageInfo {
  id: string
  name: string
  version: string
  size: string
  description: string
  recommended: boolean
}

// 刷入日志类型定义
export interface FlashLog {
  id: string
  timestamp: number
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}

// 通知类型定义
export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  duration?: number
}

// 模态框类型定义
export interface ModalProps {
  visible: boolean
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  confirmText?: string
  cancelText?: string
}

// 状态管理类型定义
export interface DeviceStoreState {
  devices: string[]
  isScanning: boolean
  lastScanTime: number
  intervalId: number | null
}

export interface ImageStoreState {
  availableImages: ImageInfo[]
  selectedImage: ImageInfo | null
  isLoading: boolean
  error: string | null
}

export interface FlashStoreState {
  isFlashing: boolean
  progress: number
  logs: FlashLog[]
  error: string | null
}
