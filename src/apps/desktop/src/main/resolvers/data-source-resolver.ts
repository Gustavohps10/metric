import {
  DataSourceContext,
  FieldGroup,
  ICredentialsStorage,
  IDataSourceAdapter,
  IDataSourceResolver,
  IWorkspacesRepository,
  ResolvedConnection,
} from '@metric-org/application'
import DataSourceFake from '@metric-org/datasource-fake'
import Redmine4Test from '@metric-org/redmine-for-tests'
import { AppError, Either, type IDataSource } from '@metric-org/sdk'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

export const FAKE_DATASOURCE_ADDON_ID = 'metric-datasource-fake'
export const REDMINE4TEST_ADDON_ID = '@timelapse/redmine-plugin'

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
        authenticatedMemberData: contextOverride.authenticatedMemberData,
        config: contextOverride.config ?? config,
        credentials: contextOverride.credentials,
      }
    } else {
      const storageKey = `workspace-connection-${workspaceId}-${connectionInstanceId}`
      const credentialsSerialized = await this.credentialsStorage.getToken(
        'metric',
        storageKey,
      )

      const parsed = credentialsSerialized
        ? JSON.parse(credentialsSerialized)
        : undefined

      context = {
        authenticatedMemberData: parsed?.member,
        config,
        credentials: parsed?.credentials,
      }
    }

    if (!connection) throw new Error(`Conexao invalida`)

    const datasource = await this.loadModule(connection.dataSourceId)

    return {
      getAuthenticatedMemberData: () => {
        if (!context.authenticatedMemberData)
          return Either.failure(
            AppError.ValidationError(
              'NAO FOI POSSIVEL OBTER DADOS DO USUARIO AUTENTICADO',
            ),
          )

        return Either.success(context.authenticatedMemberData)
      },
      id: connectionInstanceId,
      authenticationStrategy: datasource.getAuthenticationStrategy(context),
      memberQuery: datasource.getMemberQuery(context),
      taskQuery: datasource.getTaskQuery(context),
      taskRepository: datasource.getTaskRepository(context),
      timeEntryQuery: datasource.getTimeEntryQuery(context),
      timeEntryRepository: datasource.getTimeEntryRepository(context),
      metadataQuery: datasource.getMetadataQuery(context),
    }
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
    return mod.configFields
  }

  private async loadModule(pluginId: string): Promise<IDataSource> {
    if (this.options.isDevelopment && pluginId === FAKE_DATASOURCE_ADDON_ID) {
      return DataSourceFake as IDataSource
    }

    if (this.options.isDevelopment && pluginId === REDMINE4TEST_ADDON_ID) {
      return Redmine4Test as IDataSource
    }

    const addonPath = resolve(this.options.addonsBasePath, pluginId, 'index.js')

    if (!existsSync(addonPath)) {
      throw new Error(`Datasource não encontrado: ${pluginId}.`)
    }

    const addonURL = pathToFileURL(addonPath).href
    const datasourceModule = await import(addonURL)
    const defaultExport = datasourceModule?.default

    if (!defaultExport || typeof defaultExport.getTaskQuery !== 'function') {
      throw new Error(`Datasource inválido ou corrompido em ${addonPath}`)
    }

    return defaultExport as IDataSource
  }
}
