import { ISystemAPI } from '@metric-org/application'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const systemInvoker: ISystemAPI = {
  getAppVersion: () => IpcInvoker.invoke('SYSTEM_VERSION'),
  getEnvironment: () => IpcInvoker.invoke('SYSTEM_GET_ENVIRONMENT'),
}
