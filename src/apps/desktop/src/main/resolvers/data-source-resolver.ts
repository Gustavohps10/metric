import type { FieldGroup } from '@timelapse/application'
import {
  DataSourceContext,
  ICredentialsStorage,
  IDataSourceAdapter,
  IDataSourceResolver,
  IWorkspacesRepository,
} from '@timelapse/application'
import DataSourceFake from '@timelapse/datasource-fake'
import Redmine4Test from '@timelapse/redmine-for-tests'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

export const FAKE_DATASOURCE_ADDON_ID = 'timelapse-datasource-fake'
export const REDMINE4TEST_ADDON_ID = '@timelapse/redmine-plugin'

/** Minimal shape expected from a datasource module default export (IDataSource from SDK) */
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
  /** When true, resolver loads Fake e Redmine4Test por id; addons em disco não são usados. */
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
      const credentials = credentialsSerialized
        ? JSON.parse(credentialsSerialized)
        : undefined
      context = {
        config,
        credentials,
      }
    }

    const datasource = await this.loadModule(dataSourceId)

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

  async getConfigFields(dataSourceId: string): Promise<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }> {
    const mod = await this.loadModule(dataSourceId)
    return mod.configFields as {
      credentials: FieldGroup[]
      configuration: FieldGroup[]
    }
  }

  private async loadModule(dataSourceId: string): Promise<DataSourceModule> {
    const isDev = this.options.isDevelopment === true

    if (isDev && dataSourceId === FAKE_DATASOURCE_ADDON_ID) {
      return DataSourceFake as DataSourceModule
    }

    if (isDev && dataSourceId === REDMINE4TEST_ADDON_ID) {
      return Redmine4Test as DataSourceModule
    }

    const addonPath = resolve(
      this.options.addonsBasePath,
      dataSourceId,
      'index.js',
    )
    if (!existsSync(addonPath)) {
      throw new Error(
        `Datasource não encontrado: ${dataSourceId}. Em desenvolvimento use "${FAKE_DATASOURCE_ADDON_ID}" ou "${REDMINE4TEST_ADDON_ID}".`,
      )
    }
    const addonURL = pathToFileURL(addonPath).href
    const datasourceModule = await import(addonURL)
    const defaultExport = datasourceModule?.default
    if (!defaultExport || typeof defaultExport.getTaskQuery !== 'function') {
      throw new Error(
        `Datasource inválido em ${addonPath}: default export não implementa IDataSource`,
      )
    }
    return defaultExport as DataSourceModule
  }
}
