import type { FieldGroup } from '@/contracts/api/IApplicationAPI'

import { IDataSourceAdapter } from './IDataSourceAdapter'

export interface DataSourceContext {
  config?: Record<string, unknown>
  credentials?: Record<string, unknown>
}

export interface ResolvedConnection {
  id: string
  dataSourceId: string
  config?: Record<string, unknown>
}

export interface IDataSourceResolver {
  getDataSource(
    workspaceId: string,
    pluginId: string,
    connectionInstanceId: string,
    contextOverride?: DataSourceContext,
  ): Promise<IDataSourceAdapter>

  getDataSourcesForWorkspace(workspaceId: string): Promise<ResolvedConnection[]>

  getConfigFields(pluginId: string): Promise<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }>
}
