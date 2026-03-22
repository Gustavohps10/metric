export interface WorkspaceConnectionViewModel {
  id: string
  dataSourceId: string
  config?: Record<string, unknown>
}

export interface WorkspaceViewModel {
  id: string
  name: string
  dataSourceConnections: WorkspaceConnectionViewModel[]
  createdAt: Date
  updatedAt: Date
}
