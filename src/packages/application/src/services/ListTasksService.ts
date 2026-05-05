import { AppError, Either } from '@metric-org/cross-cutting/helpers'

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
        input.pluginId,
        input.connectionInstanceId,
      )

      const result = await adapter.getAuthenticatedMemberData()
      if (result.isFailure()) return result.forwardFailure()

      const member = result.success

      const tasks = await adapter.taskQuery.findAll()

      return Either.success(tasks)
    } catch (error: unknown) {
      return Either.failure(AppError.NotFound('ERRO_INESPERADO'))
    }
  }
}
