import { AppError, Either } from '@metric-org/shared/helpers'

import { TimeEntryDTO } from '@/dtos'

export type PullTimeEntriesInput = {
  workspaceId: string
  connectionInstanceId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export interface ITimeEntriesPullUseCase {
  execute(
    input: PullTimeEntriesInput,
  ): Promise<Either<AppError, TimeEntryDTO[]>>
}
