import type { FieldGroup } from '@/contracts/api/IApplicationAPI'
import { MemberDTO } from '@/dtos'

import { IDataSourceAdapter } from './IDataSourceAdapter'

export interface DataSourceContext {
  authenticatedMemberData?: MemberDTO
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
    contextOverride?: DataSourceContext,
  ): Promise<IDataSourceAdapter>

  getDataSourcesForWorkspace(workspaceId: string): Promise<ResolvedConnection[]>

  getConfigFields(pluginId: string): Promise<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }>
}
