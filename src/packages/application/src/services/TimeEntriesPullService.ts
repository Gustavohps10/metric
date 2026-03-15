import {
  AppError,
  Either,
  InternalServerError,
  UnauthorizedError,
} from '@timelapse/cross-cutting/helpers'

import { IDataSourceResolver } from '@/contracts/resolvers'
import {
  ITimeEntriesPullUseCase,
  PullTimeEntriesInput,
} from '@/contracts/use-cases'
import { TimeEntryDTO } from '@/dtos'
import { SessionManager } from '@/workflow'

export class TimeEntriesPullService implements ITimeEntriesPullUseCase {
  public constructor(
    private readonly sessionManager: SessionManager,
    private readonly dataSourceResolver: IDataSourceResolver,
  ) {}

  public async execute(
    input: PullTimeEntriesInput,
  ): Promise<Either<AppError, TimeEntryDTO[]>> {
    try {
      const sessionUser = this.sessionManager.getCurrentUser()
      const memberId =
        (input.memberId && String(input.memberId).trim()) || sessionUser?.id

      if (!memberId) {
        return Either.failure(
          UnauthorizedError.danger('Usuário não autenticado.'),
        )
      }

      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.dataSourceId,
      )

      const timeEntries = await adapter.timeEntryQuery.pull(
        memberId,
        input.checkpoint,
        input.batch,
      )

      return Either.success(timeEntries)
    } catch (error) {
      return Either.failure(InternalServerError.danger('ERRO_INESPERADO'))
    }
  }
}
