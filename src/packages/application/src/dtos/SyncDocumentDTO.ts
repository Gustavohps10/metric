import { AppError } from '@metric-org/cross-cutting/helpers'

export type SyncDocumentDTO<T> = T & {
  _deleted?: boolean
  conflicted?: boolean
  conflictData?: { server?: T; local: T }
  validationError?: AppError
  syncedAt?: Date
  assumedMasterState?: T
}
