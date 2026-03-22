import { AppError, Either } from '@timelapse/cross-cutting/helpers'

import { PagedResultDTO, TaskDTO } from '@/dtos'

export interface ListTasksInput {
  workspaceId: string
  pluginId: string
  connectionInstanceId: string
}

export interface IListTasksUseCase {
  execute(
    input: ListTasksInput,
  ): Promise<Either<AppError, PagedResultDTO<TaskDTO>>>
}
