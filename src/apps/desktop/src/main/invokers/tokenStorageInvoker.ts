import { ITokenStorageAPI } from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import { ViewModel } from '@metric-org/presentation/view-models'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'
import { TokenRequest } from '@/main/handlers'

export const tokenStorageInvoker: ITokenStorageAPI = {
  saveToken: (payload: IRequest<TokenRequest>): Promise<ViewModel<void>> =>
    IpcInvoker.invoke<IRequest<TokenRequest>, ViewModel<void>>(
      'SAVE_TOKEN',
      payload,
    ),
  getToken: (
    payload: IRequest<TokenRequest>,
  ): Promise<ViewModel<string | null>> =>
    IpcInvoker.invoke<IRequest<TokenRequest>, ViewModel<string | null>>(
      'GET_TOKEN',
      payload,
    ),
  deleteToken: (payload: IRequest<TokenRequest>): Promise<ViewModel<void>> =>
    IpcInvoker.invoke<IRequest<TokenRequest>, ViewModel<void>>(
      'DELETE_TOKEN',
      payload,
    ),
}
