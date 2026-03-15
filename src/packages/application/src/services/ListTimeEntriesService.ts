import {
  AppError,
  Either,
  InternalServerError,
} from '@timelapse/cross-cutting/helpers'

import { IDataSourceResolver } from '@/contracts/resolvers'
import {
  IListTimeEntriesUseCase,
  ListTimeEntriesInput,
} from '@/contracts/use-cases/IListTimeEntriesUseCase'
import { PagedResultDTO, TimeEntryDTO } from '@/dtos'

export class ListTimeEntriesService implements IListTimeEntriesUseCase {
  public constructor(
    private readonly dataSourceResolver: IDataSourceResolver,
  ) {}

  public async execute(
    input: ListTimeEntriesInput,
  ): Promise<Either<AppError, PagedResultDTO<TimeEntryDTO>>> {
    try {
      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.dataSourceId,
      )

      const timeEntries = await adapter.timeEntryQuery.findByMemberId(
        input.memberId,
        input.startDate,
        input.endDate,
      )

      return Either.success(timeEntries)
    } catch (error) {
      return Either.failure(InternalServerError.danger('ERRO_INESPERADO'))
    }
  }
}
