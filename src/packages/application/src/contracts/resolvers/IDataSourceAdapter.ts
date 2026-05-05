import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import {
  IMemberQuery,
  IMetadataQuery,
  ITaskQuery,
  ITaskRepository,
  ITimeEntryQuery,
  ITimeEntryRepository,
} from '@/contracts/data'
import { IAuthenticationStrategy } from '@/contracts/strategies'
import { MemberDTO } from '@/dtos'

export interface IDataSourceAdapter {
  getAuthenticatedMemberData(): Either<AppError, MemberDTO>
  readonly id: string
  readonly authenticationStrategy: IAuthenticationStrategy
  readonly memberQuery: IMemberQuery
  readonly taskQuery: ITaskQuery
  readonly taskRepository: ITaskRepository
  readonly timeEntryQuery: ITimeEntryQuery
  readonly timeEntryRepository: ITimeEntryRepository
  readonly metadataQuery: IMetadataQuery
}
