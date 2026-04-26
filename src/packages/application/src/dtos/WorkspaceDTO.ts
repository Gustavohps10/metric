export interface WorkspaceConnectionDTO {
  id: string
  dataSourceId: string
  config?: Record<string, unknown>
}

export function toWorkspaceConnectionDTO(c: {
  id: string
  dataSourceId: string
  config?: Record<string, unknown>
}): WorkspaceConnectionDTO {
  return {
    id: c.id,
    dataSourceId: c.dataSourceId,
    ...(c.config !== undefined && { config: c.config }),
  }
}

export type WorkspaceStatus = 'draft' | 'configured'

export interface WorkspaceDTO {
  id: string
  name: string
  status: WorkspaceStatus
  description?: string
  avatarUrl?: string
  dataSourceConnections: WorkspaceConnectionDTO[]
  createdAt: Date
  updatedAt: Date
}
