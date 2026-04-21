export type WorkspaceStatus = 'draft' | 'configured'

export interface WorkspaceConnectionViewModel {
  id: string
  dataSourceId: string
  config?: Record<string, unknown>
}

export interface WorkspaceViewModel {
  id: string
  name: string
  status: WorkspaceStatus
  description?: string
  avatarUrl?: string
  dataSourceConnections: WorkspaceConnectionViewModel[]
  createdAt: Date
  updatedAt: Date
}
