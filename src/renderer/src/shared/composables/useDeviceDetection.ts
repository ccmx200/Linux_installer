// 设备检测可组合函数
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 设备检测可组合函数
 */
export function useDeviceDetection(): {
  devices: import('vue').Ref<string[]>
  isScanning: import('vue').Ref<boolean>
  lastScanTime: import('vue').Ref<number>
  isDeviceConnected: import('vue').ComputedRef<boolean>
  scanDevices: () => Promise<void>
  startAutoScan: (interval?: number) => void
  stopAutoScan: () => void
  clearDevices: () => void
} {
  const devices = ref<string[]>([])
  const isScanning = ref(false)
  const lastScanTime = ref(0)
  const intervalId = ref<number | null>(null)

  const isDeviceConnected = computed(() => devices.value.length > 0)

  const scanDevices = async (): Promise<void> => {
    isScanning.value = true
    try {
      const result = await window.api.ipcRenderer.invoke('scanDevices')
      // 后端返回的是设备ID数组，直接赋值
      devices.value = Array.isArray(result) ? result : []
      lastScanTime.value = Date.now()
    } catch (error) {
      console.error('Device scan failed:', error)
      devices.value = []
    } finally {
      isScanning.value = false
    }
  }

  const startAutoScan = (interval = 3000): void => {
    stopAutoScan()
    scanDevices()
    intervalId.value = window.setInterval(scanDevices, interval)
  }

  const stopAutoScan = (): void => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  const clearDevices = (): void => {
    devices.value = []
    lastScanTime.value = 0
  }

  onMounted(() => {
    startAutoScan()
  })

  onUnmounted(() => {
    stopAutoScan()
  })

  return {
    devices,
    isScanning,
    lastScanTime,
    isDeviceConnected,
    scanDevices,
    startAutoScan,
    stopAutoScan,
    clearDevices
  }
}
