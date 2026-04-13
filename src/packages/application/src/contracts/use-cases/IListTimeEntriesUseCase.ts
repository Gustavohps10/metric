import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { PagedResultDTO, TimeEntryDTO } from '@/dtos'

export interface ListTimeEntriesInput {
  workspaceId: string
  pluginId: string
  connectionInstanceId: string
  memberId: string
  startDate: Date
  endDate: Date
}

export interface IListTimeEntriesUseCase {
  execute(
    input: ListTimeEntriesInput,
  ): Promise<Either<AppError, PagedResultDTO<TimeEntryDTO>>>
}
