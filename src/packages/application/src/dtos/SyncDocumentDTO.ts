import { AppError } from '@metric-org/shared/helpers'

export type SyncDocumentDTO<T> = T & {
  _deleted?: boolean
  conflicted?: boolean
  conflictData?: { server?: T; local: T }
  validationError?: AppError
  syncedAt?: Date
  assumedMasterState?: T
}
