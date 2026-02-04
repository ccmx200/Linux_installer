<script setup lang="ts">
import { computed } from 'vue'
import { modalService } from '../../composables/modalService'
import WarningModal from './WarningModal.vue'
import DownloadLocationModal from './DownloadLocationModal.vue'
import FlashExecutionModal from './FlashExecutionModal.vue'
import InfoModal from './InfoModal.vue'

const modals = computed(() => modalService.getModals().value)

const handleWarningConfirm = (modalId: string): void => {
  window.dispatchEvent(
    new CustomEvent('modalClosed', {
      detail: { id: modalId, confirmed: true }
    })
  )
}

const handleWarningCancel = (modalId: string): void => {
  window.dispatchEvent(
    new CustomEvent('modalClosed', {
      detail: { id: modalId, confirmed: false }
    })
  )
}

const handleDownloadConfirm = (modalId: string, path: string): void => {
  window.dispatchEvent(
    new CustomEvent('modalClosed', {
      detail: { id: modalId, confirmed: true, path }
    })
  )
}

const handleDownloadCancel = (modalId: string): void => {
  window.dispatchEvent(
    new CustomEvent('modalClosed', {
      detail: { id: modalId, confirmed: false }
    })
  )
}

const handleFlashExecutionConfirm = (modalId: string): void => {
  window.dispatchEvent(
    new CustomEvent('modalClosed', {
      detail: { id: modalId, confirmed: true }
    })
  )
}

const handleInfoConfirm = (modalId: string): void => {
  window.dispatchEvent(
    new CustomEvent('modalClosed', {
      detail: { id: modalId, confirmed: true }
    })
  )
}
</script>

<template>
  <div class="modal-container">
    <!-- 警告弹窗 -->
    <WarningModal
      v-for="modal in modals.filter((m) => m.type === 'warning')"
      :key="modal.id"
      :visible="true"
      :title="modal.title"
      :message="modal.message"
      :confirm-text="modal.confirmText"
      :cancel-text="modal.cancelText"
      :requires-double-confirmation="(modal.data as any)?.requiresDoubleConfirmation"
      :mode="(modal.data as any)?.mode"
      @confirm="() => handleWarningConfirm(modal.id)"
      @cancel="() => handleWarningCancel(modal.id)"
    />

    <!-- 下载位置选择弹窗 -->
    <DownloadLocationModal
      v-for="modal in modals.filter((m) => m.type === 'downloadLocation')"
      :key="modal.id"
      :visible="true"
      :title="modal.title"
      :message="modal.message"
      :default-path="(modal.data as any)?.defaultPath"
      @confirm="(path) => handleDownloadConfirm(modal.id, path)"
      @cancel="() => handleDownloadCancel(modal.id)"
    />

    <!-- 信息弹窗 -->
    <InfoModal
      v-for="modal in modals.filter((m) => m.type === 'info')"
      :key="modal.id"
      :visible="true"
      :title="modal.title"
      :message="modal.message"
      :confirm-text="modal.confirmText"
      @confirm="() => handleInfoConfirm(modal.id)"
    />

    <!-- 刷入执行弹窗 -->
    <FlashExecutionModal
      v-for="modal in modals.filter((m) => m.type === 'flashExecution')"
      :key="modal.id"
      :visible="true"
      :title="modal.title"
      :message="modal.message"
      :confirm-text="modal.confirmText"
      :show-reboot-instructions="(modal.data as any)?.showRebootInstructions"
      :show-progress="(modal.data as any)?.showProgress"
      :progress-value="(modal.data as any)?.progressValue"
      @confirm="() => handleFlashExecutionConfirm(modal.id)"
    />
  </div>
</template>

<style scoped>
.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  pointer-events: none;
}

.modal-container > * {
  pointer-events: auto;
}
</style>
