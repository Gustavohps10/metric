import {
  IGetWorkspaceUseCase,
  IListTimeEntriesUseCase,
  ITimeEntriesPullUseCase,
  ITimeEntriesPushUseCase,
  PushTimeEntriesInput,
} from '@timelapse/application'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  PaginatedViewModel,
  SyncDocumentViewModel,
  TimeEntryViewModel,
} from '@timelapse/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

export interface ListTimeEntriesRequest {
  workspaceId: string
  connectionInstanceId: string
  memberId: string
  startDate: Date
  endDate: Date
}

export interface PullTimeEntriesRequest {
  workspaceId: string
  connectionInstanceId: string
  memberId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export class TimeEntriesHandler {
  constructor(
    private readonly listTimeEntriesService: IListTimeEntriesUseCase,
    private readonly timeEntriesPullService: ITimeEntriesPullUseCase,
    private readonly timeEntriesPushService: ITimeEntriesPushUseCase,
    private readonly getWorkspaceService: IGetWorkspaceUseCase,
  ) {}

  public async listTimeEntries(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<ListTimeEntriesRequest>,
  ): Promise<PaginatedViewModel<TimeEntryViewModel[]>> {
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

    const result = await this.listTimeEntriesService.execute({
      workspaceId: body.workspaceId,
      pluginId: connection.dataSourceId,
      connectionInstanceId: body.connectionInstanceId,
      memberId: body.memberId,
      startDate: body.startDate,
      endDate: body.endDate,
    })

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error: result.failure.messageKey,
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      }
    }

    const timeEntries = result.success

    return {
      statusCode: 200,
      isSuccess: true,
      data: timeEntries.items,
      totalItems: timeEntries.total,
      totalPages: 1,
      currentPage: 1,
    }
  }

  public async pull(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<PullTimeEntriesRequest>,
  ): Promise<TimeEntryViewModel[]> {
    const workspaceResult = await this.getWorkspaceService.execute({
      workspaceId: body.workspaceId,
    })

    if (workspaceResult.isFailure()) {
      return []
    }

    const connection = workspaceResult.success.dataSourceConnections.find(
      (c) => c.id === body.connectionInstanceId,
    )

    if (!connection) {
      return []
    }

    const result = await this.timeEntriesPullService.execute({
      workspaceId: body.workspaceId,
      pluginId: connection.dataSourceId,
      connectionInstanceId: body.connectionInstanceId,
      memberId: body.memberId,
      checkpoint: body.checkpoint,
      batch: body.batch,
    })

    if (result.isFailure()) {
      return []
    }

    return result.success.map((dto) => ({
      id: dto.id,
      task: dto.task,
      user: dto.user,
      activity: dto.activity,
      startDate: dto.startDate,
      endDate: dto.endDate,
      timeSpent: dto.timeSpent,
      comments: dto.comments,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    }))
  }

  public async push(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<PushTimeEntriesInput>,
  ): Promise<SyncDocumentViewModel<TimeEntryViewModel>[]> {
    const result = await this.timeEntriesPushService.execute(body)

    if (result.isFailure()) {
      return []
    }

    return result.success.map((dto) => ({
      ...dto,
    }))
  }
}
