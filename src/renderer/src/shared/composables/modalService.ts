// 模态框服务
import { ref } from 'vue'

interface Modal {
  id: string
  type: string
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  data?: unknown
}

const modals = ref<Modal[]>([])

/**
 * 模态框服务
 */
export function useModal(): {
  openModal: (modal: Omit<Modal, "id">) => string
  closeModal: (id: string) => void
  getModals: () => import('vue').Ref<Modal[]>
  modals: import('vue').Ref<Modal[]>
  showWarning: (
    title: string,
    message: string,
    confirmText?: string,
    cancelText?: string
  ) => Promise<boolean>
  showWarningWithDoubleConfirmation: (
    title: string,
    message: string,
    confirmText?: string,
    cancelText?: string,
    mode?: 'auto' | 'manual'
  ) => Promise<boolean>
  showDownloadLocation: (
    title: string,
    message: string,
    defaultPath: string
  ) => Promise<{ confirmed: boolean; downloadPath?: string }>
  showConfirm: (
    title: string,
    message: string,
    confirmText?: string,
    cancelText?: string
  ) => Promise<boolean>
  showInfo: (title: string, message: string, confirmText?: string) => Promise<boolean>
  showError: (title: string, message: string, confirmText?: string) => Promise<boolean>
  showFlashExecution: (
    title: string,
    message: string,
    confirmText?: string,
    showRebootInstructions?: boolean,
    showProgress?: boolean,
    progressValue?: number
  ) => Promise<boolean>
} {
  const openModal = (modal: Omit<Modal, 'id'>): string => {
    const newModal: Modal = {
      ...modal,
      id: Date.now().toString()
    }
    modals.value.push(newModal)
    return newModal.id
  }

  const closeModal = (id: string): void => {
    const index = modals.value.findIndex((m) => m.id === id)
    if (index > -1) {
      modals.value.splice(index, 1)
    }
  }

  const getModals = (): import('vue').Ref<Modal[]> => {
    return modals
  }

  /**
   * 显示警告弹窗
   */
  const showWarning = (
    title: string,
    message: string,
    confirmText: string = '确定',
    cancelText: string = '取消'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'warning',
        title,
        message,
        confirmText,
        cancelText
      })

      // 全局事件处理
      const handleClose = (event: CustomEvent): void => {
        if (event.detail.id === modalId) {
          resolve(event.detail.confirmed)
          closeModal(modalId)
          window.removeEventListener('modalClosed', handleClose as EventListener)
        }
      }

      window.addEventListener('modalClosed', handleClose as EventListener)
    })
  }

  /**
   * 显示下载位置选择弹窗
   */
  const showDownloadLocation = (
    title: string,
    message: string,
    defaultPath: string
  ): Promise<{ confirmed: boolean; downloadPath?: string }> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'downloadLocation',
        title,
        message,
        confirmText: '确定',
        cancelText: '取消',
        data: { defaultPath }
      })

      // 全局事件处理
      const handleClose = (event: CustomEvent): void => {
        if (event.detail.id === modalId) {
          resolve({
            confirmed: event.detail.confirmed,
            downloadPath: event.detail.path
          })
          closeModal(modalId)
          window.removeEventListener('modalClosed', handleClose as EventListener)
        }
      }

      window.addEventListener('modalClosed', handleClose as EventListener)
    })
  }

  /**
   * 显示需要双重确认的警告弹窗
   */
  const showWarningWithDoubleConfirmation = (
    title: string,
    message: string,
    confirmText?: string,
    cancelText?: string,
    mode?: 'auto' | 'manual'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'warning',
        title,
        message,
        confirmText: confirmText || '确定',
        cancelText: cancelText || '取消',
        data: {
          requiresDoubleConfirmation: true,
          mode: mode || 'auto'
        }
      })

      // 全局事件处理
      const handleClose = (event: CustomEvent): void => {
        if (event.detail.id === modalId) {
          resolve(event.detail.confirmed)
          closeModal(modalId)
          window.removeEventListener('modalClosed', handleClose as EventListener)
        }
      }

      window.addEventListener('modalClosed', handleClose as EventListener)
    })
  }

  /**
   * 显示信息弹窗
   */
  const showInfo = (
    title: string,
    message: string,
    confirmText: string = '确定'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'info',
        title,
        message,
        confirmText
      })

      // 全局事件处理
      const handleClose = (event: CustomEvent): void => {
        if (event.detail.id === modalId) {
          resolve(true)
          closeModal(modalId)
          window.removeEventListener('modalClosed', handleClose as EventListener)
        }
      }

      window.addEventListener('modalClosed', handleClose as EventListener)
    })
  }

  /**
   * 显示确认弹窗
   */
  const showConfirm = (
    title: string,
    message: string,
    confirmText: string = '确定',
    cancelText: string = '取消'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText
      })

      // 全局事件处理
      const handleClose = (event: CustomEvent): void => {
        if (event.detail.id === modalId) {
          resolve(event.detail.confirmed)
          closeModal(modalId)
          window.removeEventListener('modalClosed', handleClose as EventListener)
        }
      }

      window.addEventListener('modalClosed', handleClose as EventListener)
    })
  }

  /**
   * 显示错误弹窗
   */
  const showError = (
    title: string,
    message: string,
    confirmText: string = '确定'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'error',
        title,
        message,
        confirmText
      })

      // 全局事件处理
      const handleClose = (event: CustomEvent): void => {
        if (event.detail.id === modalId) {
          resolve(true)
          closeModal(modalId)
          window.removeEventListener('modalClosed', handleClose as EventListener)
        }
      }

      window.addEventListener('modalClosed', handleClose as EventListener)
    })
  }

  /**
   * 显示刷入执行弹窗
   */
  const showFlashExecution = (
    title: string,
    message: string,
    confirmText: string = '确定',
    showRebootInstructions: boolean = true,
    showProgress: boolean = false,
    progressValue: number = 0
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        type: 'flashExecution',
        title,
        message,
        confirmText,
        data: {
          showRebootInstructions,
          showProgress,
          progressValue
        }
      })

      // 全局事件处理
      const handleClose = (event: CustomEvent): void => {
        if (event.detail.id === modalId) {
          resolve(true)
          closeModal(modalId)
          window.removeEventListener('modalClosed', handleClose as EventListener)
        }
      }

      window.addEventListener('modalClosed', handleClose as EventListener)
    })
  }

  return {
    openModal,
    closeModal,
    getModals,
    modals,
    showWarning,
    showWarningWithDoubleConfirmation,
    showDownloadLocation,
    showInfo,
    showConfirm,
    showError,
    showFlashExecution
  }
}

// 导出单例实例
export const modalService = useModal()
