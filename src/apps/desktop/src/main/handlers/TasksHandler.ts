import {
  IListTasksUseCase,
  ITaskPullUseCase,
  PagedResultDTO,
  PullTasksInput,
} from '@timelapse/application'
import { TaskDTO } from '@timelapse/application'
import { AppError, Either } from '@timelapse/cross-cutting/helpers'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  PaginatedViewModel,
  TaskViewModel,
  ViewModel,
} from '@timelapse/presentation/view-models'

export class TasksHandler {
  constructor(
    private readonly listTasksService: IListTasksUseCase,
    private readonly taskPullService: ITaskPullUseCase,
  ) {}

  public async listTasks(
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<{ workspaceId: string; dataSourceId: string }>,
  ): Promise<PaginatedViewModel<TaskViewModel[]>> {
    const result: Either<
      AppError,
      PagedResultDTO<TaskDTO>
    > = await this.listTasksService.execute(body)

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error: 'Erro ao listar tarefas',
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      }
    }

    const tasks: TaskDTO[] = result.success.items

    return {
      statusCode: 200,
      isSuccess: true,
      data: tasks,
      totalItems: tasks.length,
      totalPages: Math.ceil(tasks.length / result.success.pageSize),
      currentPage: result.success.page,
    }
  }

  public async pull(
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<PullTasksInput>,
  ): Promise<ViewModel<TaskDTO[]>> {
    const result: Either<AppError, TaskDTO[]> =
      await this.taskPullService.execute(body)

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error: 'Erro ao listar tarefas',
        data: [],
      }
    }

    const tasks: TaskDTO[] = result.success

    return {
      statusCode: 200,
      isSuccess: true,
      data: tasks,
    }
  }
}
