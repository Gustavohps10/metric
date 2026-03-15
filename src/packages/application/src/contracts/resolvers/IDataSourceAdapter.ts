import {
  IMemberQuery,
  IMetadataQuery,
  ITaskQuery,
  ITaskRepository,
  ITimeEntryQuery,
  ITimeEntryRepository,
} from '@/contracts/data'
import { IAuthenticationStrategy } from '@/contracts/strategies'

export interface IDataSourceAdapter {
  readonly id: string
  readonly authenticationStrategy: IAuthenticationStrategy
  readonly memberQuery: IMemberQuery
  readonly taskQuery: ITaskQuery
  readonly taskRepository: ITaskRepository
  readonly timeEntryQuery: ITimeEntryQuery
  readonly timeEntryRepository: ITimeEntryRepository
  readonly metadataQuery: IMetadataQuery
}
