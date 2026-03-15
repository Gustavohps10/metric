export interface WorkspaceConnectionViewModel {
  id: string
  config?: Record<string, unknown>
}

export interface WorkspaceViewModel {
  id: string
  name: string
  dataSource: string
  dataSourceConfiguration?: Record<string, unknown>
  dataSourceConnections?: WorkspaceConnectionViewModel[]
  createdAt: Date
  updatedAt: Date
}
