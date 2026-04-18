import {
  AppError,
  Either,
  ValidationError,
} from '@metric-org/cross-cutting/helpers'

import { Entity } from '@/entities/Entity'

export interface DataSourceConnection {
  id: string
  dataSourceId: string
  config?: Record<string, unknown>
}

export class Workspace extends Entity {
  private _id: string
  private _name: string
  private _dataSourceConnections: DataSourceConnection[]
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: string,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    connections: DataSourceConnection[] = [],
  ) {
    super()
    this._id = id
    this._name = name
    this._createdAt = createdAt
    this._updatedAt = updatedAt
    this._dataSourceConnections = connections
  }

  static create(name: string): Workspace {
    const now = new Date()
    return new Workspace(`ws-${crypto.randomUUID()}`, name, now, now, [])
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get dataSourceConnections(): DataSourceConnection[] {
    return this._dataSourceConnections
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  isLinked(): boolean {
    return this._dataSourceConnections.length > 0
  }

  linkDataSource(id: string, dataSourceId: string): Either<AppError, void> {
    if (id === 'local') {
      return Either.failure(
        ValidationError.danger(
          'O DataSource "local" é implícito e não pode ser vinculado individualmente.',
        ),
      )
    }

    const exists = this._dataSourceConnections.some((c) => c.id === id)

    if (exists) {
      this.touch()
      return Either.success()
    }

    this._dataSourceConnections.push({
      id,
      dataSourceId,
    })

    this.touch()
    return Either.success()
  }

  unlinkDataSource(id?: string): Either<AppError, void> {
    if (id) {
      this._dataSourceConnections = this._dataSourceConnections.filter(
        (c) => c.id !== id,
      )
    } else {
      this._dataSourceConnections = []
    }

    this.touch()
    return Either.success()
  }

  connectDataSource(
    id: string,
    config: Record<string, unknown>,
  ): Either<AppError, void> {
    const connection = this._dataSourceConnections.find((c) => c.id === id)

    if (!connection) {
      return Either.failure(
        ValidationError.danger(
          `Conexão ${id} não encontrada para este workspace.`,
        ),
      )
    }

    connection.config = config
    this.touch()
    return Either.success()
  }

  disconnectDataSource(id: string): Either<AppError, void> {
    const connection = this._dataSourceConnections.find((c) => c.id === id)

    if (connection) {
      connection.config = undefined
      this.touch()
    }

    return Either.success()
  }

  updateName(newName: string): void {
    this._name = newName
    this.touch()
  }

  private touch(): void {
    this._updatedAt = new Date()
  }
}
