import { IDataSourceResolver, IServiceProvider } from '@metric-org/application'
import { IRequest } from '@metric-org/shared/transport'
import { app } from 'electron'

import { IpcHandler } from '@/main/adapters/IpcHandler'
import {
  SessionHandler,
  TasksHandler,
  TimeEntriesHandler,
  TokenHandler,
} from '@/main/handlers'
import { AddonsHandler } from '@/main/handlers/AddonsHandler'
import { handleDiscordLogin } from '@/main/handlers/discord-handler'
import { MetadataHandler } from '@/main/handlers/MetadataHandler'
import { WorkspacesHandler } from '@/main/handlers/WorkspacesHandler'

export function openIpcRoutes(serviceProvider: IServiceProvider): void {
  const tokenHandler = serviceProvider.resolve<TokenHandler>('tokenHandler')
  const workspacesHandler =
    serviceProvider.resolve<WorkspacesHandler>('workspacesHandler')
  const sessionHandler =
    serviceProvider.resolve<SessionHandler>('sessionHandler')
  const metadataHandler =
    serviceProvider.resolve<MetadataHandler>('metadataHandler')
  const tasksHandler = serviceProvider.resolve<TasksHandler>('tasksHandler')
  const timeEntriesHandler =
    serviceProvider.resolve<TimeEntriesHandler>('timeEntriesHandler')
  const addonsHandler = serviceProvider.resolve<AddonsHandler>('addonsHandler')
  const dataSourceResolver =
    serviceProvider.resolve<IDataSourceResolver>('dataSourceResolver')

  // --- SYSTEM ---
  IpcHandler.register('SYSTEM_VERSION', () => Promise.resolve(app.getVersion()))
  IpcHandler.register('SYSTEM_GET_ENVIRONMENT', () =>
    Promise.resolve({ isDevelopment: !app.isPackaged }),
  )

  // --- AUTH / DISCORD ---
  IpcHandler.register('DISCORD_LOGIN', () => handleDiscordLogin())

  // --- TOKEN STORAGE ---
  IpcHandler.register('SAVE_TOKEN', (e, req) => tokenHandler.saveToken(e, req))
  IpcHandler.register('GET_TOKEN', (e, req) => tokenHandler.getToken(e, req))
  IpcHandler.register('DELETE_TOKEN', (e, req) =>
    tokenHandler.deleteToken(e, req),
  )

  // --- WORKSPACES & CONNECTIONS ---
  IpcHandler.register('WORKSPACES_MARK_AS_CONFIGURED', (e, req) =>
    workspacesHandler.markWorkspaceAsConfigured(e, req),
  )
  IpcHandler.register('WORKSPACES_CREATE', (e, req) =>
    workspacesHandler.create(e, req),
  )
  IpcHandler.register('WORKSPACES_GET_BY_ID', (e, req) =>
    workspacesHandler.getById(e, req),
  )
  IpcHandler.register('WORKSPACES_GET_ALL', () => workspacesHandler.listAll())
  IpcHandler.register('WORKSPACES_LINK_DATASOURCE', (e, req) =>
    workspacesHandler.linkDataSource(e, req),
  )
  IpcHandler.register('WORKSPACES_UNLINK_DATASOURCE', (e, req) =>
    workspacesHandler.unlinkDataSource(e, req),
  )
  IpcHandler.register('WORKSPACES_CONNECT_DATASOURCE', (e, req) =>
    workspacesHandler.connectDataSource(e, req),
  )
  IpcHandler.register('WORKSPACES_DISCONNECT_DATASOURCE', (e, req) =>
    workspacesHandler.disconnectDataSource(e, req),
  )
  IpcHandler.register('WORKSPACES_UPDATE_IDENTITY', (e, req) =>
    workspacesHandler.updateIdentity(e, req),
  )
  IpcHandler.register('WORKSPACES_DELETE', (e, req) =>
    workspacesHandler.delete(e, req),
  )

  // --- SESSION ---
  IpcHandler.register('GET_CURRENT_USER', (e, req) =>
    sessionHandler.getCurrentUser(e, req),
  )

  IpcHandler.register(
    'DATA_SOURCE_GET_FIELDS',
    (_e, req: IRequest<{ pluginId: string }>) => {
      const pluginId = req?.body?.pluginId
      if (!pluginId)
        return Promise.reject(
          new Error('getDataSourceFields requer body.pluginId'),
        )
      return dataSourceResolver.getConfigFields(pluginId)
    },
  )

  // --- SYNC / DATA PULL (Authenticated) ---
  IpcHandler.register('METADATA_PULL', (e, req) => metadataHandler.pull(e, req))
  IpcHandler.register('TASKS_PULL', (e, req) => tasksHandler.pull(e, req))
  IpcHandler.register('TASKS_LIST', (e, req) => tasksHandler.listTasks(e, req))
  IpcHandler.register('LIST_TIME_ENTRIES', (e, req) =>
    timeEntriesHandler.listTimeEntries(e, req),
  )
  IpcHandler.register(
    'TIME_ENTRIES_PULL',

    (e, req) => timeEntriesHandler.pull(e, req),
  )
  IpcHandler.register(
    'TIME_ENTRIES_PUSH',

    (e, req) => timeEntriesHandler.push(e, req),
  )

  // --- ADDONS / MARKETPLACE ---
  IpcHandler.register('ADDONS_LIST_AVAILABLE', () =>
    addonsHandler.listAvailable(),
  )
  IpcHandler.register('ADDONS_LIST_INSTALLED', () =>
    addonsHandler.listInstalled(),
  )
  IpcHandler.register('ADDONS_GETINSTALLED_BY_ID', (e, req) =>
    addonsHandler.getInstalledById(e, req),
  )
  IpcHandler.register('ADDONS_UPDATE_LOCAL', (e, req) =>
    addonsHandler.updateLocal(e, req),
  )
  IpcHandler.register('ADDONS_IMPORT', (e, req) => addonsHandler.import(e, req))
  IpcHandler.register('ADDONS_GET_INSTALLER', (e, req) =>
    addonsHandler.getInstaller(e, req),
  )
  IpcHandler.register('ADDONS_INSTALL', (e, req) =>
    addonsHandler.install(e, req),
  )
}
