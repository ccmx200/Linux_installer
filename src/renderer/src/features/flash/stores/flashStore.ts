// 刷入状态管理
import { defineStore } from 'pinia'

interface Log {
  id: string
  message: string
  level: 'info' | 'success' | 'error' | 'warning'
  timestamp: number
}

interface Progress {
  percentage: number
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused'
}

export const useFlashStore = defineStore('flash', {
  state: () => ({
    isFlashing: false,
    progress: {
      percentage: 0,
      status: 'idle' as Progress['status']
    },
    logs: [] as Log[],
    error: null as string | null
  }),

  getters: {
    recentLogs: (state) => {
      return state.logs.slice(-50) // 只显示最近50条日志
    }
  },

  actions: {
    startFlash() {
      this.isFlashing = true
      this.progress.status = 'running'
      this.error = null
    },

    completeFlash() {
      this.isFlashing = false
      this.progress.percentage = 100
      this.progress.status = 'completed'
      this.addLog('刷入完成', 'success')
    },

    failFlash(error: string) {
      this.isFlashing = false
      this.progress.status = 'failed'
      this.error = error
      this.addLog(`刷入失败: ${error}`, 'error')
    },

    pauseFlash() {
      this.isFlashing = false
      this.progress.status = 'paused'
      this.addLog('刷入暂停', 'info')
    },

    updateProgress(current: number, total: number) {
      this.progress.percentage = Math.round((current / total) * 100)
    },

    addLog(message: string, level: Log['level'] = 'info') {
      const newLog: Log = {
        id: Date.now().toString(),
        message,
        level,
        timestamp: Date.now()
      }
      this.logs.push(newLog)
    },

    clearLogs() {
      this.logs = []
    },

    $reset() {
      this.isFlashing = false
      this.progress = {
        percentage: 0,
        status: 'idle'
      }
      this.logs = []
      this.error = null
    }
  }
})
