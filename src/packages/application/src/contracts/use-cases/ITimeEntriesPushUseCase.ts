import { AppError, Either } from '@metric-org/shared/helpers'

import { SyncDocumentDTO, TimeEntryDTO } from '@/dtos'

export type SyncTimeEntryDTO = SyncDocumentDTO<TimeEntryDTO>

export type PushTimeEntriesInput = {
  workspaceId: string
  pluginId: string
  connectionInstanceId: string
  entries: SyncTimeEntryDTO[]
}

export interface ITimeEntriesPushUseCase {
  execute(
    input: PushTimeEntriesInput,
  ): Promise<Either<AppError, SyncTimeEntryDTO[]>>
}
