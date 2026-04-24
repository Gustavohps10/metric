import { IApplicationAPI } from '@metric-org/application'

const ipcClient: IApplicationAPI = {
  services: window.api.services,
  modules: window.api.modules,
  integrations: window.api.integrations,
  events: window.api.events,
}

export { ipcClient }
