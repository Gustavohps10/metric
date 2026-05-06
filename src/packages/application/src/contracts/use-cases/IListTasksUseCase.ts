import { AppError, Either } from '@metric-org/shared/helpers'

import { PagedResultDTO, TaskDTO } from '@/dtos'

export interface ListTasksInput {
  workspaceId: string
  connectionInstanceId: string
}

export interface IListTasksUseCase {
  execute(
    input: ListTasksInput,
  ): Promise<Either<AppError, PagedResultDTO<TaskDTO>>>
}
