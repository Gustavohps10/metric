import { electronAPI } from '@electron-toolkit/preload'
import { IApplicationAPI } from '@metric-org/application'
import { contextBridge } from 'electron'

import {
  addonsInvoker,
  discordInvoker,
  headersInvoker,
  metadataInvoker,
  sessionInvoker,
  systemInvoker,
  tasksInvoker,
  timeEntriesInvoker,
  tokenStorageInvoker,
  workspacesInvoker,
} from '@/main/invokers'

const api: IApplicationAPI = {
  services: {
    workspaces: workspacesInvoker,
    session: sessionInvoker,
    tasks: tasksInvoker,
    timeEntries: timeEntriesInvoker,
    metadata: metadataInvoker,
  },
  modules: {
    headers: headersInvoker,
    tokenStorage: tokenStorageInvoker,
    system: systemInvoker,
  },
  integrations: {
    discord: discordInvoker,
    addons: addonsInvoker,
  },
  events: {
    on: <T = unknown>(channel: string, handler: (data: T) => void) => {
      const unsubscribe = electronAPI.ipcRenderer.on(
        channel,
        (_event, data: T) => {
          handler(data)
        },
      )

      return unsubscribe
    },
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Error while exposing API:', error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
