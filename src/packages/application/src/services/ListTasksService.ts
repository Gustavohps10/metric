import {
  AppError,
  Either,
  InternalServerError,
} from '@timelapse/cross-cutting/helpers'

import { IDataSourceResolver } from '@/contracts/resolvers'
import {
  IListTasksUseCase,
  ListTasksInput,
} from '@/contracts/use-cases/IListTasksUseCase'
import { TaskDTO } from '@/dtos'
import { PagedResultDTO } from '@/dtos/pagination'

export class ListTaskService implements IListTasksUseCase {
  constructor(private readonly dataSourceResolver: IDataSourceResolver) {}

  public async execute(
    input: ListTasksInput,
  ): Promise<Either<AppError, PagedResultDTO<TaskDTO>>> {
    try {
      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.dataSourceId,
      )
      const tasks = await adapter.taskQuery.findAll()
      return Either.success(tasks)
    } catch (error: unknown) {
      return Either.failure(InternalServerError.danger('ERRO_INESPERADO'))
    }
  }
}
