<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { MirrorInfo } from '../services/mirrorManagerService'
import { MirrorManagerService } from '../services/mirrorManagerService'

interface Props {
  mirrors: string[]
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'select', mirror: string): void
  (e: 'use-github'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const mirrorList = ref<MirrorInfo[]>([])
const selectedMirror = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// 自定义镜像地址
const customMirrorUrl = ref('')
const showCustomMirrorInput = ref(false)

const canConfirm = computed(() => {
  return (
    selectedMirror.value !== null || (showCustomMirrorInput.value && customMirrorUrl.value.trim())
  )
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      setTimeout(() => {
        loadMirrorList()
      }, 100)
    }
  }
)

const loadMirrorList = (): void => {
  // 重置状态
  mirrorList.value = []
  selectedMirror.value = null
  errorMessage.value = null
  showCustomMirrorInput.value = false
  customMirrorUrl.value = ''

  // 立即初始化镜像列表，显示给用户
  mirrorList.value = props.mirrors.map((mirror) => ({
    url: mirror,
    latency: 0,
    status: 'available',
    name: MirrorManagerService.extractMirrorName(mirror),
    region: MirrorManagerService.guessMirrorRegion(mirror)
  }))
}

const handleMirrorSelect = (mirror: string): void => {
  selectedMirror.value = mirror
  showCustomMirrorInput.value = false
}

const handleCustomMirrorToggle = (): void => {
  showCustomMirrorInput.value = !showCustomMirrorInput.value
  if (showCustomMirrorInput.value) {
    selectedMirror.value = null
  }
}

const handleConfirm = (): void => {
  let finalMirror: string | null = null

  if (showCustomMirrorInput.value && customMirrorUrl.value.trim()) {
    // 验证和清理自定义镜像URL
    finalMirror = MirrorManagerService.cleanMirrorUrl(customMirrorUrl.value.trim())
  } else if (selectedMirror.value) {
    finalMirror = selectedMirror.value
  }

  if (finalMirror) {
    emit('select', finalMirror)
    // 同时触发全局事件，确保FlashExecution能够接收到
    window.dispatchEvent(new CustomEvent('mirrorSelected', { detail: finalMirror }))
  }
  emit('close')
}

const handleUseGithub = (): void => {
  emit('use-github')
  // 同时触发全局事件，确保FlashExecution能够接收到
  window.dispatchEvent(new CustomEvent('useGithub'))
}

const handleCancel = (): void => {
  emit('close')
  // 同时触发全局事件，确保FlashExecution能够接收到
  window.dispatchEvent(new CustomEvent('mirrorClosed'))
}

const getMirrorDisplayName = (mirror: MirrorInfo): string => {
  return mirror.name || new URL(mirror.url).hostname
}

const getMirrorRegion = (mirror: MirrorInfo): string => {
  return mirror.region || '未知区域'
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleCancel">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">选择下载镜像</h2>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>

      <div class="modal-body">
        <div class="description">
          <p>选择一个镜像站点以加速下载。</p>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 镜像列表 -->
        <div class="mirror-list">
          <div
            v-for="mirror in mirrorList"
            :key="mirror.url"
            :class="[
              'mirror-item',
              {
                selected: selectedMirror === mirror.url
              }
            ]"
            @click="handleMirrorSelect(mirror.url)"
          >
            <div class="mirror-info">
              <div class="mirror-details">
                <div class="mirror-name">{{ getMirrorDisplayName(mirror) }}</div>
                <div class="mirror-url">{{ mirror.url }}</div>
                <div v-if="mirror.region" class="mirror-region">{{ getMirrorRegion(mirror) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义镜像地址选项 -->
        <div class="custom-mirror-option">
          <button class="btn-custom-mirror" @click="handleCustomMirrorToggle">
            {{ showCustomMirrorInput ? '使用预设镜像' : '添加自定义镜像' }}
          </button>

          <div v-if="showCustomMirrorInput" class="custom-mirror-input">
            <input
              v-model="customMirrorUrl"
              type="text"
              placeholder="输入自定义镜像地址，例如：https://ghproxy.com"
              class="mirror-input"
            />
            <div class="input-hint">镜像地址将用于加速GitHub下载，格式应为：https://域名</div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleCancel">取消</button>
        <button class="btn btn-outline" @click="handleUseGithub">直接从GitHub下载</button>
        <button class="btn btn-primary" :disabled="!canConfirm" @click="handleConfirm">
          确认选择
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 模态框背景 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 模态框容器 */
.modal-container {
  background: var(--ev-c-white);
  border-radius: 20px;
  width: 95%;
  max-width: 880px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--ev-c-white-border);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 模态框头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid var(--ev-c-white-border);
  background: linear-gradient(135deg, var(--ev-c-white) 0%, var(--ev-c-white-soft) 100%);
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: 1.3;
}

.modal-title::before {
  content: '🌐';
  font-size: 22px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 关闭按钮 */
.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--ev-c-text-3);
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.close-btn:hover {
  background: var(--ev-c-white-mute);
  color: var(--ev-c-text-1);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.close-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: var(--ev-c-primary-light);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translate(-50%, -50%);
}

.close-btn:hover::before {
  width: 100%;
  height: 100%;
  opacity: 0.1;
}

/* 模态框主体 */
.modal-body {
  padding: 28px;
  flex: 1;
  overflow-y: auto;
}

.modal-body::-webkit-scrollbar {
  width: 10px;
}

.modal-body::-webkit-scrollbar-track {
  background: var(--ev-c-white-mute);
  border-radius: 5px;
  margin: 10px 0;
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--ev-c-text-4);
  border-radius: 5px;
  transition: all 0.2s ease;
  border: 2px solid var(--ev-c-white-mute);
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--ev-c-text-3);
  transform: scaleY(1.1);
}

/* 描述区域 */
.description {
  margin-bottom: 28px;
  color: var(--ev-c-text-2);
  font-size: 15px;
  line-height: 1.6;
  padding: 20px;
  background: linear-gradient(135deg, var(--ev-c-white-soft) 0%, var(--ev-c-white) 100%);
  border-radius: 12px;
  border-left: 4px solid var(--ev-c-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 错误消息 */
.error-message {
  margin-bottom: 28px;
  padding: 18px;
  background: linear-gradient(135deg, var(--ev-c-danger-light) 0%, var(--ev-c-white) 100%);
  color: var(--ev-c-danger);
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  border: 1px solid var(--ev-c-danger-light);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}

.error-message::before {
  content: '⚠️';
  font-size: 20px;
  flex-shrink: 0;
  margin-top: -2px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* 镜像列表 */
.mirror-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 8px;
}

/* 镜像列表滚动条 */
.mirror-list::-webkit-scrollbar {
  width: 8px;
}

.mirror-list::-webkit-scrollbar-track {
  background: var(--ev-c-white-mute);
  border-radius: 4px;
  margin: 8px 0;
}

.mirror-list::-webkit-scrollbar-thumb {
  background: var(--ev-c-text-4);
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid var(--ev-c-white-mute);
}

.mirror-list::-webkit-scrollbar-thumb:hover {
  background: var(--ev-c-text-3);
}

/* 镜像项 */
.mirror-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border: 2px solid var(--ev-c-white-border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--ev-c-white);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.mirror-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: transparent;
  transition: background 0.3s ease;
}

.mirror-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
  transition: left 0.6s ease;
}

.mirror-item:hover::after {
  left: 100%;
}

.mirror-item:hover {
  border-color: var(--ev-c-primary);
  background: linear-gradient(135deg, var(--ev-c-white) 0%, var(--ev-c-primary-light) 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.mirror-item:hover::before {
  background: var(--ev-c-primary);
}

.mirror-item.selected {
  border-color: var(--ev-c-primary);
  background: linear-gradient(135deg, var(--ev-c-primary-light) 0%, var(--ev-c-white) 100%);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
  transform: translateY(-2px);
}

.mirror-item.selected::before {
  background: var(--ev-c-primary);
}

.mirror-item.selected::after {
  background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.2) 50%, transparent 100%);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* 镜像信息 */
.mirror-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
  gap: 24px;
}

.mirror-details {
  flex: 1;
  min-width: 0;
}

.mirror-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.3;
}

.mirror-name::before {
  content: '🔗';
  font-size: 16px;
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.mirror-item:hover .mirror-name::before {
  transform: rotate(15deg);
}

.mirror-url {
  font-size: 14px;
  color: var(--ev-c-text-2);
  font-family: 'Monaco', 'Consolas', monospace;
  word-break: break-all;
  margin-bottom: 10px;
  line-height: 1.5;
  padding: 8px 12px;
  background: var(--ev-c-white-mute);
  border-radius: 8px;
  border: 1px solid var(--ev-c-white-border);
  transition: all 0.3s ease;
}

.mirror-item:hover .mirror-url {
  background: var(--ev-c-white);
  border-color: var(--ev-c-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.mirror-region {
  font-size: 13px;
  color: var(--ev-c-text-2);
  background: var(--ev-c-white-mute);
  padding: 6px 12px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--ev-c-white-border);
  transition: all 0.3s ease;
  font-weight: 500;
}

.mirror-region::before {
  content: '📍';
  font-size: 12px;
}

.mirror-item:hover .mirror-region {
  background: var(--ev-c-primary);
  color: white;
  border-color: var(--ev-c-primary);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* 自定义镜像地址选项 */
.custom-mirror-option {
  margin-bottom: 28px;
}

.btn-custom-mirror {
  width: 100%;
  padding: 20px 24px;
  border: 2px dashed var(--ev-c-white-border);
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--ev-c-white) 0%, var(--ev-c-white-soft) 100%);
  color: var(--ev-c-text-2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.btn-custom-mirror::before {
  content: '➕';
  font-size: 18px;
  transition: transform 0.3s ease;
}

.btn-custom-mirror:hover {
  border-color: var(--ev-c-primary);
  color: var(--ev-c-primary);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, var(--ev-c-white) 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.btn-custom-mirror:hover::before {
  transform: rotate(90deg) scale(1.2);
}

/* 自定义镜像输入 */
.custom-mirror-input {
  padding: 24px;
  border: 1px solid var(--ev-c-white-border);
  border-radius: 14px;
  background: linear-gradient(135deg, var(--ev-c-white-soft) 0%, var(--ev-c-white) 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 4px solid var(--ev-c-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mirror-input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid var(--ev-c-white-border);
  border-radius: 10px;
  font-size: 15px;
  margin-bottom: 14px;
  font-family: 'Monaco', 'Consolas', monospace;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--ev-c-white);
  color: var(--ev-c-text-1);
}

.mirror-input:focus {
  outline: none;
  border-color: var(--ev-c-primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
  background: linear-gradient(135deg, var(--ev-c-white) 0%, var(--ev-c-primary-light) 100%);
}

.input-hint {
  font-size: 13px;
  color: var(--ev-c-text-3);
  line-height: 1.5;
  padding: 10px 14px;
  background: var(--ev-c-white-mute);
  border-radius: 8px;
  border-left: 3px solid var(--ev-c-text-4);
  transition: all 0.3s ease;
}

.custom-mirror-input:focus-within .input-hint {
  border-left-color: var(--ev-c-primary);
  color: var(--ev-c-text-2);
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 28px;
  border-top: 1px solid var(--ev-c-white-border);
  background: linear-gradient(135deg, var(--ev-c-white) 0%, var(--ev-c-white-soft) 100%);
  flex-wrap: wrap;
}

.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-secondary {
  background: linear-gradient(135deg, var(--ev-c-white-mute) 0%, var(--ev-c-white) 100%);
  color: var(--ev-c-text-1);
  border: 1px solid var(--ev-c-white-border);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--ev-c-white-border) 0%, var(--ev-c-white) 100%);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.btn-primary {
  background: linear-gradient(135deg, var(--ev-c-primary) 0%, var(--ev-c-primary-light) 100%);
  color: white;
  font-weight: 700;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--ev-c-primary-light) 0%, var(--ev-c-primary) 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
}

.btn-primary::before {
  content: '✅';
  font-size: 16px;
}

.btn-outline {
  padding: 14px 28px;
  border: 1px solid var(--ev-c-white-border);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  color: var(--ev-c-text-2);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.btn-outline::before {
  content: '🌐';
  font-size: 16px;
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--ev-c-primary);
  color: var(--ev-c-primary);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, var(--ev-c-white) 100%);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-container {
    width: 98%;
    max-height: 95vh;
    border-radius: 16px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }

  .modal-title {
    font-size: 18px;
  }

  .mirror-item {
    padding: 20px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
    padding: 16px;
  }

  .mirror-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .mirror-url {
    font-size: 13px;
  }
}

/* 平板设备 */
@media (max-width: 1024px) {
  .modal-container {
    max-width: 90%;
  }

  .mirror-info {
    gap: 16px;
  }
}
</style>
