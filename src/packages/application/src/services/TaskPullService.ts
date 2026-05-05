import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { IDataSourceResolver } from '@/contracts/resolvers'
import { ITaskPullUseCase, PullTasksInput } from '@/contracts/use-cases'
import { TaskDTO } from '@/dtos'

export class TaskPullService implements ITaskPullUseCase {
  public constructor(
    private readonly dataSourceResolver: IDataSourceResolver,
  ) {}

  public async execute(
    input: PullTasksInput,
  ): Promise<Either<AppError, TaskDTO[]>> {
    try {
      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.pluginId,
        input.connectionInstanceId,
      )

      const result = await adapter.getAuthenticatedMemberData()
      if (result.isFailure()) return result.forwardFailure()

      const member = result.success

      const tasks = await adapter.taskQuery.pull(
        member.id.toString(),
        input.checkpoint,
        input.batch,
      )

      return Either.success(tasks)
    } catch (ex) {
      return Either.failure(AppError.NotFound('ERRO_INESPERADO'))
    }
  }
}
