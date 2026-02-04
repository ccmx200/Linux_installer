<script setup lang="ts">

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
}

const { 
  confirmText = '确定'
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

const handleOverlayClick = (event: MouseEvent): void => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <div v-if="visible" class="info-modal-overlay" @click="handleOverlayClick">
    <div class="info-modal">
      <!-- 头部区域 -->
      <div class="info-modal-header">
        <div class="info-icon">ℹ️</div>
        <div class="header-content">
          <h3 class="info-title">{{ title }}</h3>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="info-modal-body">
        <!-- 消息内容 -->
        <div class="message-content">
          <p class="info-message">{{ message }}</p>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="info-modal-footer">
        <button class="btn-confirm" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-modal-overlay {
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

.info-modal {
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
  border-radius: 16px;
  padding: 24px;
  max-width: 420px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--ev-c-white-border);
  animation: slideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
}

.info-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ev-c-white-border);
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.header-content {
  flex: 1;
}

.info-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0;
  letter-spacing: -0.5px;
}

.info-modal-body {
  margin-bottom: 24px;
  max-height: calc(80vh - 180px);
  overflow-y: auto;
}

.message-content {
  margin-bottom: 16px;
}

.info-message {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ev-c-text-2);
  margin: 0;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-wrap: break-word;
  background: rgba(16, 185, 129, 0.05);
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 3px solid var(--ev-c-success);
  max-height: 150px;
  overflow-y: auto;
}

.info-modal-footer {
  display: flex;
  justify-content: center;
}

.btn-confirm {
  padding: 10px 32px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 100px;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--ev-c-primary) 0%, #1d4ed8 100%);
  color: white;
  border: 1px solid var(--ev-c-primary);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
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