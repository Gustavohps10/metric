import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Workspace } from './Workspace'

describe('Workspace Entity', () => {
  const LOCAL_AVATAR_URL =
    'metric-app://C:\\Users\\Gustavo\\AppData\\Roaming\\metric\\workspaces\\avatars\\ws-9ef4bd92-e595-478f-b150-976d5c38372a.png'

  const BLOB_URL = 'blob:http://localhost:3000/mock-uuid'

  const MEMBER = {
    id: 'member-1',
    name: 'Gustavo',
    login: 'gustavo',
    avatarUrl: 'https://avatar.com/user.png',
  }

  beforeEach(() => {
    vi.useFakeTimers()

    vi.stubGlobal('crypto', {
      randomUUID: () => 'mock-uuid-1234',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('Creation', () => {
    it('should create a workspace with correct initial state', () => {
      const now = new Date('2024-06-01T10:00:00Z')
      vi.setSystemTime(now)

      const result = Workspace.create({
        name: 'My Metric Workspace',
        description: 'desc',
        avatarUrl: 'https://avatar.com/img.png',
      })

      expect(result.isSuccess()).toBe(true)

      const workspace = result.success

      expect(workspace.id).toBe('ws-mock-uuid-1234')
      expect(workspace.name).toBe('My Metric Workspace')
      expect(workspace.description).toBe('desc')
      expect(workspace.avatarUrl).toBe('https://avatar.com/img.png')
      expect(workspace.status).toBe('draft')
      expect(workspace.createdAt).toEqual(now)
      expect(workspace.updatedAt).toEqual(now)
      expect(workspace.dataSourceConnections).toEqual([])
    })

    it('should trim incoming values on creation', () => {
      const result = Workspace.create({
        name: '   My Workspace   ',
        description: '   desc   ',
        avatarUrl: 'https://avatar.com/img.png',
      })

      expect(result.isSuccess()).toBe(true)

      const workspace = result.success

      expect(workspace.name).toBe('My Workspace')
      expect(workspace.description).toBe('desc')
    })

    it('should allow creation with local app protocol avatar', () => {
      const result = Workspace.create({
        name: 'Local Workspace',
        avatarUrl: LOCAL_AVATAR_URL,
      })

      expect(result.isSuccess()).toBe(true)
      expect(result.success.avatarUrl).toBe(LOCAL_AVATAR_URL)
    })

    it('should allow creation with blob protocol avatar', () => {
      const result = Workspace.create({
        name: 'Blob Workspace',
        avatarUrl: BLOB_URL,
      })

      expect(result.isSuccess()).toBe(true)
      expect(result.success.avatarUrl).toBe(BLOB_URL)
    })

    it('should allow creation without description and avatar', () => {
      const result = Workspace.create({
        name: 'Simple Workspace',
      })

      expect(result.isSuccess()).toBe(true)

      const workspace = result.success

      expect(workspace.description).toBeUndefined()
      expect(workspace.avatarUrl).toBeUndefined()
    })

    it('should fail creation with invalid name', () => {
      const result = Workspace.create({
        name: 'Ab',
      })

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('WORKSPACE_INVALIDO')
      expect(result.failure.details).toHaveProperty('name')
    })

    it('should fail creation with invalid avatar protocol', () => {
      const result = Workspace.create({
        name: 'Invalid Avatar',
        avatarUrl: 'ftp://files.com/img.png',
      })

      expect(result.isFailure()).toBe(true)
      expect(result.failure.details).toHaveProperty('avatarUrl')
    })

    it('should fail creation with invalid avatar extension', () => {
      const result = Workspace.create({
        name: 'Invalid Avatar',
        avatarUrl: 'https://site.com/file.pdf',
      })

      expect(result.isFailure()).toBe(true)
      expect(result.failure.details).toHaveProperty('avatarUrl')
    })
  })

  describe('Granular mutations', () => {
    let workspace: Workspace
    const initialTime = new Date('2024-06-01T10:00:00Z')

    beforeEach(() => {
      vi.setSystemTime(initialTime)
      workspace = Workspace.create({ name: 'Initial Name' }).success
    })

    it('should update name and touch updatedAt', () => {
      const updateTime = new Date('2024-06-01T11:00:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.updateName('New Workspace Name')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.name).toBe('New Workspace Name')
      expect(workspace.updatedAt).toEqual(updateTime)
    })

    it('should trim updated name', () => {
      const result = workspace.updateName('   New Name   ')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.name).toBe('New Name')
    })

    it('should fail update name when invalid', () => {
      const result = workspace.updateName('A')

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('NOME_INVALIDO')
      expect(result.failure.details).toHaveProperty('name')
    })

    it('should update description', () => {
      const result = workspace.updateDescription('My Description')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.description).toBe('My Description')
    })

    it('should update description with empty string', () => {
      const result = workspace.updateDescription('')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.description).toBe('')
    })

    it('should update description with undefined', () => {
      const result = workspace.updateDescription(undefined)

      expect(result.isSuccess()).toBe(true)
      expect(workspace.description).toBeUndefined()
    })

    it('should trim description', () => {
      const result = workspace.updateDescription('   hello   ')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.description).toBe('hello')
    })

    it('should fail update description when invalid', () => {
      const result = workspace.updateDescription('a'.repeat(501))

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('DESCRICAO_INVALIDA')
      expect(result.failure.details).toHaveProperty('description')
    })

    it('should update avatarUrl with local protocol and touch updatedAt', () => {
      const updateTime = new Date('2024-06-01T13:00:00Z')
      vi.setSystemTime(updateTime)

      const result = workspace.updateAvatarUrl(LOCAL_AVATAR_URL)

      expect(result.isSuccess()).toBe(true)
      expect(workspace.avatarUrl).toBe(LOCAL_AVATAR_URL)
      expect(workspace.updatedAt).toEqual(updateTime)
    })

    it('should allow clearing avatarUrl with empty string', () => {
      const result = workspace.updateAvatarUrl('')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.avatarUrl).toBe('')
    })

    it('should allow clearing avatarUrl with undefined', () => {
      const result = workspace.updateAvatarUrl(undefined)

      expect(result.isSuccess()).toBe(true)
      expect(workspace.avatarUrl).toBeUndefined()
    })

    it('should fail update avatarUrl when invalid', () => {
      const result = workspace.updateAvatarUrl('ftp://invalid.com/img.png')

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('AVATAR_INVALIDO')
      expect(result.failure.details).toHaveProperty('avatarUrl')
    })
  })

  describe('updateIdentity', () => {
    let workspace: Workspace

    beforeEach(() => {
      workspace = Workspace.create({ name: 'Original Name' }).success
    })

    it('should update all identity fields', () => {
      const result = workspace.updateIdentity({
        name: 'Updated Name',
        description: 'Updated Desc',
        avatarUrl: LOCAL_AVATAR_URL,
      })

      expect(result.isSuccess()).toBe(true)

      expect(workspace.name).toBe('Updated Name')
      expect(workspace.description).toBe('Updated Desc')
      expect(workspace.avatarUrl).toBe(LOCAL_AVATAR_URL)
    })

    it('should fail when one or more fields are invalid', () => {
      const result = workspace.updateIdentity({
        name: 'A',
        description: 'valid',
        avatarUrl: 'not-a-url',
      })

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CAMPOS_INVALIDOS')
      expect(result.failure.details).toHaveProperty('name')
      expect(result.failure.details).toHaveProperty('avatarUrl')
    })
  })

  describe('Data source connections', () => {
    let workspace: Workspace

    beforeEach(() => {
      workspace = Workspace.create({ name: 'Test Workspace' }).success
    })

    it('should return false when there are no connections', () => {
      expect(workspace.isLinked()).toBe(false)
    })

    it('should link a data source', () => {
      const result = workspace.linkDataSource('conn-1', 'jira')

      expect(result.isSuccess()).toBe(true)

      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.dataSourceConnections[0]).toEqual({
        id: 'conn-1',
        dataSourceId: 'jira',
        status: 'disconnected',
      })

      expect(workspace.isLinked()).toBe(true)
    })

    it('should fail when trying to link local datasource', () => {
      const result = workspace.linkDataSource('local', 'local')

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('DATASOURCE_INVALIDO')
    })

    it('should not duplicate existing connection id', () => {
      workspace.linkDataSource('conn-1', 'jira')
      workspace.linkDataSource('conn-1', 'trello')

      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.dataSourceConnections[0].dataSourceId).toBe('jira')
    })

    it('should connect an existing data source', () => {
      workspace.linkDataSource('conn-1', 'jira')

      const config = {
        token: 'abc',
      }

      const result = workspace.connectDataSource('conn-1', MEMBER, config)

      expect(result.isSuccess()).toBe(true)

      const connection = workspace.dataSourceConnections[0]

      expect(connection.status).toBe('connected')
      expect(connection.member).toEqual(MEMBER)
      expect(connection.config).toEqual(config)
    })

    it('should fail when connecting a missing data source', () => {
      const result = workspace.connectDataSource('missing', MEMBER, {
        token: 'abc',
      })

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CONEXAO_NAO_ENCONTRADA')
    })

    it('should disconnect a data source and preserve member', () => {
      workspace.linkDataSource('conn-1', 'jira')

      workspace.connectDataSource('conn-1', MEMBER, { token: 'abc' })

      const result = workspace.disconnectDataSource('conn-1')

      expect(result.isSuccess()).toBe(true)

      const connection = workspace.dataSourceConnections[0]

      expect(connection.status).toBe('disconnected')
      expect(connection.config).toBeUndefined()
      expect(connection.member).toEqual(MEMBER)
    })

    it('should fail to disconnect non-existent connection', () => {
      const result = workspace.disconnectDataSource('ghost-id')

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CONEXAO_NAO_ENCONTRADA')
    })

    it('should unlink a specific connection', () => {
      workspace.linkDataSource('conn-1', 'jira')
      workspace.linkDataSource('conn-2', 'trello')

      const result = workspace.unlinkDataSource('conn-1')

      expect(result.isSuccess()).toBe(true)

      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.dataSourceConnections[0].id).toBe('conn-2')
    })

    it('should unlink all connections', () => {
      workspace.linkDataSource('conn-1', 'jira')
      workspace.linkDataSource('conn-2', 'trello')

      const result = workspace.unlinkDataSource()

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections).toHaveLength(0)
    })

    it('should expose frozen connection snapshots', () => {
      workspace.linkDataSource('conn-1', 'jira')
      workspace.connectDataSource('conn-1', MEMBER, { token: 'abc' })

      const connection = workspace.dataSourceConnections[0]

      expect(Object.isFrozen(connection)).toBe(true)
      expect(Object.isFrozen(connection.member!)).toBe(true)
      expect(Object.isFrozen(connection.config!)).toBe(true)
    })
  })

  describe('Other behavior', () => {
    it('should mark workspace as configured', () => {
      const workspace = Workspace.create({
        name: 'Workspace',
      }).success

      workspace.markAsConfigured()

      expect(workspace.status).toBe('configured')
    })

    it('should handle zod field mapping', () => {
      const result = Workspace.create({} as any)

      expect(result.isFailure()).toBe(true)
      expect(result.failure.details).toHaveProperty('name')
    })
  })
})
