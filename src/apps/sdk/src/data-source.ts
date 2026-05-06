import type {
  IAuthenticationStrategy,
  IMemberQuery,
  IMetadataQuery,
  ITaskQuery,
  ITaskRepository,
  ITimeEntryQuery,
  ITimeEntryRepository,
} from '@metric-org/application'

export interface ConfigField {
  id: string
  label: string
  type: 'text' | 'password' | 'url'
  required: boolean
  placeholder?: string
}

export interface FieldGroup {
  id: string
  label: string
  description?: string
  fields: ConfigField[]
}

export interface DataSourceContext {
  credentials?: Record<string, unknown>
  config?: Record<string, unknown>
}

export interface IDataSource {
  readonly id: string
  readonly dataSourceType: string
  readonly displayName: string
  readonly configFields: {
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }

  getAuthenticationStrategy(context: DataSourceContext): IAuthenticationStrategy
  getTaskQuery(context: DataSourceContext): ITaskQuery
  getTimeEntryQuery(context: DataSourceContext): ITimeEntryQuery
  getTimeEntryRepository(context: DataSourceContext): ITimeEntryRepository
  getMemberQuery(context: DataSourceContext): IMemberQuery
  getTaskRepository(context: DataSourceContext): ITaskRepository
  getMetadataQuery(context: DataSourceContext): IMetadataQuery
}

/** @deprecated Use DataSourceContext and IDataSource instead */
export type Context = DataSourceContext

/** @deprecated Use IDataSource instead */
export type IConnector = IDataSource
