export interface WorkspaceConnectionMemberDTO {
  id: string
  name: string
  login: string
  avatarUrl?: string
}

export interface WorkspaceConnectionDTO {
  id: string
  dataSourceId: string
  status: 'connected' | 'disabled' | 'disconnected'
  member?: WorkspaceConnectionMemberDTO
  config?: Record<string, unknown>
}

export function toWorkspaceConnectionDTO(c: {
  id: string
  dataSourceId: string
  status: 'connected' | 'disabled' | 'disconnected'
  member?: {
    id: string
    name: string
    login: string
    avatarUrl?: string
  }
  config?: Record<string, unknown>
}): WorkspaceConnectionDTO {
  return {
    id: c.id,
    dataSourceId: c.dataSourceId,
    status: c.status,
    ...(c.member !== undefined && {
      member: {
        id: c.member.id,
        name: c.member.name,
        login: c.member.login,
        ...(c.member.avatarUrl !== undefined && {
          avatarUrl: c.member.avatarUrl,
        }),
      },
    }),
    ...(c.config !== undefined && {
      config: c.config,
    }),
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
