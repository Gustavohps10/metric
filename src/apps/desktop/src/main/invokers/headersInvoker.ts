import { IHeadersAPI } from '@timelapse/application'
import { IHeaders } from '@timelapse/cross-cutting/transport'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const headersInvoker: IHeadersAPI = {
  setDefaultHeaders: (headers: IHeaders): void =>
    IpcInvoker.setDefaultHeaders(headers),
  getDefaultHeaders: (): IHeaders => IpcInvoker.getDefaultHeaders(),
}
