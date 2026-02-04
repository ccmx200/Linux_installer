// IPC事件接口
interface IpcEvent {
  sender: unknown
  senderId: number
}

// 自定义事件接口
interface CustomEvent<T = unknown> extends Event {
  readonly detail: T
}

declare const CustomEvent: {
  prototype: CustomEvent
  new <T>(type: string, eventInitDict?: CustomEventInit<T>): CustomEvent<T>
}

interface CustomEventInit<T = unknown> extends EventInit {
  detail?: T
}

// EventListener接口
declare global {
  type EventListener = (event: Event) => void
}

// 全局类型定义
declare interface Window {
  api: {
    ipcRenderer: {
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
      on: (channel: string, listener: (event: IpcEvent, ...args: unknown[]) => void) => void
      once: (channel: string, listener: (event: IpcEvent, ...args: unknown[]) => void) => void
      removeListener: (
        channel: string,
        listener: (event: IpcEvent, ...args: unknown[]) => void
      ) => void
      removeAllListeners: (channel: string) => void
    }
    download: {
      start: (url: string, destination: string, options: unknown) => Promise<string>
      pause: (downloadId: string) => Promise<void>
      resume: (downloadId: string) => Promise<void>
      stop: (downloadId: string) => Promise<void>
      testMirrorSpeed: (mirror: string, downloadPath?: string) => Promise<unknown>
      testMultipleMirrors: (mirrors: string[], downloadPath?: string) => Promise<unknown[]>
    }
    extract: {
      extractFile: (
        filePath: string,
        outputDir: string
      ) => Promise<{ success: boolean; error?: string }>
      isCompressedFile: (filePath: string) => Promise<boolean>
      getFileList: (filePath: string) => Promise<unknown[]>
      compressFile: (
        sourcePath: string,
        outputPath: string
      ) => Promise<{ success: boolean; error?: string }>
    }
    executeCommand: (command: string) => Promise<{ success: boolean; output: string }>
    path: unknown
    fs: unknown
  }
}
