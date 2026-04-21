import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Workspace } from './Workspace'

describe('Workspace Entity', () => {
  const LOCAL_AVATAR_URL =
    'metric-app://C:\\Users\\Gustavo\\AppData\\Roaming\\metric\\workspaces\\avatars\\ws-9ef4bd92-e595-478f-b150-976d5c38372a.png'
  const BLOB_URL = 'blob:http://localhost:3000/mock-uuid'

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
      const props = {
        name: 'My Metric Workspace',
        description: 'desc',
        avatarUrl: 'https://avatar.com/img.png',
      }

      const result = Workspace.create(props)

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

    it('should allow creation with local app protocol avatar', () => {
      const result = Workspace.create({
        name: 'Local Workspace',
        avatarUrl: LOCAL_AVATAR_URL,
      })

      expect(result.isSuccess()).toBe(true)
      expect(result.success.avatarUrl).toBe(LOCAL_AVATAR_URL)
    })

    it('should allow creation with blob protocol avatar (preview state)', () => {
      const result = Workspace.create({
        name: 'Blob Workspace',
        avatarUrl: BLOB_URL,
      })

      expect(result.isSuccess()).toBe(true)
      expect(result.success.avatarUrl).toBe(BLOB_URL)
    })

    it('should fail creation with invalid name (too short)', () => {
      const result = Workspace.create({ name: 'Ab' })

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
  })

  describe('Mutations (Granular)', () => {
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

    it('should update description with empty string (or undefined)', () => {
      const result = workspace.updateDescription('')
      expect(result.isSuccess()).toBe(true)
      expect(workspace.description).toBe('')
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
  })

  describe('updateIdentity (Composed)', () => {
    let workspace: Workspace

    beforeEach(() => {
      workspace = Workspace.create({ name: 'Original Name' }).success
    })

    it('should update all identity fields successfully using local protocol', () => {
      const result = workspace.updateIdentity({
        name: 'Updated Name',
        description: 'Updated Desc',
        avatarUrl: LOCAL_AVATAR_URL,
      })

      expect(result.isSuccess()).toBe(true)
      expect(workspace.avatarUrl).toBe(LOCAL_AVATAR_URL)
    })

    it('should fail if any field in updateIdentity is invalid', () => {
      const result = workspace.updateIdentity({
        name: 'A', // invalid
        description: 'valid',
        avatarUrl: 'not-a-url', // invalid
      })

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CAMPOS_INVALIDOS')
      expect(result.failure.details).toHaveProperty('name')
      expect(result.failure.details).toHaveProperty('avatarUrl')
    })
  })

  describe('Data Source Connections', () => {
    let workspace: Workspace

    beforeEach(() => {
      workspace = Workspace.create({ name: 'Test WS' }).success
    })

    it('should link a data source successfully', () => {
      const result = workspace.linkDataSource('conn-1', 'jira-plugin')
      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.isLinked()).toBe(true)
    })

    it('should not add duplicate connection if ID already exists', () => {
      workspace.linkDataSource('conn-1', 'jira')
      workspace.linkDataSource('conn-1', 'trello') // mesmo ID

      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.dataSourceConnections[0].dataSourceId).toBe('jira')
    })

    it('should connect (add config) to an existing connection', () => {
      workspace.linkDataSource('conn-1', 'jira-plugin')
      const config = { apiKey: '123' }
      const result = workspace.connectDataSource('conn-1', config)

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections[0].config).toEqual(config)
    })

    it('should disconnect a data source (clear config)', () => {
      workspace.linkDataSource('conn-1', 'jira-plugin')
      workspace.connectDataSource('conn-1', { token: 'abc' })

      const result = workspace.disconnectDataSource('conn-1')

      expect(result.isSuccess()).toBe(true)
      expect(workspace.dataSourceConnections[0].config).toBeUndefined()
    })

    it('should fail to disconnect non-existent connection', () => {
      const result = workspace.disconnectDataSource('ghost-id')
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CONEXAO_NAO_ENCONTRADA')
    })

    it('should unlink a specific data source', () => {
      workspace.linkDataSource('conn-1', 'jira')
      workspace.linkDataSource('conn-2', 'trello')
      workspace.unlinkDataSource('conn-1')

      expect(workspace.dataSourceConnections).toHaveLength(1)
      expect(workspace.dataSourceConnections[0].id).toBe('conn-2')
    })

    it('should unlink all data sources', () => {
      workspace.linkDataSource('conn-1', 'jira')
      workspace.unlinkDataSource()
      expect(workspace.dataSourceConnections).toHaveLength(0)
    })
  })

  describe('Edge Cases & Helper Functions', () => {
    it('isLinked should return false when no connections exist', () => {
      const workspace = Workspace.create({ name: 'Empty' }).success
      expect(workspace.isLinked()).toBe(false)
    })

    it('mapZodErrors should handle root errors if path is empty', () => {
      // Este teste foca na função interna de mapeamento caso o Zod falhe sem path
      const result = Workspace.create({} as any)
      expect(result.isFailure()).toBe(true)
      // Verifica se as chaves de erro batem com o Schema
      expect(result.failure.details).toHaveProperty('name')
    })
  })
})
