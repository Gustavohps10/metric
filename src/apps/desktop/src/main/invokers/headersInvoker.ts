import { IHeadersAPI } from '@metric-org/application'
import { IHeaders } from '@metric-org/shared/transport'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const headersInvoker: IHeadersAPI = {
  setDefaultHeaders: (headers: IHeaders): void =>
    IpcInvoker.setDefaultHeaders(headers),
  getDefaultHeaders: (): IHeaders => IpcInvoker.getDefaultHeaders(),
}
