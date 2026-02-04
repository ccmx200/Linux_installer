<script setup lang="ts">
import { ref } from 'vue'
import WarningModal from './WarningModal.vue'
import DownloadLocationModal from './DownloadLocationModal.vue'

export interface ModalConfig {
  id: string
  type: 'warning' | 'downloadLocation'
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  requiresDoubleConfirmation?: boolean
  confirmationText?: string
  data?: unknown
}

const modals = ref<ModalConfig[]>([])

// 显示弹窗
const showModal = (config: Omit<ModalConfig, 'id'>): Promise<boolean> => {
  return new Promise((resolve) => {
    const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const modalConfig = {
      ...config,
      id: modalId
    }

    modals.value.push(modalConfig)

    // 监听弹窗关闭
    const handleModalClose = (result: boolean): void => {
      modals.value = modals.value.filter((m) => m.id !== modalId)
      resolve(result)
    }

    // 设置超时自动关闭（安全措施）
    setTimeout(() => {
      if (modals.value.find((m) => m.id === modalId)) {
        handleModalClose(false)
      }
    }, 30000)
  })
}

// 显示警告弹窗
const showWarning = (
  title: string,
  message: string,
  confirmText?: string,
  cancelText?: string
): Promise<boolean> => {
  return showModal({
    type: 'warning',
    title,
    message,
    confirmText,
    cancelText
  })
}

// 显示需要双重确认的警告弹窗
const showWarningWithDoubleConfirmation = (
  title: string,
  message: string,
  confirmText?: string,
  cancelText?: string,
  confirmationText?: string
): Promise<boolean> => {
  return showModal({
    type: 'warning',
    title,
    message,
    confirmText,
    cancelText,
    requiresDoubleConfirmation: true,
    confirmationText: confirmationText || '我确认已了解风险并同意继续'
  })
}

// 显示下载位置选择弹窗
const showDownloadLocation = (
  title: string,
  message: string,
  defaultPath?: string
): Promise<{ confirmed: boolean; downloadPath?: string }> => {
  return new Promise((resolve) => {
    showModal({
      type: 'downloadLocation',
      title,
      message,
      data: { defaultPath }
    }).then((confirmed) => {
      if (confirmed) {
        // 这里应该返回用户选择的路径
        resolve({ confirmed: true, downloadPath: defaultPath || 'C:\\Downloads' })
      } else {
        resolve({ confirmed: false })
      }
    })
  })
}

// 关闭所有弹窗
const closeAllModals = (): void => {
  modals.value = []
}

// 暴露方法给其他组件使用
defineExpose({
  showModal,
  showWarning,
  showWarningWithDoubleConfirmation,
  showDownloadLocation,
  closeAllModals
})
</script>

<template>
  <div class="modal-manager">
    <WarningModal
      v-for="modal in modals.filter((m) => m.type === 'warning')"
      :key="modal.id"
      :visible="true"
      :title="modal.title"
      :message="modal.message"
      :confirm-text="modal.confirmText"
      :cancel-text="modal.cancelText"
      :requires-double-confirmation="modal.requiresDoubleConfirmation"
      :confirmation-text="modal.confirmationText"
      @confirm="
        () => {
          const index = modals.findIndex((m) => m.id === modal.id)
          if (index !== -1) {
            modals.splice(index, 1)
          }
        }
      "
      @cancel="
        () => {
          const index = modals.findIndex((m) => m.id === modal.id)
          if (index !== -1) {
            modals.splice(index, 1)
          }
        }
      "
    />

    <DownloadLocationModal
      v-for="modal in modals.filter((m) => m.type === 'downloadLocation')"
      :key="modal.id"
      :visible="true"
      :title="modal.title"
      :message="modal.message"
      :default-path="(modal.data as any)?.defaultPath"
      @confirm="
        () => {
          const index = modals.findIndex((m) => m.id === modal.id)
          if (index !== -1) {
            modals.splice(index, 1)
          }
        }
      "
      @cancel="
        () => {
          const index = modals.findIndex((m) => m.id === modal.id)
          if (index !== -1) {
            modals.splice(index, 1)
          }
        }
      "
    />
  </div>
</template>

<style scoped>
.modal-manager {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
}

.modal-manager > * {
  pointer-events: auto;
}
</style>
