import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import icon from '../../resources/icon.png?asset'
import { DownloadManager } from './services/downloadManager'
import { ExtractManager } from './services/extractManager'
import { DeviceManager } from './services/deviceManager'
import { FastbootService } from './services/fastbootService'

// 应用配置
interface AppConfig {
  downloadPath: string
  maxConcurrentDownloads: number
  retryAttempts: number
}

// 全局状态管理
class AppState {
  private static instance: AppState
  private _imagePaths: Record<string, string> = {
    boot: '',
    cache: '',
    userdata: ''
  }

  private _config: AppConfig = {
    downloadPath: join(app.getPath('downloads'), 'linux-installer'),
    maxConcurrentDownloads: 3,
    retryAttempts: 5
  }

  private constructor() {
    // 空构造函数
  }

  static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState()
    }
    return AppState.instance
  }

  get imagePaths(): Record<string, string> {
    return { ...this._imagePaths }
  }

  setImagePath(type: string, path: string): void {
    if (['boot', 'cache', 'userdata'].includes(type)) {
      this._imagePaths[type] = path
    }
  }

  get config(): AppConfig {
    return { ...this._config }
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    this._config = { ...this._config, ...newConfig }
  }
}

const appState = AppState.getInstance()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false, // 隐藏原生窗口框架
    titleBarStyle: 'hidden', // 隐藏标题栏
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 初始化服务管理器
function initializeServices(): void {
  try {
    DownloadManager.initialize()
    ExtractManager.initialize()
    FastbootService.initialize()
    DeviceManager.initialize()
  } catch (error) {
    console.error('Service initialization failed:', error)
  }
}

// 注册IPC事件处理程序
function registerIpcHandlers(): void {
  // 窗口控制
  ipcMain.on('minimizeWindow', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
  })

  ipcMain.on('closeWindow', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
  })

  // 文件选择
  ipcMain.handle('selectImageFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '镜像文件', extensions: ['img', 'bin', 'zip', '7z', 'tar', 'gz'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    return result
  })

  // 文件信息获取
  ipcMain.handle('getFileInfo', async (_, filePath: string) => {
    try {
      const stats = fs.statSync(filePath)
      return {
        size: stats.size,
        name: filePath.split(/[\\/]/).pop() || filePath,
        path: filePath
      }
    } catch (error) {
      console.error('Get file info failed:', error)
      throw error
    }
  })

  // 通用命令执行
  ipcMain.handle('executeCommand', async (_, command: string) => {
    const { exec } = await import('child_process')
    return new Promise((resolve) => {
      exec(command, { encoding: 'utf8' }, (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          resolve({ success: false, output: stderr || error.message })
        } else {
          resolve({ success: true, output: stdout })
        }
      })
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 初始化服务和注册IPC事件处理器
  initializeServices()
  registerIpcHandlers()

  // 选择镜像文件（兼容旧版本）
  ipcMain.handle('selectImage', async (_, type: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Image Files',
          extensions: ['img']
        }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      appState.setImagePath(type, filePath)
      return filePath
    }
    return null
  })

  // 选择文件夹
  ipcMain.handle('selectFolder', async (_, options: unknown) => {
    const opts = options as { title?: string; defaultPath?: string }
    const result = await dialog.showOpenDialog({
      title: opts.title,
      defaultPath: opts.defaultPath,
      properties: ['openDirectory', 'createDirectory', 'promptToCreate']
    })

    return result
  })

  // 检查镜像选择状态
  ipcMain.handle('checkImages', () => {
    const requiredImages = ['boot', 'cache', 'userdata']
    const imagePaths = appState.imagePaths
    const allSelected = requiredImages.every(
      (type) => imagePaths[type] && imagePaths[type].endsWith('.img')
    )
    return { success: allSelected }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
