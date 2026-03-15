import Redmine4Test from '@timelapse/addon-for-tests'
import {
  DataSourceContext,
  ICredentialsStorage,
  IDataSourceAdapter,
  IDataSourceResolver,
  IWorkspacesRepository,
} from '@timelapse/application'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

/** Minimal shape expected from a datasource module default export (IDataSource from SDK) */
interface DataSourceModule {
  getAuthenticationStrategy: (
    ctx: DataSourceContext,
  ) => IDataSourceAdapter['authenticationStrategy']
  getMemberQuery: (ctx: DataSourceContext) => IDataSourceAdapter['memberQuery']
  getTaskQuery: (ctx: DataSourceContext) => IDataSourceAdapter['taskQuery']
  getTaskRepository: (
    ctx: DataSourceContext,
  ) => IDataSourceAdapter['taskRepository']
  getTimeEntryQuery: (
    ctx: DataSourceContext,
  ) => IDataSourceAdapter['timeEntryQuery']
  getTimeEntryRepository: (
    ctx: DataSourceContext,
  ) => IDataSourceAdapter['timeEntryRepository']
  getMetadataQuery: (
    ctx: DataSourceContext,
  ) => IDataSourceAdapter['metadataQuery']
}
export interface DataSourceResolverOptions {
  addonsBasePath: string
}

export class DataSourceResolver implements IDataSourceResolver {
  constructor(
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly credentialsStorage: ICredentialsStorage,
    private readonly options: DataSourceResolverOptions,
  ) {}

  async getDataSource(
    workspaceId: string,
    dataSourceId: string,
    contextOverride?: DataSourceContext,
  ): Promise<IDataSourceAdapter> {
    const workspace = await this.workspacesRepository.findById(workspaceId)
    if (!workspace) {
      throw new Error(`Workspace não encontrado: ${workspaceId}`)
    }

    const connection = workspace.dataSourceConnections?.find(
      (c) => c.id === dataSourceId,
    )
    const config =
      connection?.config ?? workspace.dataSourceConfiguration ?? undefined
    let context: {
      config?: Record<string, unknown>
      credentials?: Record<string, unknown>
    }

    if (contextOverride) {
      context = {
        config: contextOverride.config ?? config,
        credentials: contextOverride.credentials ?? undefined,
      }
    } else {
      const credentialsSerialized = await this.credentialsStorage.getToken(
        'timelapse',
        `workspace-session-${workspaceId}-${dataSourceId}`,
      )
      const fallbackKey = `workspace-session-${workspaceId}`
      const fallbackSerialized = credentialsSerialized
        ? null
        : await this.credentialsStorage.getToken('timelapse', fallbackKey)
      const credentials = credentialsSerialized
        ? JSON.parse(credentialsSerialized)
        : fallbackSerialized
          ? JSON.parse(fallbackSerialized)
          : undefined
      context = {
        config,
        credentials,
      }
    }

    const addonPath = resolve(
      this.options.addonsBasePath,
      dataSourceId,
      'index.js',
    )
    const useTestPlugin = !existsSync(addonPath)

    let datasource: DataSourceModule
    if (useTestPlugin) {
      datasource = Redmine4Test as DataSourceModule
    } else {
      const addonURL = pathToFileURL(addonPath).href
      const datasourceModule = await import(addonURL)
      const defaultExport = datasourceModule?.default
      if (!defaultExport || typeof defaultExport.getTaskQuery !== 'function') {
        throw new Error(
          `Datasource inválido em ${addonPath}: default export não implementa IDataSource`,
        )
      }
      datasource = defaultExport as DataSourceModule
    }

    const adapter: IDataSourceAdapter = {
      id: dataSourceId,
      authenticationStrategy: datasource.getAuthenticationStrategy(context),
      memberQuery: datasource.getMemberQuery(context),
      taskQuery: datasource.getTaskQuery(context),
      taskRepository: datasource.getTaskRepository(context),
      timeEntryQuery: datasource.getTimeEntryQuery(context),
      timeEntryRepository: datasource.getTimeEntryRepository(context),
      metadataQuery: datasource.getMetadataQuery(context),
    }

    return adapter
  }

  async getDataSourcesForWorkspace(
    workspaceId: string,
  ): Promise<{ id: string }[]> {
    const workspace = await this.workspacesRepository.findById(workspaceId)
    if (!workspace) return []
    const connections = workspace.dataSourceConnections
    if (!connections?.length) return []
    return connections.map((c) => ({ id: c.id }))
  }
}
