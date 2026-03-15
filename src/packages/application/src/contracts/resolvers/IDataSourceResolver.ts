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
}
