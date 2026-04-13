import { ElectronAPI } from '@electron-toolkit/preload'

import type { IApplicationAPI } from '@metric-org/application'

declare global {
  interface Window {
    electron: ElectronAPI
    api: IApplicationAPI
  }
}
