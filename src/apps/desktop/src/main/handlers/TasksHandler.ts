import {
  IGetWorkspaceUseCase,
  IListTasksUseCase,
  ITaskPullUseCase,
  PagedResultDTO,
  TaskDTO,
} from '@metric-org/application'
import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  PaginatedViewModel,
  TaskViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

export interface ListTasksRequest {
  workspaceId: string
  connectionInstanceId: string
}

export interface PullTasksRequest {
  workspaceId: string
  connectionInstanceId: string
  memberId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export class TasksHandler {
  constructor(
    private readonly listTasksService: IListTasksUseCase,
    private readonly taskPullService: ITaskPullUseCase,
    private readonly getWorkspaceService: IGetWorkspaceUseCase,
  ) {}

  public async listTasks(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<ListTasksRequest>,
  ): Promise<PaginatedViewModel<TaskViewModel[]>> {
    const workspaceResult = await this.getWorkspaceService.execute({
      workspaceId: body.workspaceId,
    })

    if (workspaceResult.isFailure()) {
      return {
        statusCode: 404,
        isSuccess: false,
        error: 'WORKSPACE_NAO_ENCONTRADO',
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      }
    }

    const connection = workspaceResult.success.dataSourceConnections.find(
      (c) => c.id === body.connectionInstanceId,
    )

    if (!connection) {
      return {
        statusCode: 404,
        isSuccess: false,
        error: 'CONEXAO_NAO_ENCONTRADA',
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      }
    }

    const result: Either<
      AppError,
      PagedResultDTO<TaskDTO>
    > = await this.listTasksService.execute({
      workspaceId: body.workspaceId,
      pluginId: connection.dataSourceId,
      connectionInstanceId: body.connectionInstanceId,
    })

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error: result.failure.messageKey || 'Erro ao listar tarefas',
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      }
    }

    return {
      statusCode: 200,
      isSuccess: true,
      data: result.success.items,
      totalItems: result.success.total,
      totalPages: Math.ceil(
        result.success.total / (result.success.pageSize || 1),
      ),
      currentPage: result.success.page || 1,
    }
  }

  public async pull(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<PullTasksRequest>,
  ): Promise<ViewModel<TaskDTO[]>> {
    const workspaceResult = await this.getWorkspaceService.execute({
      workspaceId: body.workspaceId,
    })

    if (workspaceResult.isFailure()) {
      return {
        statusCode: 404,
        isSuccess: false,
        error: 'WORKSPACE_NAO_ENCONTRADO',
        data: [],
      }
    }

    const connection = workspaceResult.success.dataSourceConnections.find(
      (c) => c.id === body.connectionInstanceId,
    )

    if (!connection) {
      return {
        statusCode: 404,
        isSuccess: false,
        error: 'CONEXAO_NAO_ENCONTRADA',
        data: [],
      }
    }

    const result: Either<AppError, TaskDTO[]> =
      await this.taskPullService.execute({
        memberId: body.memberId,
        workspaceId: body.workspaceId,
        pluginId: connection.dataSourceId,
        connectionInstanceId: body.connectionInstanceId,
        checkpoint: body.checkpoint,
        batch: body.batch,
      })

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error: result.failure.messageKey || 'Erro ao sincronizar tarefas',
        data: [],
      }
    }

    return {
      statusCode: 200,
      isSuccess: true,
      data: result.success,
    }
  }
}
