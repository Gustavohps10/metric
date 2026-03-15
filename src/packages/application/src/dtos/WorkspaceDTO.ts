export interface WorkspaceConnectionDTO {
  id: string
  config?: Record<string, unknown>
}

export interface WorkspaceDTO {
  id: string
  name: string
  dataSource: string
  dataSourceConfiguration?: Record<string, unknown>
  dataSourceConnections?: WorkspaceConnectionDTO[]
  createdAt: Date
  updatedAt: Date
}
