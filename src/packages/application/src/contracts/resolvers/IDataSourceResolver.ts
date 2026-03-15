import type { FieldGroup } from '@/contracts/api/IApplicationAPI'

import { IDataSourceAdapter } from './IDataSourceAdapter'

export interface DataSourceContext {
  config?: Record<string, unknown>
  credentials?: Record<string, unknown>
}

export interface IDataSourceResolver {
  getDataSource(
    workspaceId: string,
    dataSourceId: string,
    contextOverride?: DataSourceContext,
  ): Promise<IDataSourceAdapter>

  getDataSourcesForWorkspace(workspaceId: string): Promise<{ id: string }[]>

  getConfigFields(dataSourceId: string): Promise<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }>
}
