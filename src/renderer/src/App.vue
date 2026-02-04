<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue'
import DeviceDetection from './features/device/components/DeviceDetection.vue'
import ImageSelection from './features/image/components/ImageSelection.vue'
import FlashExecution from './features/flash/components/FlashExecution.vue'
import Notification from './shared/components/Notification.vue'
import ModalContainer from './shared/components/modals/ModalContainer.vue'
import { useModal } from './shared/composables/modalService'
import { useNotification } from './shared/composables/useNotification'
import { ConfigService } from './features/config/services/configService'
import { useFlashStore } from './features/flash/stores/flashStore'

const currentPage = ref(0)
const pages = ['设备检测', '镜像选择', '刷入执行']
const flashStore = useFlashStore()

// 配置文件下载状态
const configStatus = ref<'initializing' | 'downloading' | 'completed' | 'error'>('initializing')
const configError = ref<string | null>(null)

// 计算属性：判断是否应该锁定页面导航
const isNavigationLocked = computed(() => {
  // 当在刷入执行页面且正在刷入时，锁定导航
  return currentPage.value === 2 && (flashStore.isFlashing || flashStore.progress.status === 'running')
})

const goToPage = (index: number): void => {
  // 如果导航被锁定，不允许切换页面
  if (isNavigationLocked.value && index !== currentPage.value) {
    return
  }
  currentPage.value = index
}

// 窗口控制方法
const minimizeWindow = (): void => {
  window.api.ipcRenderer.send('minimizeWindow')
}

const closeWindow = (): void => {
  window.api.ipcRenderer.send('closeWindow')
}

// 计算当前页面的状态
const currentStatus = computed(() => {
  const statuses = ['就绪', '就绪', '就绪']
  return statuses[currentPage.value]
})

// 计算配置文件状态文本
const configStatusText = computed(() => {
  switch (configStatus.value) {
    case 'initializing':
      return '远程配置文件初始化中...'
    case 'downloading':
      return '正在获取远程配置文件...'
    case 'completed':
      return '远程配置文件已就绪'
    case 'error':
      return `远程配置文件获取失败: ${configError.value || '未知错误'}`
    default:
      return '远程配置文件就绪'
  }
})

// 初始化模态框系统
const modalService = useModal()

// 初始化通知系统
const notification = useNotification()

// 提供通知系统给子组件
provide('notification', notification)
provide('modalService', modalService)

// 应用启动时下载配置文件
onMounted(async () => {
  try {
    configStatus.value = 'downloading'
    await ConfigService.fetchConfig()
    configStatus.value = 'completed'
    notification.success('配置文件下载成功，已获取最新的系统配置和镜像列表')
  } catch (error) {
    console.error('配置文件下载失败:', error)
    configStatus.value = 'error'
    configError.value = error instanceof Error ? error.message : '未知错误'
    notification.warning('配置文件下载失败，将使用默认配置，请检查网络连接')
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 通知组件 -->
    <Notification
      v-for="item in notification.notifications.value"
      :key="item.id"
      :visible="item.visible"
      :message="item.message"
      :type="item.type"
      :duration="item.duration"
      :position="item.position"
      @close="notification.hideNotification(item.id)"
    />

    <!-- 弹窗容器 -->
    <ModalContainer />

    <!-- 简洁标题栏 -->
    <header class="app-header">
      <div class="header-content">
        <div class="app-brand">
          <div class="app-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path d="M2 17L12 22L22 17" fill="currentColor" />
              <path d="M2 12L12 17L22 12" fill="currentColor" />
            </svg>
          </div>
          <h1 class="app-title">Linux 安装器</h1>
        </div>
        <div class="window-controls">
          <button class="control-btn minimize" title="最小化" @click="minimizeWindow">
            <span>—</span>
          </button>
          <button class="control-btn close" title="关闭" @click="closeWindow">
            <span>×</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 步骤导航 -->
      <nav class="step-navigation">
        <div class="step-list">
          <button
            v-for="(page, index) in pages"
            :key="index"
            :class="['step-item', { active: currentPage === index, disabled: isNavigationLocked && index !== currentPage }]"
            @click="goToPage(index)"
            :disabled="isNavigationLocked && index !== currentPage"
          >
            <div class="step-marker">
              <span class="step-number">{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ page }}</span>
          </button>
        </div>
      </nav>

      <!-- 内容区域 -->
      <div class="content-area">
        <transition name="page-fade" mode="out-in">
          <div :key="currentPage" class="page-container">
            <DeviceDetection v-if="currentPage === 0" :key="0" />
            <ImageSelection v-else-if="currentPage === 1" :key="1" />
            <FlashExecution v-else-if="currentPage === 2" :key="2" />
          </div>
        </transition>
      </div>
    </main>

    <!-- 底部状态栏 -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="status-info">
          <span class="status-indicator" :class="configStatus"></span>
          <span class="status-text"> {{ currentStatus }} | {{ configStatusText }} </span>
        </div>
        <div class="version-info">
          <span class="version-text">v1.0.0</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 应用整体布局 */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--ev-c-white);
  font-family:
    'Segoe UI',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

/* 简洁标题栏 */
.app-header {
  background: var(--ev-c-white);
  border-bottom: 1px solid var(--ev-c-white-border);
  height: 48px;
  display: flex;
  align-items: center;
  -webkit-app-region: drag;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 20px;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon {
  width: 24px;
  height: 24px;
  color: var(--ev-c-primary);
  flex-shrink: 0;
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin: 0;
  letter-spacing: 0.2px;
}

.window-controls {
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 36px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--ev-c-text-2);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ev-transition-fast);
  border-radius: var(--ev-radius-sm);
}

.control-btn:hover {
  background: var(--ev-c-white-mute);
  color: var(--ev-c-text-1);
}

.control-btn.close:hover {
  background: var(--ev-c-danger);
  color: white;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 步骤导航 */
.step-navigation {
  background: var(--ev-c-white-soft);
  border-bottom: 1px solid var(--ev-c-white-border);
  padding: 16px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.step-list {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border: none;
  background: transparent;
  border-radius: var(--ev-radius-lg);
  cursor: pointer;
  transition: all var(--ev-transition-normal);
  color: var(--ev-c-text-3);
  position: relative;
}

.step-item:hover:not(.disabled) {
  background: var(--ev-c-white-mute);
  color: var(--ev-c-text-2);
  transform: translateY(-1px);
}

.step-item.active {
  background: var(--ev-c-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.step-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.step-item.disabled:hover {
  background: transparent;
  color: var(--ev-c-text-3);
  transform: none;
}

.step-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--ev-c-white-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all var(--ev-transition-normal);
}

.step-item.active .step-marker {
  background: rgba(255, 255, 255, 0.2);
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

/* 内容区域 */
.content-area {
  flex: 1;
  padding: 20px;
  overflow: hidden;
  background: var(--ev-c-white-soft);
  display: flex;
  flex-direction: column;
}

.page-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 重要：允许内容区域收缩 */
}

/* 页面切换动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity var(--ev-transition-normal),
    transform var(--ev-transition-normal);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 底部状态栏 */
.app-footer {
  background: var(--ev-c-white);
  border-top: 1px solid var(--ev-c-white-border);
  height: 40px;
  display: flex;
  align-items: center;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 20px;
  font-size: 12px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ev-c-text-3);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ev-c-success);
  animation: pulse 2s infinite;
}

.status-indicator.initializing {
  background: var(--ev-c-info);
}

.status-indicator.downloading {
  background: var(--ev-c-primary);
}

.status-indicator.completed {
  background: var(--ev-c-success);
}

.status-indicator.error {
  background: var(--ev-c-danger);
}

.version-info {
  color: var(--ev-c-text-4);
  font-weight: 500;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    height: 44px;
  }

  .header-content {
    padding: 0 16px;
  }

  .app-icon {
    width: 20px;
    height: 20px;
  }

  .app-title {
    font-size: 14px;
  }

  .control-btn {
    width: 32px;
    height: 24px;
  }

  .step-navigation {
    padding: 16px 20px;
  }

  .step-list {
    flex-direction: column;
    gap: 12px;
  }

  .step-item {
    padding: 10px 16px;
  }

  .content-area {
    padding: 20px;
  }

  .app-footer {
    height: 36px;
  }

  .footer-content {
    padding: 0 16px;
    font-size: 11px;
  }
}
</style>
