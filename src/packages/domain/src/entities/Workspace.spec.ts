import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Workspace } from './Workspace'

describe('Workspace Entity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('crypto', {
      randomUUID: () => 'mock-uuid-1234',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Creation', () => {
    it('should create a workspace with correct initial state', () => {
      const now = new Date('2024-06-01T10:00:00Z')
      vi.setSystemTime(now)

      const workspace = Workspace.create('My Metric Workspace')

      expect(workspace.id).toBe('ws-mock-uuid-1234')
      expect(workspace.name).toBe('My Metric Workspace')
      expect(workspace.dataSourceConnections).toEqual([])
      expect(workspace.isLinked()).toBe(false)
      expect(workspace.createdAt).toEqual(now)
      expect(workspace.updatedAt).toEqual(now)
    })
  })

  describe('linkDataSource', () => {
    let workspace: Workspace
    const initialTime = new Date('2024-06-01T10:00:00Z')

    beforeEach(() => {
      vi.setSystemTime(initialTime)
      workspace = Workspace.create('Test WS')
    })

    it('should link a new data source successfully and touch updatedAt', () => {
      const updateTime = new Date('2024-06-01T10:30:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.linkDataSource('conn-1', 'plugin-jira')

      // O sucesso retorna void, então apenas validamos se deu certo
      expect(result.isSuccess()).toBe(true)

      // E validamos o efeito colateral na entidade
      expect(workspace.isLinked()).toBe(true)
      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.dataSourceConnections[0]).toEqual({
        id: 'conn-1',
        dataSourceId: 'plugin-jira',
      })
      expect(workspace.updatedAt).toEqual(updateTime)
    })

    it('should return failure when trying to link the reserved "local" data source', () => {
      const result = workspace.linkDataSource('local', 'plugin-local')

      expect(result.isFailure()).toBe(true)

      // Acessando diretamente o getter failure (type-safe: AppError)
      expect(result.failure.messageKey).toBe(
        'O DataSource "local" é implícito e não pode ser vinculado individualmente.',
      )

      expect(workspace.isLinked()).toBe(false)
    })

    it('should succeed but do nothing (idempotent) if connection already exists', () => {
      workspace.linkDataSource('conn-1', 'plugin-jira')

      const updateTime = new Date('2024-06-01T11:00:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.linkDataSource('conn-1', 'plugin-jira')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.updatedAt).toEqual(updateTime)
    })
  })

  describe('unlinkDataSource', () => {
    let workspace: Workspace
    const initialTime = new Date('2024-06-01T10:00:00Z')

    beforeEach(() => {
      vi.setSystemTime(initialTime)
      workspace = Workspace.create('Test WS')
      workspace.linkDataSource('conn-1', 'plugin-jira')
      workspace.linkDataSource('conn-2', 'plugin-trello')
    })

    it('should unlink a specific data source by id', () => {
      const updateTime = new Date('2024-06-02T10:00:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.unlinkDataSource('conn-1')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.dataSourceConnections[0].id).toBe('conn-2')
      expect(workspace.updatedAt).toEqual(updateTime)
    })

    it('should unlink all data sources if no id is provided', () => {
      const updateTime = new Date('2024-06-02T11:00:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.unlinkDataSource()

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections).toEqual([])
      expect(workspace.isLinked()).toBe(false)
      expect(workspace.updatedAt).toEqual(updateTime)
    })
  })

  describe('connectDataSource & disconnectDataSource', () => {
    let workspace: Workspace
    const initialTime = new Date('2024-06-01T10:00:00Z')

    beforeEach(() => {
      vi.setSystemTime(initialTime)
      workspace = Workspace.create('Test WS')
      workspace.linkDataSource('conn-1', 'plugin-jira')
    })

    it('should connect to an existing data source by injecting config', () => {
      const config = { host: 'jira.atlassian.com', token: '123' }

      const updateTime = new Date('2024-06-03T10:00:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.connectDataSource('conn-1', config)

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections[0].config).toEqual(config)
      expect(workspace.updatedAt).toEqual(updateTime)
    })

    it('should fail to connect if the data source id is not linked', () => {
      const result = workspace.connectDataSource('conn-x', { host: 'x' })

      expect(result.isFailure()).toBe(true)

      // Acessando diretamente o getter failure (type-safe: AppError)
      expect(result.failure.messageKey).toBe(
        'Conexão conn-x não encontrada para este workspace.',
      )
    })

    it('should disconnect (clear config) from a linked data source', () => {
      workspace.connectDataSource('conn-1', { host: 'jira' })
      expect(workspace.dataSourceConnections[0].config).toBeDefined()

      const updateTime = new Date('2024-06-04T10:00:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.disconnectDataSource('conn-1')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections[0].config).toBeUndefined()
      expect(workspace.updatedAt).toEqual(updateTime)
    })

    it('should return success but do nothing if disconnecting a non-existent connection', () => {
      const result = workspace.disconnectDataSource('conn-x')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections).toHaveLength(1)
    })
  })

  describe('updateName', () => {
    it('should update the name and touch updatedAt', () => {
      const initialTime = new Date('2024-06-01T10:00:00Z')
      vi.setSystemTime(initialTime)
      const workspace = Workspace.create('Old Name')

      const updateTime = new Date('2024-06-05T15:00:00Z')
      vi.setSystemTime(updateTime)

      workspace.updateName('New Metric Workspace')

      expect(workspace.name).toBe('New Metric Workspace')
      expect(workspace.createdAt).toEqual(initialTime)
      expect(workspace.updatedAt).toEqual(updateTime)
    })
  })
})
