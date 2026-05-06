import {
  IListTasksUseCase,
  ITaskPullUseCase,
  TaskDTO,
} from '@metric-org/application'
import { createResponseViewModel } from '@metric-org/shared/helpers'
import { IRequest } from '@metric-org/shared/transport'
import {
  PaginatedViewModel,
  TaskViewModel,
  ViewModel,
} from '@metric-org/shared/view-models'
import { IpcMainInvokeEvent } from 'electron'

import { HandlerBase } from '@/main/handlers/HandlerBase'
import { MetadataHandler } from '@/main/handlers/MetadataHandler'

export interface ListTasksRequest {
  workspaceId: string
  connectionInstanceId: string
}

export interface PullTasksRequest {
  workspaceId: string
  connectionInstanceId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export class TasksHandler implements HandlerBase<MetadataHandler> {
  constructor(
    private readonly listTasksService: IListTasksUseCase,
    private readonly taskPullService: ITaskPullUseCase,
  ) {}

  public async listTasks(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<ListTasksRequest>,
  ): Promise<PaginatedViewModel<TaskViewModel[]>> {
    const result = await this.listTasksService.execute({
      workspaceId: body.workspaceId,
      connectionInstanceId: body.connectionInstanceId,
    })

    const mappedResult = result.map((paged) => ({
      data: paged.items.map((task) => ({
        ...task,
      })),
      totalItems: paged.total,
      totalPages: Math.ceil(paged.total / (paged.pageSize || 1)),
      currentPage: paged.page || 1,
    }))

    return createResponseViewModel(mappedResult)
  }

  public async pull(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<PullTasksRequest>,
  ): Promise<ViewModel<TaskDTO[]>> {
    const result = await this.taskPullService.execute({
      workspaceId: body.workspaceId,
      connectionInstanceId: body.connectionInstanceId,
      checkpoint: body.checkpoint,
      batch: body.batch,
    })

    return createResponseViewModel(result)
  }
}
