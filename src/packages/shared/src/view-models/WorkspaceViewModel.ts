export type WorkspaceStatus = 'draft' | 'configured'

export interface WorkspaceConnectionMemberViewModel {
  id: string
  name: string
  login: string
  avatarUrl?: string
}

export interface WorkspaceConnectionViewModel {
  id: string
  dataSourceId: string
  status: 'connected' | 'disabled' | 'disconnected'
  member?: WorkspaceConnectionMemberViewModel
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
