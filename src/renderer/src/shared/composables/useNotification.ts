// 通知系统可组合函数
import { ref } from 'vue'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  visible: boolean
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const notifications = ref<Notification[]>([])

/**
 * 通知系统可组合函数
 */
export function useNotification(): {
  notifications: import('vue').Ref<Notification[]>
  addNotification: (notification: Omit<Notification, 'id' | 'visible'>) => string
  hideNotification: (id: string) => void
  clearAllNotifications: () => void
  success: (message: string, options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>) => string
  warning: (message: string, options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>) => string
  error: (message: string, options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>) => string
  info: (message: string, options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>) => string
} {
  const addNotification = (notification: Omit<Notification, 'id' | 'visible'>): string => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      visible: true,
      duration: notification.duration || 3000,
      position: notification.position || 'top-right'
    }

    notifications.value.push(newNotification)

    // 自动隐藏
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(newNotification.id)
      }, newNotification.duration)
    }

    return newNotification.id
  }

  const hideNotification = (id: string): void => {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.visible = false
      // 延迟移除，等待动画完成
      setTimeout(() => {
        notifications.value = notifications.value.filter((n) => n.id !== id)
      }, 300)
    }
  }

  const clearAllNotifications = (): void => {
    notifications.value = []
  }

  const success = (
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>
  ): string => {
    return addNotification({ ...options, type: 'success', message })
  }

  const warning = (
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>
  ): string => {
    return addNotification({ ...options, type: 'warning', message })
  }

  const error = (
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>
  ): string => {
    return addNotification({ ...options, type: 'error', message })
  }

  const info = (
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'visible' | 'type' | 'message'>>
  ): string => {
    return addNotification({ ...options, type: 'info', message })
  }

  return {
    notifications,
    addNotification,
    hideNotification,
    clearAllNotifications,
    success,
    warning,
    error,
    info
  }
}
