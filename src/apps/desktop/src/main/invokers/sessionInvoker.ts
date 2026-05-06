import { ISessionAPI } from '@metric-org/application'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const sessionInvoker: ISessionAPI = {
  getCurrentUser: (payload) => IpcInvoker.invoke('GET_CURRENT_USER', payload),
}
