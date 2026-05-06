import { FileData, IAddonsAPI } from '@metric-org/application'
import { IRequest } from '@metric-org/shared/transport'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const addonsInvoker: IAddonsAPI = {
  getInstalledById: (payload: IRequest<{ addonId: string }>) =>
    IpcInvoker.invoke('ADDONS_GETINSTALLED_BY_ID', payload),

  listAvailable: () => IpcInvoker.invoke('ADDONS_LIST_AVAILABLE'),
  listInstalled: () => IpcInvoker.invoke('ADDONS_LIST_INSTALLED'),

  updateLocal: (payload) => IpcInvoker.invoke('ADDONS_UPDATE_LOCAL', payload),

  import: (payload: IRequest<{ addon: FileData }>) =>
    IpcInvoker.invoke('ADDONS_IMPORT', payload),

  getInstaller: (payload: IRequest<{ installerUrl: string }>) =>
    IpcInvoker.invoke('ADDONS_GET_INSTALLER', payload),

  install: (
    payload: IRequest<
      { downloadUrl: string } & { onProgress?: (progress: number) => void }
    >,
  ) => IpcInvoker.invoke('ADDONS_INSTALL', payload),
}
