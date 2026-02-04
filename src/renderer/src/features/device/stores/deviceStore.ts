// 设备状态管理
import { defineStore } from 'pinia'

export const useDeviceStore = defineStore('device', {
  state: () => ({
    devices: [] as string[],
    isScanning: false,
    isDeviceConnected: false,
    lastScanTime: 0
  }),

  getters: {
    connectedDevice: (state) => {
      return state.devices.length > 0 ? state.devices[0] : null
    }
  },

  actions: {
    async scanDevices() {
      this.isScanning = true
      try {
        const result = await window.api.ipcRenderer.invoke('scanDevices')
        // 后端返回的是设备ID数组，直接赋值
        this.devices = Array.isArray(result) ? result : []
        this.isDeviceConnected = this.devices.length > 0
        this.lastScanTime = Date.now()
      } catch (error) {
        console.error('Device scan failed:', error)
        this.devices = []
        this.isDeviceConnected = false
      } finally {
        this.isScanning = false
      }
    },

    clearDevices() {
      this.devices = []
      this.isDeviceConnected = false
    },

    $reset() {
      this.devices = []
      this.isScanning = false
      this.isDeviceConnected = false
      this.lastScanTime = 0
    }
  }
})
