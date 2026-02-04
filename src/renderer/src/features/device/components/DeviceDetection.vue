<script setup lang="ts">
import { computed } from 'vue'
import { useDeviceDetection } from '../../../shared/composables/useDeviceDetection'
import { DeviceInfo } from '../../../shared/types'
import { DEVICE_SCAN_INTERVAL, MAX_DEVICE_ID_LENGTH } from '../../../shared/constants'

// 使用自定义钩子
const { devices, isScanning, isDeviceConnected, scanDevices } = useDeviceDetection()

// 计算属性
const connectionStatus = computed(() => {
  return isDeviceConnected.value ? 'connected' : 'disconnected'
})

const statusText = computed(() => {
  return isDeviceConnected.value ? '设备已连接' : '设备未连接'
})

const scanButtonText = computed(() => {
  return isScanning.value ? '扫描中...' : '扫描设备'
})

const deviceInfo = computed((): DeviceInfo => {
  if (devices.value.length > 0) {
    const deviceId = devices.value[0]
    const truncatedId =
      deviceId.length > MAX_DEVICE_ID_LENGTH
        ? `${deviceId.substring(0, MAX_DEVICE_ID_LENGTH)}...`
        : deviceId

    return {
      exists: true,
      id: truncatedId,
      status: '已连接'
    }
  }

  return {
    exists: false,
    id: '',
    status: '未连接'
  }
})

// 处理扫描
const handleScan = async (): Promise<void> => {
  await scanDevices()
}
</script>

<template>
  <div class="device-detection">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">设备检测</h1>
      <div class="page-subtitle">检测连接的设备状态</div>
    </div>

    <!-- 设备状态卡片 -->
    <div class="device-status-card">
      <div class="status-header">
        <div class="status-indicator" :class="connectionStatus">
          <div class="indicator-dot"></div>
          <div class="status-info">
            <div class="status-text">{{ statusText }}</div>
            <div class="status-detail">{{ deviceInfo.status }}</div>
          </div>
        </div>

        <button class="btn-scan" :disabled="isScanning" @click="handleScan">
          <span v-if="isScanning" class="scan-spinner"></span>
          {{ scanButtonText }}
        </button>
      </div>

      <!-- 设备信息 -->
      <div v-if="deviceInfo.exists" class="device-info">
        <div class="info-item">
          <span class="info-label">设备ID:</span>
          <span class="info-value device-id">{{ deviceInfo.id }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">扫描状态:</span>
          <span class="info-value">{{ isScanning ? '扫描中' : '就绪' }}</span>
        </div>
      </div>

      <!-- 未连接状态 -->
      <div v-else class="no-device-info">
        <div class="no-device-icon">📱</div>
        <div class="no-device-text">
          <h3>未检测到设备</h3>
          <p>请确保设备已正确连接并进入fastboot模式</p>
        </div>
      </div>

      <div class="scan-info">自动扫描间隔: {{ DEVICE_SCAN_INTERVAL / 1000 }}秒</div>
    </div>
  </div>
</template>

<style scoped>
.device-detection {
  display: flex;
  flex-direction: column;
  gap: var(--ev-space-xl);
  height: 100%;
  overflow-y: auto;
  background: var(--color-background-soft);
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: var(--ev-space-lg);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0 0 var(--ev-space-sm) 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 16px;
  color: var(--ev-c-text-3);
  margin: 0;
  font-weight: 400;
  opacity: 0.8;
}

/* 设备状态卡片 */
.device-status-card {
  background: var(--color-background);
  border-radius: 16px;
  padding: var(--ev-space-xl);
  box-shadow: var(--ev-shadow-sm);
  border: 1px solid var(--ev-c-white-border);
  transition: box-shadow var(--ev-transition-normal);
}

.device-status-card:hover {
  box-shadow: var(--ev-shadow-md);
}

/* 状态头部 */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--ev-space-lg);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--ev-space-md);
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: background-color var(--ev-transition-normal);
}

.status-indicator.connected .indicator-dot {
  background: var(--ev-c-success);
  box-shadow: 0 0 0 4px rgba(16, 124, 16, 0.2);
}

.status-indicator.disconnected .indicator-dot {
  background: var(--ev-c-danger);
  box-shadow: 0 0 0 4px rgba(209, 52, 56, 0.2);
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--ev-c-text-1);
}

.status-detail {
  font-size: 14px;
  color: var(--ev-c-text-3);
}

/* 扫描按钮 */
.btn-scan {
  display: flex;
  align-items: center;
  gap: var(--ev-space-sm);
  padding: var(--ev-space-md) var(--ev-space-xl);
  background: var(--ev-c-primary);
  color: var(--ev-c-text-inverse);
  border: none;
  border-radius: var(--ev-radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ev-transition-normal);
}

.btn-scan:hover:not(:disabled) {
  background: var(--ev-c-primary-light);
  transform: translateY(-1px);
}

.btn-scan:disabled {
  background: var(--ev-c-text-4);
  cursor: not-allowed;
  transform: none;
}

.scan-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 设备信息 */
.device-info {
  display: flex;
  flex-direction: column;
  gap: var(--ev-space-md);
  margin-bottom: var(--ev-space-lg);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--ev-space-md);
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ev-c-text-2);
  min-width: 80px;
}

.info-value {
  font-size: 14px;
  color: var(--ev-c-text-3);
}

/* 未连接状态 */
.no-device-info {
  display: flex;
  align-items: center;
  gap: var(--ev-space-lg);
  margin-bottom: var(--ev-space-lg);
  padding: var(--ev-space-xl);
  background: var(--color-background-soft);
  border-radius: 12px;
  text-align: center;
}

.no-device-icon {
  font-size: 48px;
  opacity: 0.6;
}

.no-device-text h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin: 0 0 var(--ev-space-sm) 0;
}

.no-device-text p {
  font-size: 14px;
  color: var(--ev-c-text-3);
  margin: 0;
  line-height: 1.4;
}

/* 扫描信息 */
.scan-info {
  font-size: 12px;
  color: var(--ev-c-text-3);
  text-align: center;
  opacity: 0.7;
}

/* 设备ID样式 */
.device-id {
  font-family: 'Monaco', 'Consolas', monospace;
  word-break: break-all;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .device-detection {
    padding: var(--ev-space-lg);
    gap: var(--ev-space-xl);
  }

  .device-status-card {
    padding: var(--ev-space-lg);
  }

  .status-header {
    flex-direction: column;
    gap: var(--ev-space-lg);
    text-align: center;
  }

  .no-device-info {
    flex-direction: column;
    gap: var(--ev-space-md);
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ev-space-xs);
  }

  .info-label {
    min-width: auto;
  }
}
</style>
