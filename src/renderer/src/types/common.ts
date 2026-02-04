// 通用类型定义
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DownloadProgress {
  progress: number
  speed: number
  downloaded: number
  total: number
  state: 'idle' | 'downloading' | 'paused' | 'completed' | 'failed'
}

export interface DeviceInfo {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'unknown'
  type: 'fastboot' | 'adb' | 'recovery'
}

export interface ImageInfo {
  id: string
  name: string
  version: string
  size: string
  description: string
  url: string
  mirrors: string[]
}

export interface FlashProgress {
  step: string
  progress: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 错误详情接口
interface ErrorDetails {
  originalError?: unknown
  method?: string
  [key: string]: unknown
}

// 错误类型
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: ErrorDetails
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// 配置接口
export interface AppConfig {
  downloadPath: string
  maxConcurrentDownloads: number
  retryAttempts: number
  autoUpdate: boolean
  language: string
  theme: 'light' | 'dark'
}
