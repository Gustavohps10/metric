import { ISessionAPI } from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  MemberViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const sessionInvoker: ISessionAPI = {
  getCurrentUser: (
    input: IRequest<{
      workspaceId: string
    }>,
  ): Promise<ViewModel<MemberViewModel>> =>
    IpcInvoker.invoke<
      IRequest<{
        workspaceId: string
      }>,
      ViewModel<MemberViewModel>
    >('GET_CURRENT_USER', input),
}
