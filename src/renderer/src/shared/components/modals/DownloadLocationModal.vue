<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
  title: string
  message: string
  defaultPath?: string
}

const props = defineProps<Props>()
// const { defaultPath = 'C:\\Downloads' } = props

const emit = defineEmits<{
  (e: 'confirm', path: string): void
  (e: 'cancel'): void
}>()

const downloadPath = ref(props.defaultPath)

const handleConfirm = (): void => {
  emit('confirm', downloadPath.value || '')
}

const handleCancel = (): void => {
  emit('cancel')
}

const handleBrowse = async (): Promise<void> => {
  try {
    const result = await window.electron.ipcRenderer.invoke('selectFolder', {
      title: '选择下载路径',
      defaultPath: downloadPath.value,
      properties: ['openDirectory', 'createDirectory', 'promptToCreate']
    })
    if (result && result.canceled === false && result.filePaths.length > 0) {
      downloadPath.value = result.filePaths[0]
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    // 降级到prompt
    const newPath = prompt('请输入下载路径:', downloadPath.value)
    if (newPath) {
      downloadPath.value = newPath
    }
  }
}

// 点击遮罩层关闭
const handleOverlayClick = (event: MouseEvent): void => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <div v-if="visible" class="download-modal-overlay" @click="handleOverlayClick">
    <div class="download-modal">
      <div class="download-modal-header">
        <div class="download-icon">📁</div>
        <h3 class="download-title">{{ title }}</h3>
      </div>

      <div class="download-modal-body">
        <p class="download-message">{{ message }}</p>

        <div class="path-selection">
          <label class="path-label">下载路径:</label>
          <div class="path-input-container">
            <input
              v-model="downloadPath"
              type="text"
              class="path-input"
              placeholder="请输入下载路径"
            />
            <button class="browse-btn" @click="handleBrowse">浏览</button>
          </div>
          <p class="path-hint">系统镜像将下载到此目录</p>
        </div>
      </div>

      <div class="download-modal-footer">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" @click="handleConfirm">确认下载</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.download-modal-overlay {
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

.download-modal {
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
  border-radius: 16px;
  padding: 28px;
  max-width: 520px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--ev-c-white-border);
  animation: slideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
}

.download-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ev-c-white-border);
}

.download-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.download-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0;
  letter-spacing: -0.5px;
}

.download-modal-body {
  margin-bottom: 28px;
}

.download-message {
  font-size: 15px;
  line-height: 1.6;
  color: var(--ev-c-text-2);
  margin: 0 0 20px 0;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-wrap: break-word;
  background: rgba(59, 130, 246, 0.05);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--ev-c-primary);
  max-height: 150px;
  overflow-y: auto;
}

.path-selection {
  margin-top: 20px;
  background: rgba(16, 185, 129, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.path-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.path-input-container {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.path-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--ev-c-white-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-background);
  color: var(--ev-c-text-1);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.path-input:focus {
  outline: none;
  border-color: var(--ev-c-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.browse-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--ev-c-primary) 0%, var(--ev-c-primary-light) 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  min-width: 80px;
}

.browse-btn:hover {
  background: linear-gradient(135deg, var(--ev-c-primary-light) 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.path-hint {
  font-size: 13px;
  color: var(--ev-c-text-3);
  margin: 8px 0 0 0;
  font-style: italic;
}

.download-modal-footer {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 100px;
  letter-spacing: 0.5px;
}

.btn-cancel {
  background: linear-gradient(135deg, var(--color-background-mute) 0%, var(--ev-c-text-4) 100%);
  color: var(--ev-c-text-2);
  border: 1px solid var(--ev-c-white-border);
}

.btn-cancel:hover {
  background: linear-gradient(135deg, var(--ev-c-text-4) 0%, var(--ev-c-text-3) 100%);
  color: var(--ev-c-text-1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-confirm {
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
