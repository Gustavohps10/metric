import { AppError, Either } from '@timelapse/cross-cutting/helpers'

import { TimeEntryDTO } from '@/dtos'

export type PullTimeEntriesInput = {
  workspaceId: string
  pluginId: string
  connectionInstanceId: string
  memberId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export interface ITimeEntriesPullUseCase {
  execute(
    input: PullTimeEntriesInput,
  ): Promise<Either<AppError, TimeEntryDTO[]>>
}
