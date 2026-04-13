import { ITaskAPI, PullTasksInput, TaskDTO } from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  PaginatedViewModel,
  TaskViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const tasksInvoker: ITaskAPI = {
  listTasks: (): Promise<PaginatedViewModel<TaskViewModel[]>> =>
    IpcInvoker.invoke<IRequest<any>, PaginatedViewModel<TaskViewModel[]>>(
      'TASKS_LIST',
    ),

  pull: (payload: IRequest<PullTasksInput>): Promise<ViewModel<TaskDTO[]>> =>
    IpcInvoker.invoke<IRequest<PullTasksInput>, ViewModel<TaskDTO[]>>(
      'TASKS_PULL',
      payload,
    ),
}
