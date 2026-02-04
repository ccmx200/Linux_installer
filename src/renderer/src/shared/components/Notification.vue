<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const props = defineProps<Props>()
const { type = 'info' } = props

const emit = defineEmits<{
  (e: 'close'): void
}>()

let timer: number | null = null

const handleClose = (): void => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  emit('close')
}

const getPositionClass = (): string => {
  return `notification-${props.position}`
}

const getTypeClass = (): string => {
  return `notification-${props.type}`
}

onMounted(() => {
  if (props.visible) {
    timer = window.setTimeout(() => {
      handleClose()
    }, props.duration)
  }
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
})
</script>

<template>
  <div
    v-if="visible"
    ref="notificationRef"
    class="notification"
    :class="[getPositionClass(), getTypeClass()]"
  >
    <div class="notification-icon">
      <svg
        v-if="type === 'success'"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <polyline
          points="22 4 12 14.01 9 11.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg
        v-else-if="type === 'warning'"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          fill="currentColor"
        />
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="13"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
        />
        <line
          x1="12"
          y1="17"
          x2="12.01"
          y2="17"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <svg
        v-else-if="type === 'error'"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 6L6 18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M6 6L18 18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg
        v-else-if="type === 'info'"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path
          d="M12 8V12L14 14"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <div class="notification-message">{{ message }}</div>
    <button class="notification-close" aria-label="关闭" @click="handleClose">
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 6L6 18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M6 6L18 18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.notification {
  position: fixed;
  display: flex;
  align-items: center;
  gap: var(--ev-space-sm);
  padding: var(--ev-space-sm) var(--ev-space-md);
  border-radius: var(--ev-radius-md);
  box-shadow: var(--ev-shadow-md);
  font-size: 12px;
  font-weight: 500;
  z-index: var(--ev-z-tooltip);
  animation: slideIn var(--ev-transition-normal);
  cursor: pointer;
  border: 1px solid transparent;
}

.notification:hover {
  box-shadow: var(--ev-shadow-lg);
  transform: translateY(-1px);
}

/* 位置样式 */
.notification-top-right {
  top: var(--ev-space-lg);
  right: var(--ev-space-lg);
}

.notification-top-left {
  top: var(--ev-space-lg);
  left: var(--ev-space-lg);
}

.notification-bottom-right {
  bottom: var(--ev-space-lg);
  right: var(--ev-space-lg);
}

.notification-bottom-left {
  bottom: var(--ev-space-lg);
  left: var(--ev-space-lg);
}

/* 类型样式 */
.notification-success {
  background-color: var(--ev-c-success);
  color: white;
  border-color: var(--ev-c-success);
}

.notification-warning {
  background-color: var(--ev-c-warning);
  color: var(--ev-c-text-1);
  border-color: var(--ev-c-warning);
}

.notification-error {
  background-color: var(--ev-c-danger);
  color: white;
  border-color: var(--ev-c-danger);
}

.notification-info {
  background-color: var(--ev-c-info);
  color: white;
  border-color: var(--ev-c-info);
}

/* 图标样式 */
.notification-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 消息样式 */
.notification-message {
  flex: 1;
  line-height: 1.4;
}

/* 关闭按钮样式 */
.notification-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.8;
  transition: all var(--ev-transition-fast);
  padding: var(--ev-space-xs);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ev-radius-sm);
  flex-shrink: 0;
}

.notification-close:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.2);
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification {
    padding: var(--ev-space-xs) var(--ev-space-sm);
    font-size: 11px;
    left: var(--ev-space-md);
    right: var(--ev-space-md);
    width: calc(100% - 2 * var(--ev-space-md));
  }

  .notification-top-right,
  .notification-top-left {
    top: var(--ev-space-md);
    right: var(--ev-space-md);
    left: var(--ev-space-md);
  }

  .notification-bottom-right,
  .notification-bottom-left {
    bottom: var(--ev-space-md);
    right: var(--ev-space-md);
    left: var(--ev-space-md);
  }
}
</style>
