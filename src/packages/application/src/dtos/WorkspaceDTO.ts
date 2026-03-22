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

export interface WorkspaceDTO {
  id: string
  name: string
  dataSourceConnections: WorkspaceConnectionDTO[]
  createdAt: Date
  updatedAt: Date
}
