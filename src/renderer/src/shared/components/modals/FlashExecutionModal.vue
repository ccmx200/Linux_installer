<script setup lang="ts">

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  showRebootInstructions?: boolean
  showProgress?: boolean
  progressValue?: number
}

const { 
  confirmText = '确定',
  showRebootInstructions = true,
  showProgress = false,
  progressValue = 0
} = defineProps<Props>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const handleConfirm = (): void => {
  emit('confirm')
}

const handleCancel = (): void => {
  emit('cancel')
}

// 点击遮罩层关闭
const handleOverlayClick = (event: MouseEvent): void => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <div v-if="visible" class="flash-modal-overlay" @click="handleOverlayClick">
    <div class="flash-modal">
      <!-- 头部区域 -->
      <div class="flash-modal-header">
        <div class="flash-icon-container">
          <div class="flash-icon">🚀</div>
        </div>
        <div class="header-content">
          <h3 class="flash-title">{{ title }}</h3>
          <div class="flash-subtitle">刷入执行状态</div>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="flash-modal-body">
        <!-- 进度条（可选） -->
        <div v-if="showProgress" class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: progressValue + '%' }"
              ></div>
            </div>
            <div class="progress-text">{{ progressValue }}%</div>
          </div>
        </div>
        
        <!-- 消息内容 -->
        <div class="message-container">
          <p class="flash-message">{{ message }}</p>
        </div>
        
        <!-- 重启说明（可选） -->
        <div v-if="showRebootInstructions" class="reboot-section">
          <div class="reboot-header">
            <div class="reboot-icon">🔁</div>
            <span class="reboot-title">重启说明</span>
          </div>
          <ul class="reboot-list">
            <li>• 长按电源键重启设备</li>
            <li>• 或使用音量键+电源键组合重启</li>
            <li>• 设备将自动启动到新安装的Linux系统</li>
          </ul>
        </div>
      </div>

      <!-- 底部按钮区域 -->
      <div class="flash-modal-footer">
        <button class="btn-confirm" @click="handleConfirm">
          <span class="btn-icon">✅</span>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flash-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}

.flash-modal {
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
  border-radius: 16px;
  padding: 28px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--ev-c-white-border);
  animation: slideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
}

.flash-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ev-c-white-border);
}

.flash-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.flash-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.header-content {
  flex: 1;
}

.flash-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.flash-subtitle {
  font-size: 14px;
  color: var(--ev-c-primary);
  font-weight: 600;
  opacity: 0.8;
}

.flash-modal-body {
  margin-bottom: 28px;
  max-height: calc(80vh - 200px);
  overflow-y: auto;
}

/* 进度条样式 */
.progress-section {
  margin-bottom: 20px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ev-c-primary) 0%, #1d4ed8 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--ev-c-primary);
  min-width: 40px;
}

/* 消息内容样式 */
.message-container {
  margin-bottom: 20px;
}

.flash-message {
  font-size: 15px;
  line-height: 1.6;
  color: var(--ev-c-text-2);
  margin: 0;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-wrap: break-word;
  background: rgba(16, 185, 129, 0.05);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--ev-c-success);
  max-height: 200px;
  overflow-y: auto;
}

/* 重启说明样式 */
.reboot-section {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.3);
  margin-top: 16px;
}

.reboot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.reboot-icon {
  font-size: 16px;
}

.reboot-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ev-c-warning);
}

.reboot-list {
  margin: 0;
  padding-left: 16px;
}

.reboot-list li {
  font-size: 13px;
  color: var(--ev-c-text-2);
  line-height: 1.5;
  margin-bottom: 4px;
}

/* 底部按钮样式 */
.flash-modal-footer {
  display: flex;
  justify-content: center;
}

.btn-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--ev-c-success) 0%, #059669 100%);
  color: white;
  border: 1px solid var(--ev-c-success);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-icon {
  font-size: 16px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>