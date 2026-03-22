import { ITaskAPI, PullTasksInput, TaskDTO } from '@timelapse/application'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  PaginatedViewModel,
  TaskViewModel,
  ViewModel,
} from '@timelapse/presentation/view-models'

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
