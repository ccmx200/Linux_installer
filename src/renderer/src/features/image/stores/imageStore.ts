// 镜像状态管理
import { defineStore } from 'pinia'

interface ImageSelection {
  mode: 'auto' | 'manual'
  distribution?: string
  bootImage?: string
  cacheImage?: string
  userdataImage?: string
}

export const useImageStore = defineStore('image', {
  state: () => ({
    selectedImages: {
      boot: '',
      cache: '',
      userdata: ''
    },
    hasSelectedImage: false,
    imageSelection: {
      mode: 'auto'
    } as ImageSelection
  }),

  getters: {
    getSelectionData: (state) => {
      return state.imageSelection
    },
    installMode: (state) => {
      return state.imageSelection.mode
    },
    selectedDistribution: (state) => {
      return state.imageSelection.distribution
    },
    imagePaths: (state) => {
      return state.selectedImages
    }
  },

  actions: {
    selectImages(images: Partial<{ boot: string; cache: string; userdata: string }>) {
      this.selectedImages = {
        ...this.selectedImages,
        ...images
      }
      this.hasSelectedImage = Object.values(this.selectedImages).some((img) => img !== '')
    },

    setSelectionMode(mode: ImageSelection['mode']) {
      this.imageSelection.mode = mode
    },

    setDistribution(distribution: string) {
      this.imageSelection.distribution = distribution
      // 在自动安装模式下，选择发行版后设置hasSelectedImage为true
      if (this.imageSelection.mode === 'auto' && distribution) {
        this.hasSelectedImage = true
      }
    },

    setImagePath(type: 'boot' | 'cache' | 'userdata', path: string) {
      this.selectedImages[type] = path
      this.hasSelectedImage = Object.values(this.selectedImages).some((img) => img !== '')
    },

    clearImagePath(type: 'boot' | 'cache' | 'userdata') {
      this.selectedImages[type] = ''
      this.hasSelectedImage = Object.values(this.selectedImages).some((img) => img !== '')
    },

    validateImageFile(path: string): boolean {
      return path.endsWith('.img')
    },

    getImageFileName(path: string): string {
      return path.split('/').pop()?.split('\\').pop() || path
    },

    $reset() {
      this.selectedImages = {
        boot: '',
        cache: '',
        userdata: ''
      }
      this.hasSelectedImage = false
      this.imageSelection = {
        mode: 'manual'
      }
    }
  }
})
