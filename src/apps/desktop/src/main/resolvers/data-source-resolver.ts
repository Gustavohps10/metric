import type { FieldGroup } from '@metric-org/application'
import {
  DataSourceContext,
  ICredentialsStorage,
  IDataSourceAdapter,
  IDataSourceResolver,
  IWorkspacesRepository,
  ResolvedConnection,
} from '@metric-org/application'
import DataSourceFake from '@metric-org/datasource-fake'
import Redmine4Test from '@metric-org/redmine-for-tests'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

export const FAKE_DATASOURCE_ADDON_ID = 'metric-datasource-fake'
export const REDMINE4TEST_ADDON_ID = '@timelapse/redmine-plugin'

interface DataSourceModule {
  configFields: {
    credentials: { id: string; label: string; fields: unknown[] }[]
    configuration: { id: string; label: string; fields: unknown[] }[]
  }
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
  isDevelopment?: boolean
}

export class DataSourceResolver implements IDataSourceResolver {
  constructor(
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly credentialsStorage: ICredentialsStorage,
    private readonly options: DataSourceResolverOptions,
  ) {}

  async getDataSource(
    workspaceId: string,
    pluginId: string,
    connectionInstanceId: string,
    contextOverride?: DataSourceContext,
  ): Promise<IDataSourceAdapter> {
    const workspace = await this.workspacesRepository.findById(workspaceId)
    if (!workspace) {
      throw new Error(`Workspace não encontrado: ${workspaceId}`)
    }

    const connection = workspace.dataSourceConnections?.find(
      (c) => c.id === connectionInstanceId,
    )

    const config = connection?.config ?? {}
    let context: DataSourceContext

    if (contextOverride) {
      context = {
        config: contextOverride.config ?? config,
        credentials: contextOverride.credentials,
      }
    } else {
      const storageKey = `workspace-session-${workspaceId}-${connectionInstanceId}`
      const credentialsSerialized = await this.credentialsStorage.getToken(
        'metric',
        storageKey,
      )

      const credentials = credentialsSerialized
        ? JSON.parse(credentialsSerialized)
        : undefined

      context = {
        config,
        credentials,
      }
    }

    const datasource = await this.loadModule(pluginId)

    const adapter: IDataSourceAdapter = {
      id: connectionInstanceId,
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
  ): Promise<ResolvedConnection[]> {
    const workspace = await this.workspacesRepository.findById(workspaceId)
    if (!workspace) return []

    return workspace.dataSourceConnections.map((c) => ({
      id: c.id,
      dataSourceId: c.dataSourceId,
      config: c.config,
    }))
  }

  async getConfigFields(pluginId: string): Promise<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }> {
    const mod = await this.loadModule(pluginId)
    return mod.configFields as {
      credentials: FieldGroup[]
      configuration: FieldGroup[]
    }
  }

  private async loadModule(pluginId: string): Promise<DataSourceModule> {
    const isDev = this.options.isDevelopment === true

    if (isDev && pluginId === FAKE_DATASOURCE_ADDON_ID) {
      return DataSourceFake as DataSourceModule
    }

    if (isDev && pluginId === REDMINE4TEST_ADDON_ID) {
      return Redmine4Test as DataSourceModule
    }

    const addonPath = resolve(this.options.addonsBasePath, pluginId, 'index.js')

    if (!existsSync(addonPath)) {
      throw new Error(`Datasource não encontrado: ${pluginId}.`)
    }

    const addonURL = pathToFileURL(addonPath).href
    const datasourceModule = await import(addonURL)
    const defaultExport = datasourceModule?.default

    if (!defaultExport || typeof defaultExport.getTaskQuery !== 'function') {
      throw new Error(`Datasource inválido em ${addonPath}`)
    }

    return defaultExport as DataSourceModule
  }
}
