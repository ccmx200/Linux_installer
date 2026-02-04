// 配置服务
import { ref } from 'vue'

// 配置文件类型定义
export interface Config {
  version: string
  last_updated: string
  source: string
  release_tags: Record<string, string>
  images: {
    boot: {
      url: string
      description: string
      required: boolean
      size?: number
      size_human?: string
      last_modified?: string
      etag?: string
      info_endpoint?: string
    }
    cache: Record<
      string,
      {
        url: string
        description: string
        size?: number
        size_human?: string
        asset_id?: number
        uploaded_at?: string
        tag?: string
        info_endpoint?: string
        original_filename?: string
      }
    >
    userdata: Record<
      string,
      {
        url: string
        description: string
        extracted_file: string
        size?: number
        size_human?: string
        asset_id?: number
        uploaded_at?: string
        tag?: string
        info_endpoint?: string
      }
    >
  }
  mirror_list: string[]
  endpoints?: {
    config?: string
    file_info?: string
    download_proxy?: string
  }
  stats?: {
    total_distros?: number
    userdata_available?: number
    cache_available?: number
    warnings?: any
  }
}

// 缓存的配置文件
const cachedConfig = ref<Config | null>(null)
const configTimestamp = ref<number | null>(null)
const CONFIG_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

/**
 * 配置服务
 */
export class ConfigService {
  /**
   * 获取配置文件
   */
  static async fetchConfig(): Promise<Config> {
    try {
      // 检查缓存是否有效
      if (cachedConfig.value && configTimestamp.value) {
        const elapsed = Date.now() - configTimestamp.value
        if (elapsed < CONFIG_CACHE_DURATION) {
          console.log('使用缓存的配置文件')
          return cachedConfig.value
        }
      }

      // 模拟获取配置文件 - 使用与示例JSON相同的结构
      const config: Config = {
        version: '2.2.0',
        last_updated: '2026-02-03T00:54:34.039Z',
        source: 'GitHub/ccmx200/linux-xiaomi-raphael-uboot',
        release_tags: {
          'ubuntu-server': 'ubuntu-server-v6.18',
          'ubuntu-desktop': 'ubuntu-desktop-v6.18-phosh-core',
          'debian-server': 'debian-server-v6.18',
          'debian-desktop': 'debian-desktop-v6.18-phosh-core'
        },
        images: {
          boot: {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/u-boot/u-boot-sm8150-xiaomi-raphael.img.zip',
            description: '小米K20 Pro启动镜像',
            required: true,
            size: 564780,
            size_human: '551.54 KB',
            last_modified: 'Sun, 01 Feb 2026 03:26:44 GMT',
            etag: '"0x8DE6141B99F69C5"',
            info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fu-boot%2Fu-boot-sm8150-xiaomi-raphael.img.zip'
          },
          cache: {
            'ubuntu-server': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-server-v6.18/xiaomi-k20pro-boot.img',
              description: 'Ubuntu服务器版系统镜像 - 缓存分区',
              size: 268435456,
              size_human: '256 MB',
              asset_id: 348541137,
              uploaded_at: '2026-01-31T05:22:59Z',
              tag: 'ubuntu-server-v6.18',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fubuntu-server-v6.18%2Fxiaomi-k20pro-boot.img',
              original_filename: 'xiaomi-k20pro-boot.img'
            },
            'ubuntu-desktop': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-desktop-v6.18-phosh-core/xiaomi-k20pro-boot.img',
              description: 'Ubuntu桌面版系统镜像 - 缓存分区',
              size: 268435456,
              size_human: '256 MB',
              asset_id: 348544541,
              uploaded_at: '2026-01-31T05:31:57Z',
              tag: 'ubuntu-desktop-v6.18-phosh-core',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fubuntu-desktop-v6.18-phosh-core%2Fxiaomi-k20pro-boot.img',
              original_filename: 'xiaomi-k20pro-boot.img'
            },
            'debian-server': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-server-v6.18/xiaomi-k20pro-boot.img',
              description: 'Debian服务器版系统镜像 - 缓存分区',
              size: 268435456,
              size_human: '256 MB',
              asset_id: 348539621,
              uploaded_at: '2026-01-31T05:13:20Z',
              tag: 'debian-server-v6.18',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fdebian-server-v6.18%2Fxiaomi-k20pro-boot.img',
              original_filename: 'xiaomi-k20pro-boot.img'
            },
            'debian-desktop': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-desktop-v6.18-phosh-core/xiaomi-k20pro-boot.img',
              description: 'Debian桌面版系统镜像 - 缓存分区',
              size: 268435456,
              size_human: '256 MB',
              asset_id: 348544745,
              uploaded_at: '2026-01-31T05:32:58Z',
              tag: 'debian-desktop-v6.18-phosh-core',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fdebian-desktop-v6.18-phosh-core%2Fxiaomi-k20pro-boot.img',
              original_filename: 'xiaomi-k20pro-boot.img'
            }
          },
          userdata: {
            'ubuntu-server': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-server-v6.18/rootfs.7z',
              description: 'Ubuntu服务器版系统镜像',
              extracted_file: 'rootfs.img',
              size: 462923158,
              size_human: '441.48 MB',
              asset_id: 348541135,
              uploaded_at: '2026-01-31T05:23:04Z',
              tag: 'ubuntu-server-v6.18',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fubuntu-server-v6.18%2Frootfs.7z'
            },
            'ubuntu-desktop': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-desktop-v6.18-phosh-core/rootfs.7z',
              description: 'Ubuntu桌面版系统镜像',
              extracted_file: 'rootfs.img',
              size: 1762313750,
              size_human: '1.64 GB',
              asset_id: 348544539,
              uploaded_at: '2026-01-31T05:32:27Z',
              tag: 'ubuntu-desktop-v6.18-phosh-core',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fubuntu-desktop-v6.18-phosh-core%2Frootfs.7z'
            },
            'debian-server': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-server-v6.18/rootfs.7z',
              description: 'Debian服务器版系统镜像',
              extracted_file: 'rootfs.img',
              size: 266472780,
              size_human: '254.13 MB',
              asset_id: 348539619,
              uploaded_at: '2026-01-31T05:13:20Z',
              tag: 'debian-server-v6.18',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fdebian-server-v6.18%2Frootfs.7z'
            },
            'debian-desktop': {
              url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-desktop-v6.18-phosh-core/rootfs.7z',
              description: 'Debian桌面版系统镜像',
              extracted_file: 'rootfs.img',
              size: 1333983180,
              size_human: '1.24 GB',
              asset_id: 348544744,
              uploaded_at: '2026-01-31T05:33:24Z',
              tag: 'debian-desktop-v6.18-phosh-core',
              info_endpoint: '/file-info/https%3A%2F%2Fgithub.com%2Fccmx200%2Flinux-xiaomi-raphael-uboot%2Freleases%2Fdownload%2Fdebian-desktop-v6.18-phosh-core%2Frootfs.7z'
            }
          }
        },
        mirror_list: [
          'https://up-c1.cuicanmx.cn/',
          'https://up-c2.cuicanmx.cn/',
          'https://up-c3.cuicanmx.cn/',
          'https://github.akams.cn/',
          'https://gh.jasonzeng.dev/',
          'https://ghfast.top/',
          'https://wget.la/',
          'https://slink.ltd/',
          'https://gh.con.sh/',
          'https://proxy.zyun.vip/',
          'https://github.moeyy.xyz/',
          'https://gitclone.com/'
        ],
        endpoints: {
          config: '/auto-dl.json',
          file_info: '/file-info/{encoded_url}',
          download_proxy: '/{github_release_url}'
        },
        stats: {
          total_distros: 4,
          userdata_available: 4,
          cache_available: 4,
          warnings: null
        }
      }

      // 验证配置文件
      this.validateConfig(config)

      // 更新缓存
      cachedConfig.value = config
      configTimestamp.value = Date.now()

      console.log('配置文件获取成功')
      return config
    } catch (error) {
      console.error('获取配置文件失败:', error)

      // 如果有缓存，使用缓存
      if (cachedConfig.value) {
        console.log('使用缓存的配置文件')
        return cachedConfig.value
      }

      // 返回默认配置
      const defaultConfig = this.getDefaultConfig()
      console.log('使用默认配置文件')
      return defaultConfig
    }
  }

  /**
   * 获取缓存的配置文件
   */
  static getCachedConfig(): Config | null {
    return cachedConfig.value
  }

  /**
   * 获取默认配置
   */
  static getDefaultConfig(): Config {
    return {
      version: '2.2.0',
      last_updated: '2026-02-03T00:54:34.039Z',
      source: 'GitHub/ccmx200/linux-xiaomi-raphael-uboot',
      release_tags: {
        'ubuntu-server': 'ubuntu-server-v6.18',
        'ubuntu-desktop': 'ubuntu-desktop-v6.18-phosh-core',
        'debian-server': 'debian-server-v6.18',
        'debian-desktop': 'debian-desktop-v6.18-phosh-core'
      },
      images: {
        boot: {
          url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/u-boot/u-boot-sm8150-xiaomi-raphael.img.zip',
          description: '小米K20 Pro启动镜像',
          required: true
        },
        cache: {
          'ubuntu-server': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-server-v6.18/xiaomi-k20pro-boot.img',
            description: 'Ubuntu服务器版系统镜像 - 缓存分区'
          },
          'ubuntu-desktop': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-desktop-v6.18-phosh-core/xiaomi-k20pro-boot.img',
            description: 'Ubuntu桌面版系统镜像 - 缓存分区'
          },
          'debian-server': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-server-v6.18/xiaomi-k20pro-boot.img',
            description: 'Debian服务器版系统镜像 - 缓存分区'
          },
          'debian-desktop': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-desktop-v6.18-phosh-core/xiaomi-k20pro-boot.img',
            description: 'Debian桌面版系统镜像 - 缓存分区'
          }
        },
        userdata: {
          'ubuntu-server': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-server-v6.18/rootfs.7z',
            description: 'Ubuntu服务器版系统镜像',
            extracted_file: 'rootfs.img'
          },
          'ubuntu-desktop': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/ubuntu-desktop-v6.18-phosh-core/rootfs.7z',
            description: 'Ubuntu桌面版系统镜像',
            extracted_file: 'rootfs.img'
          },
          'debian-server': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-server-v6.18/rootfs.7z',
            description: 'Debian服务器版系统镜像',
            extracted_file: 'rootfs.img'
          },
          'debian-desktop': {
            url: 'https://github.com/ccmx200/linux-xiaomi-raphael-uboot/releases/download/debian-desktop-v6.18-phosh-core/rootfs.7z',
            description: 'Debian桌面版系统镜像',
            extracted_file: 'rootfs.img'
          }
        }
      },
      mirror_list: [
        'https://up-c1.cuicanmx.cn/',
        'https://up-c2.cuicanmx.cn/',
        'https://up-c3.cuicanmx.cn/',
        'https://github.akams.cn/',
        'https://gh.jasonzeng.dev/',
        'https://ghfast.top/',
        'https://wget.la/',
        'https://slink.ltd/',
        'https://gh.con.sh/',
        'https://proxy.zyun.vip/',
        'https://github.moeyy.xyz/',
        'https://gitclone.com/'
      ],
      endpoints: {
        config: '/auto-dl.json',
        file_info: '/file-info/{encoded_url}',
        download_proxy: '/{github_release_url}'
      },
      stats: {
        total_distros: 4,
        userdata_available: 4,
        cache_available: 4,
        warnings: null
      }
    }
  }

  /**
   * 验证配置文件
   */
  static validateConfig(config: unknown): asserts config is Config {
    if (!config) {
      throw new Error('配置文件为空')
    }

    // 将config转换为any类型以进行属性检查
    const configObj = config as any

    if (typeof configObj.version !== 'string') {
      throw new Error('配置文件中的版本格式错误')
    }

    if (typeof configObj.last_updated !== 'string') {
      throw new Error('配置文件中的最后更新时间格式错误')
    }

    if (typeof configObj.source !== 'string') {
      throw new Error('配置文件中的源格式错误')
    }

    if (typeof configObj.release_tags !== 'object' || configObj.release_tags === null) {
      throw new Error('配置文件中的发布标签格式错误')
    }

    if (typeof configObj.images !== 'object' || configObj.images === null) {
      throw new Error('配置文件中的镜像信息格式错误')
    }

    if (typeof configObj.images.boot !== 'object' || configObj.images.boot === null) {
      throw new Error('配置文件中的启动镜像信息格式错误')
    }

    if (typeof configObj.images.boot.url !== 'string') {
      throw new Error('配置文件中的启动镜像URL格式错误')
    }

    if (typeof configObj.images.boot.description !== 'string') {
      throw new Error('配置文件中的启动镜像描述格式错误')
    }

    if (typeof configObj.images.boot.required !== 'boolean') {
      throw new Error('配置文件中的启动镜像是否必需格式错误')
    }

    if (typeof configObj.images.cache !== 'object' || configObj.images.cache === null) {
      throw new Error('配置文件中的缓存镜像信息格式错误')
    }

    for (const key in configObj.images.cache) {
      const cache = configObj.images.cache[key]
      if (typeof cache !== 'object' || cache === null) {
        throw new Error(`配置文件中的${key}缓存镜像信息格式错误`)
      }
      if (typeof cache.url !== 'string') {
        throw new Error(`配置文件中的${key}缓存镜像URL格式错误`)
      }
      if (typeof cache.description !== 'string') {
        throw new Error(`配置文件中的${key}缓存镜像描述格式错误`)
      }
    }

    if (typeof configObj.images.userdata !== 'object' || configObj.images.userdata === null) {
      throw new Error('配置文件中的用户数据镜像信息格式错误')
    }

    for (const key in configObj.images.userdata) {
      const userdata = configObj.images.userdata[key]
      if (typeof userdata !== 'object' || userdata === null) {
        throw new Error(`配置文件中的${key}用户数据镜像信息格式错误`)
      }
      if (typeof userdata.url !== 'string') {
        throw new Error(`配置文件中的${key}用户数据镜像URL格式错误`)
      }
      if (typeof userdata.description !== 'string') {
        throw new Error(`配置文件中的${key}用户数据镜像描述格式错误`)
      }
      if (typeof userdata.extracted_file !== 'string') {
        throw new Error(`配置文件中的${key}用户数据镜像解压文件名格式错误`)
      }
    }

    if (!Array.isArray(configObj.mirror_list)) {
      throw new Error('配置文件中的镜像列表格式错误')
    }

    // 验证endpoints（可选）
    if (configObj.endpoints && typeof configObj.endpoints !== 'object') {
      throw new Error('配置文件中的endpoints格式错误')
    }

    // 验证stats（可选）
    if (configObj.stats && typeof configObj.stats !== 'object') {
      throw new Error('配置文件中的stats格式错误')
    }
  }

  /**
   * 获取镜像列表
   */
  static getMirrors(config: Config): string[] {
    return config.mirror_list || []
  }

  /**
   * 获取启动镜像URL
   */
  static getBootImageUrl(config: Config): string {
    return config.images?.boot?.url || ''
  }

  /**
   * 获取缓存镜像URL
   */
  static getCacheImageUrl(config: Config, distribution: string): string {
    return config.images?.cache?.[distribution]?.url || ''
  }

  /**
   * 获取用户数据镜像URL
   */
  static getUserdataImageUrl(config: Config, distribution: string): string {
    return config.images?.userdata?.[distribution]?.url || ''
  }

  /**
   * 获取启动镜像描述
   */
  static getBootImageDescription(config: Config): string {
    return config.images?.boot?.description || '启动镜像'
  }

  /**
   * 获取缓存镜像描述
   */
  static getCacheImageDescription(config: Config, distribution: string): string {
    return config.images?.cache?.[distribution]?.description || '缓存镜像'
  }

  /**
   * 获取用户数据镜像描述
   */
  static getUserdataImageDescription(config: Config, distribution: string): string {
    return config.images?.userdata?.[distribution]?.description || `${distribution}镜像`
  }

  /**
   * 获取启动镜像是否必需
   */
  static isBootImageRequired(config: Config): boolean {
    return config.images?.boot?.required ?? true
  }

  /**
   * 获取缓存镜像是否必需
   */
  static isCacheImageRequired(): boolean {
    return true
  }

  /**
   * 获取解压后的文件名
   */
  static getExtractedFileName(config: Config, distribution: string): string {
    return (
      config.images?.userdata?.[distribution]?.extracted_file ||
      `${distribution.toLowerCase()}-extracted.img`
    )
  }

  /**
   * 获取发布标签
   */
  static getReleaseTags(config: Config): Record<string, string> {
    return config.release_tags || {}
  }

  /**
   * 获取源信息
   */
  static getSource(config: Config): string {
    return config.source || ''
  }

  /**
   * 获取版本信息
   */
  static getVersion(config: Config): string {
    return config.version || '1.0.0'
  }

  /**
   * 获取最后更新时间
   */
  static getLastUpdated(config: Config): string {
    return config.last_updated || new Date().toISOString()
  }

  /**
   * 构建镜像URL
   */
  static buildMirrorUrl(mirror: string, originalUrl: string): string {
    // 清理镜像URL
    const cleanMirror = mirror.replace(/\/$/, '')

    // 处理GitHub地址
    if (originalUrl.includes('github.com')) {
      return `${cleanMirror}/${originalUrl.replace('https://', '')}`
    }

    // 处理其他地址
    if (originalUrl.startsWith('https://')) {
      return `${cleanMirror}/${originalUrl.replace('https://', '')}`
    }

    return originalUrl
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    cachedConfig.value = null
    configTimestamp.value = null
    console.log('配置文件缓存已清除')
  }
}
