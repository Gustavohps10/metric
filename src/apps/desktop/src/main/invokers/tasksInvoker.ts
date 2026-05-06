import { ITaskAPI } from '@metric-org/application'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const tasksInvoker: ITaskAPI = {
  listTasks: () => IpcInvoker.invoke('TASKS_LIST'),
  pull: (payload) => IpcInvoker.invoke('TASKS_PULL', payload),
}
