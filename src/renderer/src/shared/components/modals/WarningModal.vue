<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  requiresDoubleConfirmation?: boolean
  mode?: 'auto' | 'manual' // 新增：区分自动和手动安装模式
}

const { 
  confirmText = '确认', 
  cancelText = '取消',
  requiresDoubleConfirmation = false,
  mode = 'auto'
} = defineProps<Props>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const isConfirmed1 = ref(false)
const isConfirmed2 = ref(false)

// 只有当两个确认项都打勾时才能继续
const isAllConfirmed = computed(() => {
  return requiresDoubleConfirmation ? (isConfirmed1.value && isConfirmed2.value) : true
})

// 根据模式获取确认文本
const getConfirmationTexts = computed(() => {
  const baseTexts = {
    text1: '我确认已备份所有重要数据',
    text2: '我确认已了解此操作将永久删除设备上的所有数据'
  }
  
  if (mode === 'auto') {
    return {
      ...baseTexts,
      text1: '我确认已备份所有重要数据'
    }
  } else {
    return {
      ...baseTexts,
      text1: '我确认已准备好正确的系统镜像文件'
    }
  }
})

// 根据模式获取操作描述
const getOperationDescription = computed(() => {
  if (mode === 'auto') {
    return '此操作将下载系统镜像并永久删除设备上的所有数据'
  } else {
    return '此操作将使用已有镜像永久删除设备上的所有数据'
  }
})

const handleConfirm = (): void => {
  if (!isAllConfirmed.value) return
  emit('confirm')
  resetConfirmations()
}

const handleCancel = (): void => {
  emit('cancel')
  resetConfirmations()
}

const resetConfirmations = (): void => {
  isConfirmed1.value = false
  isConfirmed2.value = false
}

const handleOverlayClick = (event: MouseEvent): void => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <div v-if="visible" class="warning-modal-overlay" @click="handleOverlayClick">
    <div class="warning-modal">
      <!-- 头部区域 - 淡红色背景 -->
      <div class="warning-modal-header">
        <div class="header-background"></div>
        <div class="header-content">
          <div class="warning-icon">⚠️</div>
          <div class="header-text">
            <h3 class="warning-title">{{ title }}</h3>
            <div class="warning-subtitle">{{ mode === 'auto' ? '自动安装' : '手动安装' }}</div>
          </div>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="warning-modal-body">
        <!-- 操作描述 -->
        <div class="operation-description">
          <div class="description-icon">{{ mode === 'auto' ? '📥' : '💾' }}</div>
          <div class="description-text">
            <p class="description-main">{{ getOperationDescription }}</p>
            <p class="description-warning">此操作不可恢复，请谨慎操作！</p>
          </div>
        </div>
        
        <!-- 消息内容 -->
        <div class="message-section">
          <p class="warning-message">{{ message }}</p>
        </div>
        
        <!-- 风险提示 -->
        <div class="risk-section">
          <div class="risk-header">
            <div class="risk-icon">🚨</div>
            <span class="risk-title">高风险警告</span>
          </div>
          <ul class="risk-list">
            <li>将永久删除设备上的所有数据</li>
            <li>操作完成后无法恢复原有系统</li>
            <li>请确保设备已正确连接</li>
          </ul>
        </div>
        
        <!-- 双重确认 -->
        <div v-if="requiresDoubleConfirmation" class="double-confirm-section">
          <div class="confirm-header">
            <div class="confirm-icon">✅</div>
            <span class="confirm-title">请确认以下事项</span>
          </div>
          <div class="confirmation-list">
            <label class="confirm-checkbox">
              <input 
                type="checkbox" 
                v-model="isConfirmed1"
                class="checkbox-input"
              >
              <span class="checkmark"></span>
              <span class="confirm-text">{{ getConfirmationTexts.text1 }}</span>
            </label>
            <label class="confirm-checkbox">
              <input 
                type="checkbox" 
                v-model="isConfirmed2"
                class="checkbox-input"
              >
              <span class="checkmark"></span>
              <span class="confirm-text">{{ getConfirmationTexts.text2 }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="warning-modal-footer">
        <button v-if="cancelText" class="btn-cancel" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button 
          class="btn-confirm" 
          @click="handleConfirm"
          :disabled="!isAllConfirmed"
          :class="{ disabled: !isAllConfirmed }"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.warning-modal-overlay {
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
  animation: fadeIn 0.3s ease;
}

.warning-modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid #e5e7eb;
  animation: slideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 头部区域 - 淡红色背景 */
.warning-modal-header {
  position: relative;
  padding: 24px 24px 20px;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  z-index: 1;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
}

.warning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #ef4444;
  border-radius: 12px;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.header-text {
  flex: 1;
}

.warning-title {
  font-size: 20px;
  font-weight: 700;
  color: #dc2626;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.warning-subtitle {
  font-size: 14px;
  color: #ef4444;
  font-weight: 600;
  opacity: 0.8;
}

/* 主体内容 */
.warning-modal-body {
  padding: 0 24px 24px;
  max-height: calc(85vh - 180px);
  overflow-y: auto;
}

/* 操作描述 */
.operation-description {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.description-icon {
  font-size: 20px;
  margin-top: 2px;
}

.description-text {
  flex: 1;
}

.description-main {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.description-warning {
  font-size: 13px;
  color: #ef4444;
  margin: 0;
  font-weight: 500;
}

/* 消息内容 */
.message-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f1f5f9;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.warning-message {
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
  margin: 0;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 风险提示 */
.risk-section {
  background: #fef2f2;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.risk-icon {
  font-size: 16px;
}

.risk-title {
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
}

.risk-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.risk-list li {
  font-size: 13px;
  color: #ef4444;
  line-height: 1.5;
  margin-bottom: 4px;
  padding-left: 0;
}

.risk-list li::before {
  content: '•';
  color: #ef4444;
  font-weight: bold;
  margin-right: 8px;
}

/* 双重确认 */
.double-confirm-section {
  background: #f0fdf4;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.confirm-icon {
  font-size: 16px;
}

.confirm-title {
  font-size: 14px;
  font-weight: 600;
  color: #16a34a;
}

.confirmation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirm-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  padding: 8px;
  border-radius: 6px;
}

.confirm-checkbox:hover {
  background: rgba(16, 185, 129, 0.1);
}

.checkbox-input {
  margin: 0;
  opacity: 0;
  position: absolute;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-input:checked + .checkmark {
  background: #10b981;
  border-color: #10b981;
}

.checkbox-input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px;
  font-weight: bold;
}

/* 底部按钮 */
.warning-modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 0 24px 24px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 80px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-confirm {
  background: #ef4444;
  color: white;
  border: 1px solid #ef4444;
}

.btn-confirm:hover:not(.disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-confirm.disabled {
  background: #d1d5db;
  color: #9ca3af;
  border-color: #d1d5db;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 动画 */
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

/* 滚动条样式 */
.warning-modal::-webkit-scrollbar {
  width: 6px;
}

.warning-modal::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.warning-modal::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.warning-modal::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>