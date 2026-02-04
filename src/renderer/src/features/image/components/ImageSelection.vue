<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useImageStore } from '../stores/imageStore'

// 安装模式
type InstallMode = 'auto' | 'manual'

// 发行版类型
type DistributionType = 'debian-desktop' | 'debian-server' | 'ubuntu-desktop' | 'ubuntu-server'

interface ImagePaths {
  boot: string
  cache: string
  userdata: string
}

interface ImageType {
  key: keyof ImagePaths
  label: string
  description: string
  icon: string
  required: boolean
  color: string
}

interface Distribution {
  id: DistributionType
  name: string
  description: string
  icon: string
  color: string
}

const imageTypes: ImageType[] = [
  {
    key: 'boot',
    label: 'U-Boot',
    description: 'U-Boot引导加载程序',
    icon: '🚀',
    required: true,
    color: '#3b82f6'
  },
  {
    key: 'cache',
    label: 'xiaomi-k20pro-boot.img',
    description: 'Boo内核引导镜像',
    icon: '💾',
    required: true,
    color: '#10b981'
  },
  {
    key: 'userdata',
    label: 'rootfs.img',
    description: '根文件系统',
    icon: '📦',
    required: true,
    color: '#f59e0b'
  }
]

const distributions: Distribution[] = [
  {
    id: 'debian-desktop',
    name: 'Debian 桌面版',
    description: '稳定的Debian桌面环境',
    icon: '🖥️',
    color: '#d70a53'
  },
  {
    id: 'debian-server',
    name: 'Debian 服务器版',
    description: '轻量级的Debian服务器',
    icon: '🖧',
    color: '#d70a53'
  },
  {
    id: 'ubuntu-desktop',
    name: 'Ubuntu 桌面版',
    description: '用户友好的Ubuntu桌面',
    icon: '🖥️',
    color: '#e95420'
  },
  {
    id: 'ubuntu-server',
    name: 'Ubuntu 服务器版',
    description: '强大的Ubuntu服务器',
    icon: '🖧',
    color: '#e95420'
  }
]

// 使用imageStore
const imageStore = useImageStore()

const dragOverStates = ref({
  boot: false,
  cache: false,
  userdata: false
})

const isHovering = ref<string | null>(null)
const isTransitioning = ref(false)

// 计算属性
const installMode = computed({
  get: () => imageStore.installMode,
  set: (value) => {
    isTransitioning.value = true
    imageStore.setSelectionMode(value)
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }
})
const selectedDistribution = computed(
  () => imageStore.selectedDistribution as DistributionType | null
)
const imagePaths = computed(() => imageStore.imagePaths)

const isReady = computed(() => {
  if (installMode.value === 'auto') {
    return selectedDistribution.value !== null && selectedDistribution.value !== undefined
  } else {
    return imageStore.hasSelectedImage
  }
})

const validationStatus = computed(() => {
  return {
    boot: {
      isValid: imagePaths.value.boot !== '' && imageStore.validateImageFile(imagePaths.value.boot),
      error:
        imagePaths.value.boot && !imageStore.validateImageFile(imagePaths.value.boot)
          ? '文件格式不正确，请选择.img文件'
          : ''
    },
    cache: {
      isValid:
        imagePaths.value.cache !== '' && imageStore.validateImageFile(imagePaths.value.cache),
      error:
        imagePaths.value.cache && !imageStore.validateImageFile(imagePaths.value.cache)
          ? '文件格式不正确，请选择.img文件'
          : ''
    },
    userdata: {
      isValid:
        imagePaths.value.userdata !== '' && imageStore.validateImageFile(imagePaths.value.userdata),
      error:
        imagePaths.value.userdata && !imageStore.validateImageFile(imagePaths.value.userdata)
          ? '文件格式不正确，请选择.img文件'
          : ''
    }
  }
})

const selectedCount = computed(() => {
  if (installMode.value === 'auto') {
    return selectedDistribution.value ? 1 : 0
  } else {
    return imageTypes.filter((type) => validationStatus.value[type.key].isValid).length
  }
})

// 方法
const selectMode = (mode: InstallMode): void => {
  imageStore.imageSelection.mode = mode

  // 当切换到手动安装模式时，清除选择的发行版
  if (mode === 'manual') {
    imageStore.imageSelection.distribution = undefined
    // 更新hasSelectedImage状态，基于imagePaths
    imageStore.hasSelectedImage = Object.values(imageStore.imagePaths).some((img) => img !== '')
  }
}

const selectDistribution = (distribution: DistributionType): void => {
  imageStore.imageSelection.distribution = distribution
  imageStore.hasSelectedImage = true
}

const prepareForFlashing = (): unknown => {
  return imageStore.getSelectionData
}

const selectImage = async (type: keyof ImagePaths): Promise<void> => {
  try {
    const result = await window.api.ipcRenderer.invoke('selectImage', type)
    if (result) {
      imageStore.setImagePath(type, result as string)
    }
  } catch (error) {
    console.error('选择镜像文件失败:', error)
  }
}

const clearImage = (type: keyof ImagePaths): void => {
  imageStore.clearImagePath(type)
}

const getFileName = (path: string): string => {
  return imageStore.getImageFileName(path)
}

const handleDragOver = (e: DragEvent, type: keyof ImagePaths): void => {
  e.preventDefault()
  dragOverStates.value[type] = true
}

const handleDragLeave = (e: DragEvent, type: keyof ImagePaths): void => {
  e.preventDefault()
  dragOverStates.value[type] = false
}

const handleDrop = async (e: DragEvent, type: keyof ImagePaths): Promise<void> => {
  e.preventDefault()
  dragOverStates.value[type] = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.img')) {
      const filePath = (file as { path?: string }).path || file.name
      imageStore.setImagePath(type, filePath)
    }
  }
}

// 暴露给父组件的方法
defineExpose({
  prepareForFlashing
})

onMounted(() => {
  // 初始化代码
})
</script>

<template>
  <div class="image-selection">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">镜像选择</h1>
      <div class="status-indicator" :class="{ ready: isReady }">
        <span class="status-icon">{{ isReady ? '✅' : '📋' }}</span>
        <span class="status-text">
          {{
            isReady
              ? '准备就绪'
              : `${selectedCount}/${installMode === 'auto' ? 1 : imageTypes.length} 已选择`
          }}
        </span>
      </div>
    </div>

    <!-- 安装模式选择 -->
    <div class="mode-selection">
      <div class="mode-tabs">
        <button
          class="mode-tab"
          :class="{ active: installMode === 'auto' }"
          @click="selectMode('auto')"
        >
          <span class="tab-icon">⚡</span>
          <span class="tab-text">自动安装</span>
        </button>
        <button
          class="mode-tab"
          :class="{ active: installMode === 'manual' }"
          @click="selectMode('manual')"
        >
          <span class="tab-icon">🔧</span>
          <span class="tab-text">手动安装</span>
        </button>
      </div>

      <!-- 模式切换过渡效果 -->
      <transition name="mode-fade" mode="out-in">
        <!-- 自动安装模式 -->
        <div v-if="installMode === 'auto'" :key="'auto'" class="auto-install">
          <div class="distribution-selection">
            <h3 class="section-title">请选择安装的发行版</h3>
            <div class="distribution-grid">
              <div
                v-for="distro in distributions"
                :key="distro.id"
                class="distribution-card"
                :class="{ selected: selectedDistribution === distro.id }"
                @click="selectDistribution(distro.id)"
              >
                <div class="distro-icon" :style="{ backgroundColor: distro.color }">
                  {{ distro.icon }}
                </div>
                <div class="distro-info">
                  <h4 class="distro-name">{{ distro.name }}</h4>
                  <p class="distro-description">{{ distro.description }}</p>
                </div>
                <div class="selection-indicator">
                  <span v-if="selectedDistribution === distro.id">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 手动安装模式 -->
        <div v-else :key="'manual'" class="manual-install">
          <!-- 三个并排的小方块 -->
          <div class="selection-grid">
            <div
              v-for="type in imageTypes"
              :key="type.key"
              class="selection-block"
              :class="{
                selected: validationStatus[type.key].isValid,
                error: !!validationStatus[type.key].error,
                'drag-over': dragOverStates[type.key],
                'is-hovering': isHovering === type.key
              }"
              @mouseenter="isHovering = type.key"
              @mouseleave="isHovering = null"
              @dragover="handleDragOver($event, type.key)"
              @dragleave="handleDragLeave($event, type.key)"
              @drop="handleDrop($event, type.key)"
            >
              <!-- 方块头部 -->
              <div class="block-header">
                <div class="type-icon" :style="{ backgroundColor: type.color }">
                  {{ type.icon }}
                </div>
                <div class="type-info">
                  <h3 class="type-label">{{ type.label }}</h3>
                  <p class="type-description">{{ type.description }}</p>
                  <p class="format-hint">请选择.img格式文件</p>
                </div>
                <div
                  class="status-dot"
                  :class="{
                    valid: validationStatus[type.key].isValid,
                    error: !!validationStatus[type.key].error
                  }"
                ></div>
              </div>

              <!-- 文件显示区 -->
              <div class="file-display">
                <div v-if="imagePaths[type.key]" class="file-selected">
                  <div class="file-icon">📄</div>
                  <div class="file-info">
                    <p class="file-name">{{ getFileName(imagePaths[type.key]) }}</p>
                    <div v-if="validationStatus[type.key].error" class="file-error">
                      <span class="error-icon">⚠️</span>
                      <span class="error-message">{{ validationStatus[type.key].error }}</span>
                    </div>
                  </div>
                </div>

                <div v-else class="file-empty" @click="selectImage(type.key)">
                  <div class="empty-icon">📁</div>
                  <p class="empty-text">拖拽或点击选择</p>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="block-actions">
                <button
                  class="btn-select"
                  :disabled="validationStatus[type.key].isValid"
                  @click="selectImage(type.key)"
                >
                  选择文件
                </button>
                <button
                  class="btn-clear"
                  :disabled="!imagePaths[type.key]"
                  @click="clearImage(type.key)"
                >
                  清除
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.image-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 12px;
  background: var(--color-background-soft);
  overflow: hidden;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0 12px 0;
  border-bottom: 1px solid var(--ev-c-white-border);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  letter-spacing: -0.5px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-background-mute);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.status-indicator.ready {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--ev-c-success);
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 600;
}

/* 安装模式选择 */
.mode-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-tabs {
  display: flex;
  background: var(--color-background-mute);
  border-radius: 10px;
  padding: 2px;
  gap: 2px;
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ev-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab:hover {
  background: var(--color-background-soft);
}

.mode-tab.active {
  background: var(--color-background);
  color: var(--ev-c-text-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  font-size: 16px;
}

.tab-text {
  font-weight: 600;
}

/* 自动安装模式 */
.auto-install {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.distribution-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin: 0;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.distribution-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: var(--color-background);
  border: 2px solid var(--ev-c-white-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.distribution-card:hover {
  border-color: var(--ev-c-primary-light);
  transform: translateY(-2px);
}

.distribution-card.selected {
  border-color: var(--ev-c-primary);
  background: rgba(59, 130, 246, 0.05);
}

.distro-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.distro-info {
  flex: 1;
}

.distro-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin: 0 0 2px 0;
}

.distro-description {
  font-size: 12px;
  color: var(--ev-c-text-3);
  margin: 0;
}

.selection-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--ev-c-white-border);
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  color: var(--ev-c-primary);
}

.distribution-card.selected .selection-indicator {
  border-color: var(--ev-c-primary);
  background: var(--ev-c-primary);
  color: white;
}

/* 手动安装模式 - 保持原有样式 */
.manual-install {
  flex: 1;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  height: 100%;
}

.selection-block {
  background: var(--color-background);
  border: 2px solid var(--ev-c-white-border);
  border-radius: 10px;
  padding: 10px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 150px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.selection-block:hover {
  border-color: var(--ev-c-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.selection-block:hover::before {
  transform: scaleX(1);
}

.selection-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--ev-c-primary), var(--ev-c-primary-light));
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.selection-block:hover {
  border-color: var(--ev-c-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.selection-block:hover::before {
  transform: scaleX(1);
}

.selection-block.selected {
  border-color: var(--ev-c-success);
  background: rgba(16, 185, 129, 0.02);
}

.selection-block.selected::before {
  background: linear-gradient(90deg, var(--ev-c-success), var(--ev-c-success-light));
  transform: scaleX(1);
}

.selection-block.error {
  border-color: var(--ev-c-danger);
  background: rgba(239, 68, 68, 0.02);
}

.selection-block.error::before {
  background: linear-gradient(90deg, var(--ev-c-danger), var(--ev-c-danger-light));
  transform: scaleX(1);
}

.selection-block.drag-over {
  border-color: var(--ev-c-primary);
  background: rgba(59, 130, 246, 0.05);
  transform: scale(1.02);
}

/* 方块头部 */
.block-header {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
  position: relative;
}

.type-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.selection-block:hover .type-icon {
  transform: scale(1.05);
}

.type-info {
  flex: 1;
}

.type-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin: 0 0 1px 0;
  line-height: 1.2;
}

.type-description {
  font-size: 11px;
  color: var(--ev-c-text-3);
  margin: 0;
  line-height: 1.2;
}

.format-hint {
  font-size: 9px;
  color: var(--ev-c-text-4);
  margin: 1px 0 0 0;
  font-weight: 400;
  line-height: 1.2;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ev-c-text-4);
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 3px;
}

.status-dot.valid {
  background: var(--ev-c-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.status-dot.error {
  background: var(--ev-c-danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

/* 文件显示区 */
.file-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 6px;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--color-background-soft);
  border: 1px solid var(--ev-c-white-border);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.file-selected:hover {
  background: var(--color-background-mute);
}

.file-icon {
  font-size: 16px;
  opacity: 0.8;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.file-selected:hover .file-icon {
  transform: scale(1.1);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  margin: 0 0 1px 0;
  font-family: 'Monaco', 'Consolas', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-error {
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-icon {
  font-size: 10px;
}

.error-message {
  font-size: 10px;
  color: var(--ev-c-danger);
  font-weight: 500;
}

.file-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border: 2px dashed var(--ev-c-white-border);
  border-radius: 6px;
  transition: all 0.2s ease;
  min-height: 60px;
  cursor: pointer;
}

.file-empty:hover {
  border-color: var(--ev-c-primary-light);
  background: rgba(59, 130, 246, 0.02);
  transform: translateY(-1px);
}

.empty-icon {
  font-size: 16px;
  opacity: 0.6;
  margin-bottom: 4px;
  transition: transform 0.2s ease;
}

.file-empty:hover .empty-icon {
  transform: scale(1.1);
  opacity: 0.8;
}

.empty-text {
  font-size: 11px;
  color: var(--ev-c-text-3);
  font-weight: 500;
  margin: 0;
  text-align: center;
  transition: color 0.2s ease;
}

.file-empty:hover .empty-text {
  color: var(--ev-c-primary);
}

/* 操作按钮 */
.block-actions {
  display: flex;
  gap: 4px;
  margin-top: auto;
}

.btn-select,
.btn-clear {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--ev-c-white-border);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-select {
  background: var(--ev-c-primary);
  color: var(--ev-c-text-inverse);
  border-color: var(--ev-c-primary);
}

.btn-select:hover:not(:disabled) {
  background: var(--ev-c-primary-light);
  border-color: var(--ev-c-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-select:disabled {
  background: var(--ev-c-text-4);
  border-color: var(--ev-c-text-4);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.btn-clear {
  background: var(--color-background);
  color: var(--ev-c-text-3);
}

.btn-clear:hover:not(:disabled) {
  background: var(--color-background-mute);
  color: var(--ev-c-text-1);
  transform: translateY(-1px);
}

.btn-clear:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* 模式切换过渡效果 */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.mode-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.mode-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 分发版卡片动画效果增强 */
.distribution-card {
  position: relative;
  overflow: hidden;
}

.distribution-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0));
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.distribution-card:hover::before {
  transform: translateX(0);
}

/* 选择指示器动画 */
.selection-indicator {
  transition: all 0.3s ease;
}

.distribution-card.selected .selection-indicator {
  transform: scale(1.2);
}

/* 状态指示器动画 */
.status-indicator {
  transition: all 0.3s ease;
}

.status-indicator.ready {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
}
</style>
