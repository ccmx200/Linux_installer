<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFlashStore } from '../stores/flashStore'
import { useDeviceStore } from '../../device/stores/deviceStore'
import { useImageStore } from '../../image/stores/imageStore'
import { useModal } from '../../../shared/composables/modalService'
import { ConfigService } from '../../config/services/configService'
import { DownloadService } from '../../download/services/downloadService'
import { ExtractService } from '../../../shared/services/extractService'
import MirrorSelectionModal from '../../image/components/MirrorSelectionModal.vue'

// 使用从 preload 脚本暴露的模块
const path = (window.api as any).path
const fs = (window.api as any).fs

const flashStore = useFlashStore()
const deviceStore = useDeviceStore()
const imageStore = useImageStore()
const modalService = useModal()

// 界面状态
const currentView = ref<'initial' | 'progress'>('initial')
const currentStep = ref(1)
const totalSteps = ref(4)
const isDownloading = ref(false)
const isTransitioning = ref(false)

// 自动安装相关状态
const downloadProgress = ref(0)
const downloadStatus = ref('')
const downloadPath = ref('')

// 镜像选择相关状态
const showMirrorModal = ref(false)
const selectedMirror = ref<string | null>(null)
const useMirror = ref(false)
const availableMirrors = ref<string[]>([])

// 初始化时获取镜像列表
const initMirrors = async (): Promise<void> => {
  try {
    // 使用缓存的配置文件
    const cachedConfig = ConfigService.getCachedConfig()
    if (cachedConfig) {
      availableMirrors.value = ConfigService.getMirrors(cachedConfig)
    } else {
      // 如果缓存不存在，尝试重新下载
      const config = await ConfigService.fetchConfig()
      availableMirrors.value = ConfigService.getMirrors(config)
    }
  } catch (error) {
    console.error('获取镜像列表失败:', error)
    // 如果获取失败，使用默认镜像列表
    availableMirrors.value = [
      'https://up-c1.cuicanmx.cn/',
      'https://up-c2.cuicanmx.cn/',
      'https://up-c3.cuicanmx.cn/',
      'https://wget.la/',
      'https://gh.ddlc.top/',
      'https://ghps.cc/',
      'https://ghproxy.net/',
      'https://slink.ltd/',
      'https://gh.con.sh/',
      'https://proxy.zyun.vip/',
      'https://github.moeyy.xyz/',
      'https://gitclone.com/'
    ]
  }
}

// 计算属性
const progressPercentage = computed(() => {
  if (!isDownloading.value) {
    return flashStore.progress.percentage
  }

  // 自动安装进度计算
  const stepProgress = ((currentStep.value - 1) / totalSteps.value) * 100
  const currentStepProgress = (downloadProgress.value / 100) * (100 / totalSteps.value)
  return Math.min(stepProgress + currentStepProgress, 100)
})

const progressStatus = computed(() => {
  if (isDownloading.value) {
    return getAutoInstallStatus()
  }

  const statusMap = {
    running: '执行中',
    completed: '完成',
    failed: '失败',
    paused: '暂停',
    idle: '就绪'
  }
  return statusMap[flashStore.progress.status] || '就绪'
})

const canStartFlash = computed(() => {
  return !flashStore.isFlashing && deviceStore.isDeviceConnected && imageStore.hasSelectedImage
})

// 判断当前是否为自动安装模式
const isAutoInstallMode = computed(() => {
  return isDownloading.value || flashStore.progress.status === 'running'
})

// 获取当前步骤显示文本
const getCurrentStepText = (): string => {
  const status = flashStore.progress.status
  const statusMap = {
    running: '刷入中',
    completed: '已完成',
    failed: '已失败',
    paused: '已暂停',
    idle: '就绪'
  }
  return statusMap[status] || '就绪'
}

const getAutoInstallStatus = (): string => {
  const stepMap = {
    1: '下载u-boot文件',
    2: '下载系统镜像',
    3: '解压系统文件',
    4: '刷入系统'
  }
  return stepMap[currentStep.value] || '处理中'
}

// 开始刷入流程
const startFlashing = async (): Promise<void> => {
  const imageSelectionData = imageStore.getSelectionData

  if (imageSelectionData.mode === 'auto') {
    await startAutoInstall()
  } else {
    await startManualFlash()
  }
}

// 自动安装流程
const startAutoInstall = async (): Promise<void> => {
  const imageSelectionData = imageStore.getSelectionData

  // 第一步：显示下载位置选择弹窗
  const downloadResult = await modalService.showDownloadLocation(
    '选择下载位置',
    `您选择了自动安装 ${imageSelectionData.distribution} 系统。请选择系统镜像的下载位置。`,
    downloadPath.value
  )

  if (!downloadResult.confirmed) {
    return
  }

  downloadPath.value = downloadResult.downloadPath || downloadPath.value

  // 第二步：显示镜像选择弹窗
  showMirrorModal.value = true

  const mirrorChoice = await new Promise<{
    useMirror: boolean
    mirror?: string
    useGithub?: boolean
    cancelled?: boolean
  }>((resolve) => {
    const handleMirrorSelect = (event: CustomEvent): void => {
      resolve({ useMirror: true, mirror: event.detail as string })
      window.removeEventListener('mirrorSelected', handleMirrorSelect as EventListener)
      window.removeEventListener('mirrorClosed', handleMirrorClose as EventListener)
      window.removeEventListener('useGithub', handleUseGithub as EventListener)
    }

    const handleUseGithub = (): void => {
      resolve({ useGithub: true, useMirror: false })
      window.removeEventListener('mirrorSelected', handleMirrorSelect as EventListener)
      window.removeEventListener('mirrorClosed', handleMirrorClose as EventListener)
      window.removeEventListener('useGithub', handleUseGithub as EventListener)
    }

    const handleMirrorClose = (): void => {
      resolve({ useMirror: false, cancelled: true })
      window.removeEventListener('mirrorSelected', handleMirrorSelect as EventListener)
      window.removeEventListener('mirrorClosed', handleMirrorClose as EventListener)
      window.removeEventListener('useGithub', handleUseGithub as EventListener)
    }

    window.addEventListener('mirrorSelected', handleMirrorSelect as EventListener)
    window.addEventListener('mirrorClosed', handleMirrorClose as EventListener)
    window.addEventListener('useGithub', handleUseGithub as EventListener)
  })

  showMirrorModal.value = false

  if (mirrorChoice.cancelled) {
    return
  }

  if (mirrorChoice.useGithub) {
    selectedMirror.value = null
    useMirror.value = false
  } else if (mirrorChoice.useMirror && mirrorChoice.mirror) {
    selectedMirror.value = mirrorChoice.mirror
    useMirror.value = true
  } else {
    selectedMirror.value = null
    useMirror.value = false
  }

  // 第三步：显示数据删除警告（使用双重确认）
  const confirmed = await modalService.showWarningWithDoubleConfirmation(
    '自动安装警告',
    `您选择了自动安装模式，将下载并安装 ${imageSelectionData.distribution} 系统。\n` +
      '确定要继续吗？',
    '开始安装',
    '取消',
    'auto'
  )

  if (!confirmed) {
    return
  }

  // 开始安装流程
  await beginAutoInstallProcess()
}

// 手动安装流程
const startManualFlash = async (): Promise<void> => {
  // 直接显示警告确认（手动安装不需要下载和镜像选择）
  const confirmed = await modalService.showWarningWithDoubleConfirmation(
    '手动安装警告',
    '您选择了手动安装模式，将使用已有系统镜像进行刷入。\n' +
    '确定要继续吗？',
    '开始刷入',
    '取消',
    'manual'
  )

  if (!confirmed) {
    return
  }

  await beginManualFlashProcess()
}

// 开始自动安装过程
const beginAutoInstallProcess = async (): Promise<void> => {
  isTransitioning.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))

  currentView.value = 'progress'
  isTransitioning.value = false
  isDownloading.value = true

  try {
    await autoInstallProcess()
  } catch (error) {
    console.error('自动安装失败:', error)
    await modalService.showInfo('自动安装失败', `自动安装过程中出现错误: ${error}`)
    isDownloading.value = false
  }
}

// 开始手动刷入过程
const beginManualFlashProcess = async (): Promise<void> => {
  isTransitioning.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))

  currentView.value = 'progress'
  isTransitioning.value = false
  flashStore.startFlash()

  try {
    // 手动安装直接刷入，不需要下载步骤
    flashStore.addLog('开始手动刷入流程', 'info')
    flashStore.addLog('手动安装模式：直接使用已有镜像文件进行刷入', 'info')
    
    // 直接执行刷入操作（用户应已准备好镜像文件）
    await manualFlashProcess()
  } catch (error) {
    console.error('手动刷入失败:', error)
    
    // 优化错误提示显示方式
    let errorMessage = '手动刷入过程中出现未知错误'
    
    if (error instanceof Error) {
      // 根据错误类型提供更友好的提示
      if (error.message.includes('设备未连接')) {
        errorMessage = '设备未连接或未进入fastboot模式，请检查设备连接状态'
      } else if (error.message.includes('文件不存在')) {
        errorMessage = '系统镜像文件不存在，请确保已准备好正确的镜像文件'
      } else if (error.message.includes('fastboot')) {
        errorMessage = 'Fastboot命令执行失败，请检查设备连接和驱动状态'
      } else {
        errorMessage = `手动刷入失败: ${error.message}`
      }
    }
    
    await modalService.showInfo('手动刷入失败', errorMessage)
  }
}

// 手动刷入流程（直接使用已有镜像文件）
const manualFlashProcess = async (): Promise<void> => {
  try {
    // 手动安装直接刷入，使用用户已选择的镜像文件
    flashStore.addLog('手动刷入模式：使用已选择的镜像文件', 'info')
    
    // 获取用户选择的镜像文件路径
    const imagePaths = imageStore.imagePaths
    
    // 验证镜像文件是否存在
    if (!imagePaths.boot || !imagePaths.cache || !imagePaths.userdata) {
      throw new Error('镜像文件不完整，请确保已选择所有必要的镜像文件')
    }
    
    flashStore.addLog(`已选择镜像文件：\n- Boot: ${imagePaths.boot}\n- Cache: ${imagePaths.cache}\n- Userdata: ${imagePaths.userdata}`, 'info')
    
    // 步骤1: 验证设备连接
    flashStore.addLog('步骤1: 验证设备连接', 'info')
    const devicesResult = await executeFastbootCommand('devices')
    if (!devicesResult.success || !devicesResult.output.includes('fastboot')) {
      throw new Error('设备未在fastboot模式下连接，请确保设备已进入fastboot模式')
    }
    flashStore.updateProgress(10, 100)
    flashStore.addLog('刷入进度: 10% - 设备连接验证成功', 'info')

    // 步骤2: 擦除dtbo分区
    flashStore.addLog('步骤2: 擦除dtbo分区', 'info')
    const eraseDtboResult = await executeFastbootCommand('erase dtbo')
    if (!eraseDtboResult.success) {
      throw new Error(`擦除dtbo分区失败: ${eraseDtboResult.output}`)
    }
    flashStore.updateProgress(15, 100)
    flashStore.addLog('刷入进度: 15% - dtbo分区擦除成功', 'info')

    // 步骤3: 刷入cache镜像
    flashStore.addLog('步骤3: 刷入cache镜像', 'info')
    const flashCacheResult = await executeFastbootCommand(`flash cache "${imagePaths.cache}"`)
    if (!flashCacheResult.success) {
      throw new Error(`刷入cache镜像失败: ${flashCacheResult.output}`)
    }
    flashStore.updateProgress(30, 100)
    flashStore.addLog('刷入进度: 30% - cache镜像刷入成功', 'info')

    // 步骤4: 刷入boot镜像
    flashStore.addLog('步骤4: 刷入boot镜像', 'info')
    const flashBootResult = await executeFastbootCommand(`flash boot "${imagePaths.boot}"`)
    if (!flashBootResult.success) {
      throw new Error(`刷入boot镜像失败: ${flashBootResult.output}`)
    }
    flashStore.updateProgress(45, 100)
    flashStore.addLog('刷入进度: 45% - boot镜像刷入成功', 'info')

    // 步骤5: 刷入userdata镜像
    flashStore.addLog('步骤5: 刷入userdata镜像', 'info')
    const flashUserdataResult = await executeFastbootCommand(`flash userdata "${imagePaths.userdata}"`)
    if (!flashUserdataResult.success) {
      throw new Error(`刷入userdata镜像失败: ${flashUserdataResult.output}`)
    }
    flashStore.updateProgress(90, 100)
    flashStore.addLog('刷入进度: 90% - userdata镜像刷入成功', 'info')

    // 刷入完成，显示手动重启提示
    flashStore.updateProgress(100, 100)
    flashStore.addLog('刷入进度: 100% - 系统镜像刷入完成', 'info')
    flashStore.addLog('系统刷入完成！请手动重启设备以启动新系统', 'success')

    // 刷入完成
    flashStore.completeFlash()
    
    // 显示刷入执行完成弹窗
    await modalService.showFlashExecution(
      '刷入完成',
      '系统镜像已成功刷入设备！\n\n' +
      '设备数据已成功写入，系统安装完成。',
      '确定',
      true,
      false,
      100
    )
  } catch (error) {
    console.error('手动刷入失败:', error)
    throw error
  }
}

// 自动安装流程
const autoInstallProcess = async (): Promise<void> => {
  const imageSelectionData = imageStore.getSelectionData
  const distribution = imageSelectionData.distribution!

  // 创建统一的下载目录
  const installDir = path.join(downloadPath.value, distribution, 'install')

  try {
    // 确保安装目录存在
    if (!fs.existsSync(installDir)) {
      fs.mkdirSync(installDir, { recursive: true })
    }

    flashStore.addLog(`创建统一安装目录: ${installDir}`, 'info')

    // 使用缓存的配置文件
    let config = ConfigService.getCachedConfig()
    if (!config) {
      // 如果缓存不存在，尝试重新下载
      downloadStatus.value = '正在获取配置文件...'
      config = await ConfigService.fetchConfig()
    }

    // 步骤1: 下载u-boot文件
    currentStep.value = 1
    downloadProgress.value = 0
    downloadStatus.value = '正在下载u-boot文件...'
    await downloadConfigFile(config, installDir)

    // 步骤2: 下载系统镜像
    currentStep.value = 2
    downloadProgress.value = 0
    downloadStatus.value = '正在下载系统镜像...'
    await downloadSystemImages(config, distribution, installDir)

    // 步骤3: 解压系统文件
    currentStep.value = 3
    downloadProgress.value = 0
    downloadStatus.value = '正在解压系统文件...'
    await extractSystemFiles(config, distribution, installDir)

    // 步骤4: 开始刷入
    currentStep.value = 4
    downloadProgress.value = 0
    downloadStatus.value = '正在刷入系统...'

    isDownloading.value = false
    flashStore.startFlash()
    await flashImages(installDir)
  } catch (error) {
    console.error('自动安装失败:', error)
    flashStore.failFlash(error instanceof Error ? error.message : '未知错误')
    await modalService.showInfo('自动安装失败', `安装过程中出现错误: ${error}`)
  }
}

// 下载u-boot文件
const downloadConfigFile = async (config: unknown, installDir: string): Promise<void> => {
  flashStore.addLog('开始下载u-boot文件', 'info')

  try {
    const bootUrl = ConfigService.getBootImageUrl(config as any)
    const finalUrl =
      useMirror.value && selectedMirror.value
        ? ConfigService.buildMirrorUrl(selectedMirror.value, bootUrl)
        : bootUrl

    flashStore.addLog(`下载源: ${useMirror.value ? selectedMirror.value : 'GitHub'}`, 'info')
    flashStore.addLog(`下载URL: ${finalUrl}`, 'info')

    // 使用统一的安装目录
    const downloadDir = path.join(installDir, 'config')
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }

    // 获取文件名
    const fileName = path.basename(bootUrl)
    const destination = path.join(downloadDir, fileName)

    flashStore.addLog(`下载目标: ${destination}`, 'info')

    // 实际执行下载操作
    await DownloadService.downloadFile(
      finalUrl,
      downloadDir,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763'
        },
        retry: { maxRetries: 3, delay: 3000 },
        override: { skip: true, skipSmaller: true }
      },
      (progress) => {
        downloadProgress.value = progress.progress
        // 格式化下载速度（转换为MB/s）
        const speedMBps = (progress.speed / (1024 * 1024)).toFixed(2)
        // 格式化已下载和总大小（转换为MB）
        const downloadedMB = (progress.downloaded / (1024 * 1024)).toFixed(2)
        const totalMB = (progress.total / (1024 * 1024)).toFixed(2)
        flashStore.addLog(
          `下载u-boot文件进度: ${Math.round(progress.progress)}% (${speedMBps} MB/s, ${downloadedMB} MB / ${totalMB} MB)`,
          'info'
        )
      }
    )

    // 检查并解压u-boot文件（如果是压缩文件）
    const bootFilePath = path.join(downloadDir, fileName)
    const bootFileExtension = path.extname(fileName).toLowerCase()

    // 创建boot目录
    const bootDir = path.join(installDir, 'boot')
    if (!fs.existsSync(bootDir)) {
      fs.mkdirSync(bootDir, { recursive: true })
    }

    if (bootFileExtension === '.zip' || bootFileExtension === '.7z') {
      flashStore.addLog(`使用7zip解压${bootFileExtension === '.7z' ? '.7z' : '.zip'}文件`, 'info')

      // 解压文件到boot目录
      await ExtractService.extractFile(bootFilePath, bootDir, (progress) => {
        downloadProgress.value = progress
        flashStore.addLog(`解压 u-boot 文件进度: ${Math.round(progress)}%`, 'info')
      })
    } else {
      // 如果不是压缩文件，直接复制到boot目录
      const bootDestPath = path.join(bootDir, 'u-boot.img')
      fs.copyFileSync(bootFilePath, bootDestPath)
      flashStore.addLog(`复制 u-boot 文件到: ${bootDestPath}`, 'info')
    }

    flashStore.addLog('u-boot文件下载完成', 'success')
  } catch (error) {
    flashStore.addLog(`u-boot文件下载失败: ${error}`, 'error')
    throw error
  }
}

// 下载系统镜像
const downloadSystemImages = async (
  config: unknown,
  distribution: string,
  installDir: string
): Promise<void> => {
  flashStore.addLog(`开始下载${distribution}系统镜像`, 'info')

  try {
    const cacheUrl = ConfigService.getCacheImageUrl(config as any, distribution)
    const userdataUrl = ConfigService.getUserdataImageUrl(config as any, distribution)

    const finalCacheUrl =
      useMirror.value && selectedMirror.value
        ? ConfigService.buildMirrorUrl(selectedMirror.value, cacheUrl)
        : cacheUrl

    const finalUserdataUrl =
      useMirror.value && selectedMirror.value
        ? ConfigService.buildMirrorUrl(selectedMirror.value, userdataUrl)
        : userdataUrl

    flashStore.addLog(`下载源: ${useMirror.value ? selectedMirror.value : 'GitHub'}`, 'info')
    flashStore.addLog(`缓存镜像URL: ${finalCacheUrl}`, 'info')
    flashStore.addLog(`系统镜像URL: ${finalUserdataUrl}`, 'info')

    // 使用统一的安装目录
    const downloadDir = path.join(installDir, 'system')
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }

    // 下载缓存镜像
    flashStore.addLog('开始下载缓存镜像', 'info')
    const cacheFileName = path.basename(cacheUrl)
    const cacheDestination = path.join(downloadDir, cacheFileName)
    flashStore.addLog(`缓存镜像目标: ${cacheDestination}`, 'info')

    await DownloadService.downloadFile(
      finalCacheUrl,
      downloadDir,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763'
        },
        retry: { maxRetries: 3, delay: 3000 },
        override: { skip: true, skipSmaller: true }
      },
      (progress) => {
        // 缓存镜像占总进度的30%
        downloadProgress.value = progress.progress * 0.3
        // 格式化下载速度（转换为MB/s）
        const speedMBps = (progress.speed / (1024 * 1024)).toFixed(2)
        // 格式化已下载和总大小（转换为MB）
        const downloadedMB = (progress.downloaded / (1024 * 1024)).toFixed(2)
        const totalMB = (progress.total / (1024 * 1024)).toFixed(2)
        flashStore.addLog(
          `下载缓存镜像进度: ${Math.round(progress.progress)}% (${speedMBps} MB/s, ${downloadedMB} MB / ${totalMB} MB)`,
          'info'
        )
      }
    )

    // 创建boot目录
    const bootDir = path.join(installDir, 'boot')
    if (!fs.existsSync(bootDir)) {
      fs.mkdirSync(bootDir, { recursive: true })
    }

    // 将缓存镜像移动到boot目录
    const cacheDestPath = path.join(bootDir, 'xiaomi-k20pro-boot.img')
    fs.copyFileSync(cacheDestination, cacheDestPath)
    flashStore.addLog(`缓存镜像移动到: ${cacheDestPath}`, 'info')

    flashStore.addLog('缓存镜像下载完成', 'success')

    // 下载系统镜像
    flashStore.addLog('开始下载系统镜像', 'info')
    const userdataFileName = path.basename(userdataUrl)
    const userdataDestination = path.join(downloadDir, userdataFileName)
    flashStore.addLog(`系统镜像目标: ${userdataDestination}`, 'info')

    await DownloadService.downloadFile(
      finalUserdataUrl,
      downloadDir,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763'
        },
        retry: { maxRetries: 3, delay: 3000 },
        override: { skip: true, skipSmaller: true }
      },
      (progress) => {
        // 系统镜像占总进度的70%
        downloadProgress.value = 30 + progress.progress * 0.7
        // 格式化下载速度（转换为MB/s）
        const speedMBps = (progress.speed / (1024 * 1024)).toFixed(2)
        // 格式化已下载和总大小（转换为MB）
        const downloadedMB = (progress.downloaded / (1024 * 1024)).toFixed(2)
        const totalMB = (progress.total / (1024 * 1024)).toFixed(2)
        flashStore.addLog(
          `下载系统镜像进度: ${Math.round(progress.progress)}% (${speedMBps} MB/s, ${downloadedMB} MB / ${totalMB} MB)`,
          'info'
        )
      }
    )

    flashStore.addLog(`${distribution} 系统镜像下载完成`, 'success')
  } catch (error) {
    flashStore.addLog(`系统镜像下载失败: ${error}`, 'error')
    throw error
  }
}

// 解压系统文件
const extractSystemFiles = async (
  config: unknown,
  distribution: string,
  installDir: string
): Promise<void> => {
  flashStore.addLog(`开始解压${distribution}系统文件`, 'info')

  try {
    const extractedFile = ConfigService.getExtractedFileName(config as any, distribution)
    flashStore.addLog(`解压目标文件: ${extractedFile}`, 'info')

    // 使用统一的安装目录
    const downloadDir = path.join(installDir, 'system')
    if (!fs.existsSync(downloadDir)) {
      throw new Error(`下载目录不存在: ${downloadDir}`)
    }

    // 获取系统镜像文件路径
    const userdataUrl = ConfigService.getUserdataImageUrl(config as any, distribution)
    const userdataFileName = path.basename(userdataUrl)
    const userdataFilePath = path.join(downloadDir, userdataFileName)

    if (!fs.existsSync(userdataFilePath)) {
      throw new Error(`系统镜像文件不存在: ${userdataFilePath}`)
    }

    flashStore.addLog(`解压源文件: ${userdataFilePath}`, 'info')

    // 检查文件扩展名
    const fileExtension = path.extname(userdataFileName).toLowerCase()

    if (fileExtension === '.7z' || fileExtension === '.zip') {
      // 使用7zip-min解压文件
      flashStore.addLog(`使用7zip解压${fileExtension === '.7z' ? '.7z' : '.zip'}文件`, 'info')

      // 解压文件
      await ExtractService.extractFile(userdataFilePath, downloadDir, (progress) => {
        downloadProgress.value = progress
        flashStore.addLog(`解压 ${distribution} 系统文件进度: ${Math.round(progress)}%`, 'info')
      })
    } else {
      throw new Error(`不支持的文件格式: ${fileExtension}`)
    }

    // 检查解压结果
    const extractedFilePath = path.join(downloadDir, extractedFile)
    flashStore.addLog(`解压结果: ${extractedFilePath}`, 'info')

    // 验证解压结果
    if (!fs.existsSync(extractedFilePath)) {
      throw new Error(`解压失败: 未找到解压后的文件 ${extractedFilePath}`)
    }

    flashStore.addLog(`${distribution} 系统文件解压完成`, 'success')
  } catch (error) {
    flashStore.addLog(`系统文件解压失败: ${error}`, 'error')
    throw error
  }
}

// 执行fastboot命令
const executeFastbootCommand = async (
  command: string
): Promise<{ success: boolean; output: string }> => {
  try {
    // 解析命令和参数
    const parts = command.split(' ')
    const cmd = parts[0]
    const args = parts.slice(1)
    
    flashStore.addLog(`执行命令: ${command}`, 'info')
    
    // 使用正确的IPC调用方式
    const result = await window.api.ipcRenderer.invoke('executeFastbootCommand', cmd, args)
    
    // 处理多行输出
    const resultObj = result as { success: boolean; output: string }
    if (resultObj.output) {
      const lines = resultObj.output.split('\n')
      lines.forEach((line, index) => {
        if (line.trim()) {
          flashStore.addLog(`命令输出 (${index + 1}): ${line}`, 'info')
        }
      })
    } else {
      flashStore.addLog(`命令输出: (无输出)`, 'info')
    }

    return resultObj
  } catch (error) {
    flashStore.addLog(`执行命令失败: ${error}`, 'error')
    throw error
  }
}

// 刷入镜像
const flashImages = async (installDir: string): Promise<void> => {
  flashStore.addLog('开始刷入镜像', 'info')

  try {
    // 检查设备是否连接
    if (!deviceStore.isDeviceConnected) {
      throw new Error('设备未连接，请确保设备已正确连接到电脑')
    }

    flashStore.addLog('设备已连接，开始刷入流程', 'info')

    // 检查镜像文件是否存在
    const imageSelectionData = imageStore.getSelectionData
    const distribution = imageSelectionData.distribution

    if (!distribution) {
      throw new Error('未选择系统镜像，请先选择系统镜像')
    }

    const config = ConfigService.getCachedConfig()
    if (!config) {
      throw new Error('配置文件不存在，请重新下载配置文件')
    }

    // 获取镜像文件路径
    const cacheImagePath = path.join(installDir, 'boot', 'xiaomi-k20pro-boot.img')
    const bootImagePath = path.join(installDir, 'boot', 'u-boot.img')
    const userdataImagePath = path.join(installDir, 'system', 'rootfs.img')

    // 检查镜像文件是否存在
    if (!fs.existsSync(cacheImagePath)) {
      throw new Error(`缓存镜像文件不存在: ${cacheImagePath}`)
    }
    if (!fs.existsSync(bootImagePath)) {
      throw new Error(`boot镜像文件不存在: ${bootImagePath}`)
    }
    if (!fs.existsSync(userdataImagePath)) {
      throw new Error(`userdata镜像文件不存在: ${userdataImagePath}`)
    }

    flashStore.addLog(`缓存镜像路径: ${cacheImagePath}`, 'info')
    flashStore.addLog(`boot镜像路径: ${bootImagePath}`, 'info')
    flashStore.addLog(`userdata镜像路径: ${userdataImagePath}`, 'info')

    // 步骤1: 验证设备连接
    flashStore.addLog('步骤1: 验证设备连接', 'info')
    const devicesResult = await executeFastbootCommand('devices')
    if (!devicesResult.success || !devicesResult.output.includes('fastboot')) {
      throw new Error('设备未在fastboot模式下连接，请确保设备已进入fastboot模式')
    }
    flashStore.updateProgress(10, 100)
    flashStore.addLog('刷入进度: 10% - 设备连接验证成功', 'info')

    // 步骤2: 擦除dtbo分区
    flashStore.addLog('步骤2: 擦除dtbo分区', 'info')
    const eraseDtboResult = await executeFastbootCommand('erase dtbo')
    if (!eraseDtboResult.success) {
      throw new Error(`擦除dtbo分区失败: ${eraseDtboResult.output}`)
    }
    flashStore.updateProgress(15, 100)
    flashStore.addLog('刷入进度: 15% - dtbo分区擦除成功', 'info')

    // 步骤3: 刷入cache镜像
    flashStore.addLog('步骤3: 刷入cache镜像', 'info')
    const flashCacheResult = await executeFastbootCommand(`flash cache "${cacheImagePath}"`)
    if (!flashCacheResult.success) {
      throw new Error(`刷入cache镜像失败: ${flashCacheResult.output}`)
    }
    flashStore.updateProgress(30, 100)
    flashStore.addLog('刷入进度: 30% - cache镜像刷入成功', 'info')

    // 步骤4: 刷入boot镜像
    flashStore.addLog('步骤4: 刷入boot镜像', 'info')
    const flashBootResult = await executeFastbootCommand(`flash boot "${bootImagePath}"`)
    if (!flashBootResult.success) {
      throw new Error(`刷入boot镜像失败: ${flashBootResult.output}`)
    }
    flashStore.updateProgress(45, 100)
    flashStore.addLog('刷入进度: 45% - boot镜像刷入成功', 'info')

    // 步骤5: 刷入userdata镜像
    flashStore.addLog('步骤5: 刷入userdata镜像', 'info')
    const flashUserdataResult = await executeFastbootCommand(
      `flash userdata "${userdataImagePath}"`
    )
    if (!flashUserdataResult.success) {
      throw new Error(`刷入userdata镜像失败: ${flashUserdataResult.output}`)
    }
    flashStore.updateProgress(90, 100)
    flashStore.addLog('刷入进度: 90% - userdata镜像刷入成功', 'info')

    // 刷入完成，显示手动重启提示
    flashStore.updateProgress(100, 100)
    flashStore.addLog('刷入进度: 100% - 系统镜像刷入完成', 'info')
    flashStore.addLog('系统刷入完成！请手动重启设备以启动新系统', 'success')

    // 刷入完成，显示手动重启提示
    flashStore.completeFlash()
    
    // 显示刷入执行完成弹窗
    await modalService.showFlashExecution(
      '刷入完成',
      '系统镜像已成功刷入设备！\n\n' +
      '设备数据已成功写入，系统安装完成。',
      '确定',
      true,
      false,
      100
    )
  } catch (error) {
    flashStore.addLog(`刷入失败: ${error}`, 'error')
    throw error
  }
}

const clearLogs = (): void => {
  flashStore.logs = []
}

const handleMirrorSelect = (mirror: string): void => {
  window.dispatchEvent(new CustomEvent('mirrorSelected', { detail: mirror }))
}

const handleMirrorClose = (): void => {
  window.dispatchEvent(new CustomEvent('mirrorClosed'))
}

const handleUseGithub = (): void => {
  window.dispatchEvent(new CustomEvent('useGithub'))
}

onMounted(() => {
  deviceStore.scanDevices()
  initMirrors()
})

onUnmounted(() => {
  flashStore.$reset()
})
</script>

<template>
  <div class="flash-execution">
    <!-- 初始界面 -->
    <div
      v-if="currentView === 'initial'"
      class="initial-view"
      :class="{ transitioning: isTransitioning }"
    >
      <div class="initial-content">
        <div class="rocket-icon">🚀</div>
        <h1 class="initial-title">准备刷入</h1>
        <p class="initial-description">点击下方按钮开始刷入</p>
        <button class="flash-button" :disabled="!canStartFlash" @click="startFlashing">
          <span class="button-icon">🔥</span>
          <span class="button-text">开始刷入</span>
        </button>

        <!-- 状态提示 -->
        <div v-if="!canStartFlash" class="status-hint">
          <p class="hint-text">请确保设备已连接且所有镜像已选择</p>
        </div>
      </div>
    </div>

    <!-- 进度界面 -->
    <div
      v-if="currentView === 'progress'"
      class="progress-view"
      :class="{ transitioning: isTransitioning }"
    >
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">{{ isDownloading ? '自动安装' : '刷入执行' }}</h1>
        <div
          class="status-indicator"
          :class="{
            completed: flashStore.progress.status === 'completed',
            downloading: isDownloading
          }"
        >
          <span class="status-icon">
            {{ isDownloading ? '📥' : flashStore.progress.status === 'completed' ? '✅' : '⏳' }}
          </span>
          <span class="status-text">{{ progressStatus }}</span>
        </div>
      </div>

      <!-- 自动安装进度 -->
      <div v-if="isDownloading" class="auto-install-progress">
        <div class="step-indicator">
          <div class="step-label">步骤 {{ currentStep }}/{{ totalSteps }}</div>
          <div class="step-description">{{ downloadStatus }}</div>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${downloadProgress}%` }"></div>
            <div class="progress-indicator" :style="{ left: `${downloadProgress}%` }">
              <span class="indicator-text">{{ downloadProgress }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度区域 -->
      <div class="progress-section">
        <div class="section-header">
          <h2 class="section-title">{{ isDownloading ? '自动安装进度' : '刷入进度' }}</h2>
          <div class="progress-percentage">{{ progressPercentage }}%</div>
        </div>

        <!-- 进度条 -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progressPercentage}%` }">
              <span class="indicator-text">{{ progressPercentage }}%</span>
            </div>
          </div>

          <div class="progress-status">
            <span class="status-label">当前状态:</span>
            <span class="status-value">{{ progressStatus }}</span>
          </div>
        </div>
      </div>

      <!-- 执行日志 -->
      <div class="logs-section">
        <div class="section-header">
          <h2 class="section-title">执行日志</h2>
          <div class="logs-actions">
            <button
              class="btn-clear"
              :disabled="flashStore.logs.length === 0 || flashStore.isFlashing || isDownloading"
              @click="clearLogs"
            >
              清空日志
            </button>
            <span class="logs-count">{{ flashStore.logs.length }} 条日志</span>
          </div>
        </div>

        <div class="logs-container">
          <div v-if="flashStore.logs.length === 0" class="empty-logs">
            <div class="empty-icon">📋</div>
            <div class="empty-content">
              <h3 class="empty-title">暂无日志</h3>
              <p class="empty-description">
                {{ isDownloading ? '自动安装开始后将显示执行日志' : '刷入开始后将显示执行日志' }}
              </p>
            </div>
          </div>

          <div v-else ref="logsContainer" class="logs-list">
            <div
              v-for="log in flashStore.recentLogs"
              :key="log.id"
              class="log-item"
              :class="log.level"
            >
              <span class="log-time">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>
              <span class="log-level-indicator" :class="log.level">
                {{
                  log.level === 'error'
                    ? '❌'
                    : log.level === 'success'
                      ? '✅'
                      : log.level === 'info'
                        ? 'ℹ️'
                        : '📝'
                }}
              </span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 刷入状态 -->
      <div class="system-info-section">
        <div class="section-header">
          <h2 class="section-title">刷入状态</h2>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">设备状态:</span>
            <span
              class="info-value"
              :class="deviceStore.isDeviceConnected ? 'connected' : 'disconnected'"
            >
              {{ deviceStore.isDeviceConnected ? '已连接' : '未连接' }}
            </span>
          </div>
          <div v-if="isAutoInstallMode" class="info-item">
            <span class="info-label">下载路径:</span>
            <span class="info-value">{{ downloadPath }}</span>
          </div>
          <div v-if="isAutoInstallMode" class="info-item">
            <span class="info-label">镜像源:</span>
            <span class="info-value">{{ useMirror ? selectedMirror : 'GitHub' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前步骤:</span>
            <span class="info-value">{{ isDownloading ? `步骤 ${currentStep}/${totalSteps}` : getCurrentStepText() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 镜像选择弹窗 -->
    <MirrorSelectionModal
      v-if="showMirrorModal"
      :mirrors="availableMirrors"
      :is-open="showMirrorModal"
      @close="handleMirrorClose"
      @select="handleMirrorSelect"
      @use-github="handleUseGithub"
    />
  </div>
</template>

<style scoped>
.flash-execution {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background-soft);
  position: relative;
}

/* 初始界面 */
.initial-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  opacity: 1;
  transition: all 0.5s ease;
}

.initial-view.transitioning {
  opacity: 0;
  transform: translateY(-20px);
}

.initial-content {
  text-align: center;
  max-width: 400px;
}

.rocket-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.8;
}

.initial-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0 0 16px 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  letter-spacing: -0.5px;
}

.initial-description {
  font-size: 16px;
  color: var(--ev-c-text-2);
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.flash-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 32px;
  background: var(--ev-c-primary);
  color: var(--ev-c-text-inverse);
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
}

.flash-button:hover:not(:disabled) {
  background: var(--ev-c-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
}

.flash-button:disabled {
  background: var(--ev-c-text-4);
  cursor: not-allowed;
  opacity: 0.6;
}

.button-icon {
  font-size: 20px;
}

.status-hint {
  margin-top: 24px;
  padding: 16px;
  background: var(--color-background-mute);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 8px;
}

.hint-text {
  font-size: 14px;
  color: var(--ev-c-text-3);
  margin: 0;
  text-align: center;
}

/* 进度界面 */
.progress-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  opacity: 1;
  transition: all 0.5s ease;
}

.progress-view.transitioning {
  opacity: 0;
  transform: translateY(20px);
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  letter-spacing: -0.5px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--color-background-mute);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.status-indicator.completed {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--ev-c-success);
}

.status-indicator.downloading {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--ev-c-primary);
}

.status-icon {
  font-size: 16px;
}

/* 自动安装进度 */
.auto-install-progress {
  margin-bottom: 24px;
  padding: 24px;
  background: var(--color-background);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.step-indicator {
  margin-bottom: 20px;
}

.step-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-label::before {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--ev-c-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.step-description {
  font-size: 15px;
  color: var(--ev-c-text-3);
  line-height: 1.5;
  padding-left: 20px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 进度区域 */
.progress-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin: 0;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 700;
  color: var(--ev-c-primary);
}

.progress-container {
  margin-bottom: 16px;
}

.progress-bar {
  position: relative;
  height: 12px;
  background: var(--color-background-mute);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ev-c-primary), var(--ev-c-primary-light));
  border-radius: 6px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: progress-shine 2s infinite;
}

.progress-indicator {
  position: absolute;
  top: -30px;
  transform: translateX(-50%);
  background: var(--ev-c-primary);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  z-index: 1;
}

@keyframes progress-shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-label {
  color: var(--ev-c-text-3);
}

.status-value {
  color: var(--ev-c-text-1);
  font-weight: 500;
}

/* 执行日志 */
.logs-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.logs-container {
  flex: 1;
  background: var(--color-background);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  padding: 24px;
  background: var(--color-background-soft);
}

.empty-icon {
  font-size: 64px;
  opacity: 0.2;
  margin-bottom: 20px;
}

.empty-content {
  text-align: center;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ev-c-text-2);
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 14px;
  color: var(--ev-c-text-3);
  margin: 0;
  line-height: 1.5;
}

.logs-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 20px;
}

/* 自定义滚动条 */
.logs-list::-webkit-scrollbar {
  width: 8px;
}

.logs-list::-webkit-scrollbar-track {
  background: var(--color-background-mute);
  border-radius: 4px;
}

.logs-list::-webkit-scrollbar-thumb {
  background: var(--ev-c-text-4);
  border-radius: 4px;
}

.logs-list::-webkit-scrollbar-thumb:hover {
  background: var(--ev-c-text-3);
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--ev-c-white-border);
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.info {
  color: var(--ev-c-text-2);
}

.log-item.success {
  color: var(--ev-c-success);
  background: rgba(16, 185, 129, 0.05);
  padding-left: 12px;
  border-left: 3px solid var(--ev-c-success);
  margin-left: -12px;
  margin-right: -12px;
  padding-right: 12px;
}

.log-item.error {
  color: var(--ev-c-danger);
  background: rgba(239, 68, 68, 0.05);
  padding-left: 12px;
  border-left: 3px solid var(--ev-c-danger);
  margin-left: -12px;
  margin-right: -12px;
  padding-right: 12px;
}

.log-time {
  color: var(--ev-c-text-4);
  min-width: 90px;
  flex-shrink: 0;
  font-weight: 500;
}

.log-level-indicator {
  min-width: 20px;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.btn-clear {
  padding: 8px 16px;
  background: var(--color-background);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 6px;
  color: var(--ev-c-text-2);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover:not(:disabled) {
  background: var(--color-background-mute);
  color: var(--ev-c-text-1);
}

.btn-clear:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 系统信息 */
.system-info-section {
  margin-top: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  background: var(--color-background);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--color-background-soft);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.info-label {
  font-size: 13px;
  color: var(--ev-c-text-3);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  color: var(--ev-c-text-1);
  font-weight: 600;
  word-break: break-all;
}

.info-value.connected {
  color: var(--ev-c-success);
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-value.connected::before {
  content: '✅';
  font-size: 14px;
}

.info-value.disconnected {
  color: var(--ev-c-danger);
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-value.disconnected::before {
  content: '❌';
  font-size: 14px;
}
</style>
