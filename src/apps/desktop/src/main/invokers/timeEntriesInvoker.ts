import { ITimeEntriesAPI, PushTimeEntriesInput } from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  PaginatedViewModel,
  SyncDocumentViewModel,
  TimeEntryViewModel,
} from '@metric-org/presentation/view-models'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'
import { ListTimeEntriesRequest, PullTimeEntriesRequest } from '@/main/handlers'

export const timeEntriesInvoker: ITimeEntriesAPI = {
  findByMemberId: (
    payload: IRequest<ListTimeEntriesRequest>,
  ): Promise<PaginatedViewModel<TimeEntryViewModel[]>> =>
    IpcInvoker.invoke<
      IRequest<ListTimeEntriesRequest>,
      PaginatedViewModel<TimeEntryViewModel[]>
    >('LIST_TIME_ENTRIES', payload),

  pull: (
    payload: IRequest<PullTimeEntriesRequest>,
  ): Promise<TimeEntryViewModel[]> =>
    IpcInvoker.invoke<IRequest<PullTimeEntriesRequest>, TimeEntryViewModel[]>(
      'TIME_ENTRIES_PULL',
      payload,
    ),

  push: (
    payload: IRequest<PushTimeEntriesInput>,
  ): Promise<SyncDocumentViewModel<TimeEntryViewModel>[]> =>
    IpcInvoker.invoke<
      IRequest<PushTimeEntriesInput>,
      SyncDocumentViewModel<TimeEntryViewModel>[]
    >('TIME_ENTRIES_PUSH', payload),
}
