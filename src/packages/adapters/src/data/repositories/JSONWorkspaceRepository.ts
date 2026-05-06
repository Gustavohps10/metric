import { IWorkspacesRepository } from '@metric-org/application'
import { Workspace } from '@metric-org/domain'
import { promises as fs } from 'fs'
import path from 'path'

type PlainWorkspace = {
  id: string
  name: string
  avatarUrl?: string
  status: 'draft' | 'configured'
  description?: string
  dataSourceConnections: {
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
  }[]
  createdAt: string
  updatedAt: string
}

export class JSONWorkspacesRepository implements IWorkspacesRepository {
  private readonly filePath: string

  constructor(storagePath: string) {
    this.filePath = path.join(storagePath, 'workspaces.json')
  }

  private async _readWorkspaces(): Promise<Workspace[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      const plain: PlainWorkspace[] = JSON.parse(data)

      return plain.map((p) =>
        Workspace.hydrate({
          id: p.id,
          avatarUrl: p.avatarUrl,
          status: p.status,
          description: p.description,
          name: p.name,
          dataSourceConnections: p.dataSourceConnections ?? [],
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }),
      )
    } catch (err) {
      console.log(err)
      return []
    }
  }

  private async _writeWorkspaces(workspaces: Workspace[]): Promise<void> {
    const plain: PlainWorkspace[] = workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      avatarUrl: ws.avatarUrl,
      status: ws.status,
      description: ws.description,
      dataSourceConnections: ws.dataSourceConnections.map((c) => ({
        id: c.id,
        status: c.status,
        dataSourceId: c.dataSourceId,
        config: c.config,
        member: c.member,
      })),
      createdAt: ws.createdAt.toISOString(),
      updatedAt: ws.updatedAt.toISOString(),
    }))

    await fs.writeFile(this.filePath, JSON.stringify(plain, null, 2))
  }

  public async findById(id: string): Promise<Workspace | undefined> {
    const items = await this._readWorkspaces()
    return items.find((ws) => ws.id === id)
  }

  public async create(entity: Workspace): Promise<void> {
    const items = await this._readWorkspaces()
    items.push(entity)
    await this._writeWorkspaces(items)
  }

  public async update(entity: Workspace): Promise<void> {
    const items = await this._readWorkspaces()
    const index = items.findIndex((ws) => ws.id === entity.id)
    if (index !== -1) {
      items[index] = entity
      await this._writeWorkspaces(items)
    }
  }

  public async delete(id: string): Promise<void> {
    const items = await this._readWorkspaces()
    const filtered = items.filter((ws) => ws.id !== id)
    if (filtered.length !== items.length) {
      await this._writeWorkspaces(filtered)
    }
  }
}
