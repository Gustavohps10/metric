import { IWorkspacesRepository } from '@timelapse/application'
import { Workspace } from '@timelapse/domain'
import { promises as fs } from 'fs'
import path from 'path'

type PlainWorkspace = {
  id: string
  name: string
  dataSource: string
  dataSourceConfiguration?: Record<string, unknown>
  dataSourceConnections?: { id: string; config?: Record<string, unknown> }[]
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

      const entities = plain.map((p): Workspace => {
        return Workspace.hydrate({
          id: p.id,
          name: p.name,
          dataSource: p.dataSource,
          dataSourceConfiguration: p.dataSourceConfiguration,
          dataSourceConnections: p.dataSourceConnections ?? [],
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })
      })
      return entities
    } catch {
      return []
    }
  }

  private async _writeWorkspaces(workspaces: Workspace[]): Promise<void> {
    const plain: PlainWorkspace[] = workspaces.map((ws) => {
      const connections = ws.dataSourceConnections
      return {
        id: ws.id,
        name: ws.name,
        dataSource: ws.dataSource,
        dataSourceConfiguration: ws.dataSourceConfiguration,
        dataSourceConnections:
          connections?.length > 0
            ? connections.map((c) => ({ id: c.id, config: c.config }))
            : undefined,
        createdAt: ws.createdAt.toISOString(),
        updatedAt: ws.updatedAt.toISOString(),
      }
    })

    await fs.writeFile(this.filePath, JSON.stringify(plain, null, 2))
  }

  public async findById(id: string): Promise<Workspace | undefined> {
    const items = await this._readWorkspaces()
    return items.find((ws) => ws.id === id)
  }

  public async create(entity: Workspace): Promise<void> {
    const items = await this._readWorkspaces()
    console.log(this.filePath)
    items.push(entity)
    await this._writeWorkspaces(items)
  }

  public async update(entity: Workspace): Promise<void> {
    const items = await this._readWorkspaces()
    const index = items.findIndex((ws) => ws.id === entity.id)
    items[index] = entity
    await this._writeWorkspaces(items)
  }

  public async delete(id: string): Promise<void> {
    const items = await this._readWorkspaces()
    const filtered = items.filter((ws) => ws.id !== id)
    if (filtered.length !== items.length) {
      await this._writeWorkspaces(filtered)
    }
  }
}
