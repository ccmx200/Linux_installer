// 镜像管理服务 - 处理镜像列表的获取、解析和管理

import { ConfigService } from '../../config/services/configService'

// 镜像信息类型
export interface MirrorInfo {
  url: string
  latency: number
  status: 'testing' | 'available' | 'unavailable'
  name?: string
  region?: string
}

/**
 * 镜像管理服务
 */
export class MirrorManagerService {
  private static cachedMirrors: string[] = []
  private static mirrorInfoCache: Map<string, MirrorInfo> = new Map()
  private static lastFetchTime: number = 0
  private static readonly CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存

  /**
   * 获取镜像列表
   */
  static async getMirrors(forceRefresh: boolean = false): Promise<string[]> {
    try {
      // 检查缓存是否有效
      const now = Date.now()
      if (
        !forceRefresh &&
        this.cachedMirrors.length > 0 &&
        now - this.lastFetchTime < this.CACHE_DURATION
      ) {
        return this.cachedMirrors
      }

      // 从配置中获取镜像列表
      const config = await ConfigService.fetchConfig()
      const mirrors = ConfigService.getMirrors(config)

      // 验证和清理镜像列表
      const validatedMirrors = this.validateAndCleanMirrors(mirrors)

      // 更新缓存
      this.cachedMirrors = validatedMirrors
      this.lastFetchTime = now

      return validatedMirrors
    } catch (error) {
      console.error('获取镜像列表失败:', error)

      // 如果缓存中有镜像列表，使用缓存
      if (this.cachedMirrors.length > 0) {
        return this.cachedMirrors
      }

      // 返回空列表
      return []
    }
  }

  /**
   * 验证和清理镜像列表
   */
  static validateAndCleanMirrors(mirrors: string[]): string[] {
    if (!Array.isArray(mirrors)) {
      return []
    }

    return mirrors
      .filter((mirror) => typeof mirror === 'string' && mirror.trim())
      .map((mirror) => this.cleanMirrorUrl(mirror))
      .filter((mirror, index, self) => self.indexOf(mirror) === index) // 去重
  }

  /**
   * 清理镜像URL
   */
  static cleanMirrorUrl(mirror: string): string {
    let cleaned = mirror.trim()

    // 确保URL以http或https开头
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`
    }

    // 移除末尾的斜杠
    cleaned = cleaned.replace(/\/$/, '')

    return cleaned
  }

  /**
   * 构建镜像信息
   */
  static buildMirrorInfo(url: string, latency: number, status: MirrorInfo['status']): MirrorInfo {
    return {
      url,
      latency,
      status,
      name: this.extractMirrorName(url),
      region: this.guessMirrorRegion(url)
    }
  }

  /**
   * 从URL中提取镜像名称
   */
  static extractMirrorName(url: string): string {
    try {
      const hostname = new URL(url).hostname
      return hostname.split('.').slice(-2).join('.')
    } catch {
      return '未知镜像'
    }
  }

  /**
   * 猜测镜像区域
   */
  static guessMirrorRegion(url: string): string {
    const regions: Record<string, string[]> = {
      中国: ['cn', 'china', 'baidu', 'aliyun', 'tencent'],
      美国: ['us', 'america', 'github'],
      日本: ['jp', 'japan'],
      新加坡: ['sg', 'singapore']
    }

    const lowerUrl = url.toLowerCase()

    for (const [region, keywords] of Object.entries(regions)) {
      if (keywords.some((keyword) => lowerUrl.includes(keyword))) {
        return region
      }
    }

    return '未知区域'
  }

  /**
   * 缓存镜像信息
   */
  static cacheMirrorInfo(mirror: MirrorInfo): void {
    this.mirrorInfoCache.set(mirror.url, mirror)
  }

  /**
   * 获取缓存的镜像信息
   */
  static getCachedMirrorInfo(url: string): MirrorInfo | undefined {
    return this.mirrorInfoCache.get(url)
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    this.cachedMirrors = []
    this.mirrorInfoCache.clear()
    this.lastFetchTime = 0
  }

  /**
   * 构建镜像下载URL
   */
  static buildMirrorDownloadUrl(mirror: string, originalUrl: string): string {
    const cleanMirror = this.cleanMirrorUrl(mirror)
    let cleanOriginalUrl = originalUrl.trim()

    // 确保原始URL以http或https开头
    if (!cleanOriginalUrl.startsWith('http://') && !cleanOriginalUrl.startsWith('https://')) {
      cleanOriginalUrl = `https://${cleanOriginalUrl}`
    }

    // 直接将完整的原始URL（包括协议）拼接在镜像URL后面
    return `${cleanMirror}/${cleanOriginalUrl}`
  }
}
