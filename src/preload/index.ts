import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import * as path from 'path'
import * as fs from 'fs'

// Custom APIs for renderer
const api = {
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.on(channel, listener),
    once: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.once(channel, listener),
    removeListener: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.removeListener(channel, listener),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
  },
  // 下载相关
  download: {
    start: (url: string, destination: string, options: unknown) =>
      ipcRenderer.invoke('download:start', url, destination, options),
    pause: (downloadId: string) => ipcRenderer.invoke('download:pause', downloadId),
    resume: (downloadId: string) => ipcRenderer.invoke('download:resume', downloadId),
    stop: (downloadId: string) => ipcRenderer.invoke('download:stop', downloadId),
    testMirrorSpeed: (mirror: string, downloadPath?: string) =>
      ipcRenderer.invoke('download:testMirrorSpeed', mirror, downloadPath),
    testMultipleMirrors: (mirrors: string[], downloadPath?: string) =>
      ipcRenderer.invoke('download:testMultipleMirrors', mirrors, downloadPath)
  },
  // 解压相关
  extract: {
    extractFile: (filePath: string, outputDir: string) =>
      ipcRenderer.invoke('extract:extractFile', filePath, outputDir),
    isCompressedFile: (filePath: string) =>
      ipcRenderer.invoke('extract:isCompressedFile', filePath),
    getFileList: (filePath: string) => ipcRenderer.invoke('extract:getFileList', filePath),
    compressFile: (sourcePath: string, outputPath: string) =>
      ipcRenderer.invoke('extract:compressFile', sourcePath, outputPath)
  },
  // 命令执行相关
  executeCommand: (command: string) => ipcRenderer.invoke('executeCommand', command),
  // 文件系统相关
  path: path,
  fs: fs
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
