import {
  IQueryBase,
  PagedResultDTO,
  PaginationOptionsDTO,
  WorkspaceDTO,
} from '@metric-org/application'
import { promises as fs } from 'fs'
import path from 'path'

type PlainWorkspace = {
  id: string
  name: string
  dataSourceConnections: {
    id: string
    dataSourceId: string
    config?: Record<string, unknown>
  }[]
  createdAt: string
  updatedAt: string
}

export class JSONWorkspacesQuery implements IQueryBase<WorkspaceDTO> {
  private readonly filePath: string

  constructor(storagePath: string) {
    this.filePath = path.join(storagePath, 'workspaces.json')
  }

  private async _readWorkspaces(): Promise<WorkspaceDTO[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      const plain: PlainWorkspace[] = JSON.parse(data)

      return plain.map((p) => ({
        id: p.id,
        name: p.name,
        dataSourceConnections: (p.dataSourceConnections ?? []).map((c) => ({
          id: c.id,
          dataSourceId: c.dataSourceId,
          config: c.config,
        })),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }))
    } catch {
      return []
    }
  }

  async findAll(
    pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<WorkspaceDTO>> {
    const all = await this._readWorkspaces()
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 10
    const start = (page - 1) * pageSize
    const items = all.slice(start, start + pageSize)

    return { items, total: all.length, page, pageSize }
  }

  async findById(id: string): Promise<WorkspaceDTO | undefined> {
    const all = await this._readWorkspaces()
    return all.find((ws) => ws.id === id)
  }

  async findByIds(ids: string[]): Promise<WorkspaceDTO[]> {
    const all = await this._readWorkspaces()
    return all.filter((ws) => ids.includes(ws.id))
  }

  async findByCondition(
    condition: Partial<WorkspaceDTO>,
    pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<WorkspaceDTO>> {
    const all = await this._readWorkspaces()
    const filtered = all.filter((ws) =>
      (Object.keys(condition) as Array<keyof WorkspaceDTO>).every(
        (key) => JSON.stringify(ws[key]) === JSON.stringify(condition[key]),
      ),
    )

    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 10
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    return { items, total: filtered.length, page, pageSize }
  }

  async count(criteria?: Partial<WorkspaceDTO>): Promise<number> {
    const all = await this._readWorkspaces()
    if (!criteria) return all.length
    return all.filter((ws) =>
      (Object.keys(criteria) as Array<keyof WorkspaceDTO>).every(
        (key) => JSON.stringify(ws[key]) === JSON.stringify(criteria[key]),
      ),
    ).length
  }

  async exists(criteria: Partial<WorkspaceDTO>): Promise<boolean> {
    const all = await this._readWorkspaces()
    return all.some((ws) =>
      (Object.keys(criteria) as Array<keyof WorkspaceDTO>).every(
        (key) => JSON.stringify(ws[key]) === JSON.stringify(criteria[key]),
      ),
    )
  }
}
