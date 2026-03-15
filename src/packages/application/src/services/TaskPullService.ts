import {
  AppError,
  Either,
  InternalServerError,
} from '@timelapse/cross-cutting/helpers'

import { IDataSourceResolver } from '@/contracts/resolvers'
import { ITaskPullUseCase, PullTasksInput } from '@/contracts/use-cases'
import { TaskDTO } from '@/dtos'
import { SessionManager } from '@/workflow'

export class TaskPullService implements ITaskPullUseCase {
  public constructor(
    private readonly sessionManager: SessionManager,
    private readonly dataSourceResolver: IDataSourceResolver,
  ) {}

  public async execute(
    input: PullTasksInput,
  ): Promise<Either<AppError, TaskDTO[]>> {
    try {
      const sessionUser = this.sessionManager.getCurrentUser()
      const memberId = sessionUser?.id ?? input.memberId

      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.dataSourceId,
      )

      const tasks = await adapter.taskQuery.pull(
        memberId,
        input.checkpoint,
        input.batch,
      )

      return Either.success(tasks)
    } catch (ex) {
      console.error('Error pulling tasks:', ex)
      return Either.failure(InternalServerError.danger('ERRO_INESPERADO'))
    }
  }
}
