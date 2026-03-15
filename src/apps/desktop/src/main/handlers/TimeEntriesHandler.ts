import {
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

export interface ListTimeEntriesRequest {
  workspaceId: string
  dataSourceId: string
  memberId: string
  startDate: Date
  endDate: Date
}

export interface PullTimeEntriesRequest {
  workspaceId: string
  dataSourceId: string
  memberId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export class TimeEntriesHandler {
  constructor(
    private readonly listTimeEntriesService: IListTimeEntriesUseCase,
    private readonly timeEntriesPullService: ITimeEntriesPullUseCase,
    private readonly timeEntriesPushService: ITimeEntriesPushUseCase,
  ) {}

  public async listTimeEntries(
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<ListTimeEntriesRequest>,
  ): Promise<PaginatedViewModel<TimeEntryViewModel[]>> {
    const result = await this.listTimeEntriesService.execute(body)

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
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<PullTimeEntriesRequest>,
  ): Promise<TimeEntryViewModel[]> {
    const result = await this.timeEntriesPullService.execute({
      workspaceId: body.workspaceId,
      dataSourceId: body.dataSourceId,
      memberId: body.memberId,
      checkpoint: body.checkpoint,
      batch: body.batch,
    })

    if (result.isFailure()) {
      return []
    }

    const dtos = result.success
    const viewModels: TimeEntryViewModel[] = dtos.map((dto) => ({
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

    return viewModels
  }

  public async push(
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<PushTimeEntriesInput>,
  ): Promise<SyncDocumentViewModel<TimeEntryViewModel>[]> {
    const result = await this.timeEntriesPushService.execute(body)

    if (result.isFailure()) {
      return []
    }

    const dtos = result.success
    const viewModels: SyncDocumentViewModel<TimeEntryViewModel>[] = dtos.map(
      (dto) => ({
        ...dto,
      }),
    )

    return viewModels
  }
}
