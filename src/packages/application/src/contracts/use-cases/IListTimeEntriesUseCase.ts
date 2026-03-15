import { AppError, Either } from '@timelapse/cross-cutting/helpers'

import { PagedResultDTO, TimeEntryDTO } from '@/dtos'

export interface ListTimeEntriesInput {
  workspaceId: string
  dataSourceId: string
  memberId: string
  startDate: Date
  endDate: Date
}

export interface IListTimeEntriesUseCase {
  execute(
    input: ListTimeEntriesInput,
  ): Promise<Either<AppError, PagedResultDTO<TimeEntryDTO>>>
}
