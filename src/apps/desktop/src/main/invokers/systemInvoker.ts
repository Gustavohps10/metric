import { EnvironmentInfo, ISystemAPI } from '@metric-org/application'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const systemInvoker: ISystemAPI = {
  getAppVersion: (): Promise<string> => IpcInvoker.invoke('SYSTEM_VERSION'),
  getEnvironment: (): Promise<EnvironmentInfo> =>
    IpcInvoker.invoke('SYSTEM_GET_ENVIRONMENT'),
}
