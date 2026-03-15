import {
  AppError,
  Either,
  ValidationError,
} from '@timelapse/cross-cutting/helpers'
import { randomUUID } from 'crypto'

import { Entity } from '@/entities/Entity'

export type DataSource = 'local' | string

export interface DataSourceConnection {
  id: string
  config?: Record<string, unknown>
}

export class Workspace extends Entity {
  private _id: string
  private _name: string
  private _dataSource: DataSource
  private _dataSourceConfiguration?: Record<string, unknown>
  /** N datasources per workspace (ADR-002). When non-empty, this list is the source of truth. */
  private _dataSourceConnections: DataSourceConnection[]
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: string,
    name: string,
    updatedAt: Date,
    createdAt: Date,
  ) {
    super()
    this._id = id
    this._name = name
    this._createdAt = createdAt
    this._updatedAt = updatedAt
    this._dataSource = 'local'
    this._dataSourceConnections = []
  }

  static create(name: string): Workspace {
    const now = new Date()
    return new Workspace(`ws-${randomUUID()}`, name, now, now)
  }

  get id(): string {
    return this._id
  }
  private set id(value: string) {
    this._id = value
  }

  get name(): string {
    return this._name
  }
  private set name(value: string) {
    this._name = value
  }

  get dataSource(): DataSource {
    return this._dataSource
  }
  private set dataSource(value: DataSource) {
    this._dataSource = value
  }

  get dataSourceConfiguration(): Record<string, unknown> | undefined {
    return this._dataSourceConfiguration
  }
  private set dataSourceConfiguration(
    value: Record<string, unknown> | undefined,
  ) {
    this._dataSourceConfiguration = value
  }

  /** Connections for N datasources (ADR-002). Legacy single dataSource is mirrored when connections empty. */
  get dataSourceConnections(): DataSourceConnection[] {
    if (this._dataSourceConnections && this._dataSourceConnections.length > 0) {
      return this._dataSourceConnections
    }
    if (this._dataSource !== 'local') {
      return [
        {
          id: this._dataSource,
          config: this._dataSourceConfiguration,
        },
      ]
    }
    return []
  }
  private set dataSourceConnections(value: DataSourceConnection[]) {
    this._dataSourceConnections = value ?? []
  }

  get createdAt(): Date {
    return this._createdAt
  }
  private set createdAt(value: Date) {
    this._createdAt = value
  }

  get updatedAt(): Date {
    return this._updatedAt
  }
  private set updatedAt(value: Date) {
    this._updatedAt = value
  }

  isLinked(): boolean {
    return this._dataSource !== 'local'
  }

  isConfigured(): boolean {
    return this._dataSourceConfiguration !== undefined
  }

  isConnected(): boolean {
    return this.isLinked() && this.isConfigured()
  }

  linkDataSource(dataSource: string): Either<AppError, void> {
    if (dataSource === 'local') {
      return Either.failure(
        ValidationError.danger('Não é possível vincular o DataSource local'),
      )
    }

    if (!this._dataSourceConnections) this._dataSourceConnections = []
    if (this._dataSourceConnections.some((c) => c.id === dataSource)) {
      this.touch()
      return Either.success(undefined)
    }
    this._dataSourceConnections = [
      ...this._dataSourceConnections,
      { id: dataSource },
    ]
    this._dataSource = this._dataSourceConnections[0]?.id ?? dataSource
    this.touch()
    return Either.success(undefined)
  }

  unlinkDataSource(dataSourceId?: string): Either<AppError, void> {
    if (!this._dataSourceConnections?.length) {
      this._dataSource = 'local'
      this._dataSourceConfiguration = undefined
      this._dataSourceConnections = []
      this.touch()
      return Either.success(undefined)
    }
    if (dataSourceId) {
      this._dataSourceConnections = this._dataSourceConnections.filter(
        (c) => c.id !== dataSourceId,
      )
      if (this._dataSourceConnections.length === 0) {
        this._dataSource = 'local'
        this._dataSourceConfiguration = undefined
      } else if (this._dataSource === dataSourceId) {
        this._dataSource = this._dataSourceConnections[0].id
        this._dataSourceConfiguration = this._dataSourceConnections[0].config
      }
    } else {
      this._dataSource = 'local'
      this._dataSourceConfiguration = undefined
      this._dataSourceConnections = []
    }
    this.touch()
    return Either.success(undefined)
  }

  connectDataSource(
    config: Record<string, unknown>,
    dataSourceId?: string,
  ): Either<AppError, void> {
    const targetId = dataSourceId ?? this._dataSource
    if (targetId === 'local') {
      return Either.failure(
        ValidationError.danger('Não é possível conectar o DataSource local'),
      )
    }

    if (this._dataSourceConnections?.length) {
      const idx = this._dataSourceConnections.findIndex(
        (c) => c.id === targetId,
      )
      if (idx >= 0) {
        this._dataSourceConnections = [...this._dataSourceConnections]
        this._dataSourceConnections[idx] = {
          ...this._dataSourceConnections[idx],
          config,
        }
      } else {
        this._dataSourceConnections = [
          ...this._dataSourceConnections,
          { id: targetId, config },
        ]
      }
    } else {
      this._dataSourceConfiguration = config
      this._dataSource = targetId
    }
    this.touch()
    return Either.success(undefined)
  }

  disconnectDataSource(dataSourceId?: string): Either<AppError, void> {
    if (this._dataSourceConnections?.length && dataSourceId) {
      const idx = this._dataSourceConnections.findIndex(
        (c) => c.id === dataSourceId,
      )
      if (idx >= 0) {
        this._dataSourceConnections = [...this._dataSourceConnections]
        this._dataSourceConnections[idx] = {
          id: this._dataSourceConnections[idx].id,
          config: undefined,
        }
      }
    } else {
      this._dataSourceConfiguration = undefined
    }
    this.touch()
    return Either.success(undefined)
  }

  updateName(newName: string) {
    this._name = newName
    this.touch()
  }

  private touch() {
    this._updatedAt = new Date()
  }
}
