import { AppError, Either } from '@metric-org/shared/helpers'

import { PagedResultDTO, TimeEntryDTO } from '@/dtos'

export interface ListTimeEntriesInput {
  workspaceId: string
  connectionInstanceId: string
  startDate: Date
  endDate: Date
}

export interface IListTimeEntriesUseCase {
  execute(
    input: ListTimeEntriesInput,
  ): Promise<Either<AppError, PagedResultDTO<TimeEntryDTO>>>
}
