// 设备相关常量

export const ERROR_MESSAGES = {
  DEVICE_NOT_FOUND: '设备未找到，请确保设备已正确连接',
  DEVICE_NOT_CONNECTED: '设备未连接，请确保设备已正确连接到电脑',
  DEVICE_NOT_IN_FASTBOOT: '设备未在fastboot模式下连接，请确保设备已进入fastboot模式',
  COMMAND_EXECUTION_FAILED: '命令执行失败，请检查设备状态和连接'
}

export const SUCCESS_MESSAGES = {
  DEVICE_CONNECTED: '设备已成功连接',
  COMMAND_EXECUTED: '命令执行成功',
  FLASH_COMPLETED: '镜像刷入完成',
  REBOOT_INITIATED: '设备重启已启动'
}
