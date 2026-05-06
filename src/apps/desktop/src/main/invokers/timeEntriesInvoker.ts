import { ITimeEntriesAPI } from '@metric-org/application'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const timeEntriesInvoker: ITimeEntriesAPI = {
  findByMemberId: (payload) => IpcInvoker.invoke('LIST_TIME_ENTRIES', payload),
  pull: (payload) => IpcInvoker.invoke('TIME_ENTRIES_PULL', payload),
  push: (payload) => IpcInvoker.invoke('TIME_ENTRIES_PUSH', payload),
}
