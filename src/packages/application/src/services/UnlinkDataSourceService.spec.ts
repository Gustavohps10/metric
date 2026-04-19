import {
  Either,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ICredentialsStorage,
  IWorkspacesRepository,
  UnlinkDataSourceInput,
} from '@/contracts'
import { getMemberStorageKey } from '@/credentials-storage-keys'

import { UnlinkDataSourceService } from './UnlinkDataSourceService'

describe('UnlinkDataSourceService', () => {
  let sut: UnlinkDataSourceService

  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let credentialsStorageMock: Mocked<ICredentialsStorage>
  let fakeWorkspace: Mocked<Workspace>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (connectionInstanceId?: string): UnlinkDataSourceInput => ({
    workspaceId: 'workspace-123',
    connectionInstanceId,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
    } as Partial<IWorkspacesRepository> as Mocked<IWorkspacesRepository>

    credentialsStorageMock = {
      deleteToken: vi.fn(),
    } as Partial<ICredentialsStorage> as Mocked<ICredentialsStorage>

    fakeWorkspace = {
      id: 'workspace-123',
      name: 'Metric Workspace',
      dataSourceConnections: [
        { id: 'conn-1', dataSourceId: 'plugin-x' },
        { id: 'conn-2', dataSourceId: 'plugin-y' },
      ],
      createdAt: fakeDate,
      updatedAt: fakeDate,
      unlinkDataSource: vi.fn(),
    } as Partial<Workspace> as Mocked<Workspace>

    sut = new UnlinkDataSourceService(
      workspacesRepositoryMock,
      credentialsStorageMock,
    )
  })

  it('should unlink a specific data source, clear its credentials, update the repository, and return a DTO', async () => {
    // Arrange
    const input = makeInput('conn-1')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.unlinkDataSource.mockReturnValue(Either.success(undefined))
    workspacesRepositoryMock.update.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)

    const expectedSessionKey = `workspace-session-${input.workspaceId}-${input.connectionInstanceId}`
    const expectedMemberKey = getMemberStorageKey(
      input.workspaceId,
      input.connectionInstanceId!,
    )

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledTimes(2)
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      expectedSessionKey,
    )
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      expectedMemberKey,
    )

    expect(fakeWorkspace.unlinkDataSource).toHaveBeenCalledWith('conn-1')
    expect(workspacesRepositoryMock.update).toHaveBeenCalledWith(fakeWorkspace)

    expect(result.success).toEqual({
      id: fakeWorkspace.id,
      name: fakeWorkspace.name,
      dataSourceConnections: fakeWorkspace.dataSourceConnections,
      createdAt: fakeWorkspace.createdAt,
      updatedAt: fakeWorkspace.updatedAt,
    })
  })

  it('should unlink all data sources and clear ALL credentials when connectionInstanceId is not provided', async () => {
    // Arrange
    const input = makeInput(undefined)

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.unlinkDataSource.mockReturnValue(Either.success(undefined))
    workspacesRepositoryMock.update.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledTimes(4)

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      `workspace-session-${input.workspaceId}-conn-1`,
    )
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      getMemberStorageKey(input.workspaceId, 'conn-1'),
    )

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      `workspace-session-${input.workspaceId}-conn-2`,
    )
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      getMemberStorageKey(input.workspaceId, 'conn-2'),
    )

    expect(fakeWorkspace.unlinkDataSource).toHaveBeenCalledWith(undefined)
  })

  it('should return NotFoundError when the workspace does not exist', async () => {
    // Arrange
    const input = makeInput('conn-1')
    workspacesRepositoryMock.findById.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(NotFoundError)
    expect((result.failure as NotFoundError).messageKey).toBe(
      'WORKSPACE_NAO_ENCONTRADO',
    )

    expect(credentialsStorageMock.deleteToken).not.toHaveBeenCalled()
    expect(fakeWorkspace.unlinkDataSource).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should forward failure when the domain entity rejects the unlink operation', async () => {
    // Arrange
    const input = makeInput('conn-abc')
    const domainError = ValidationError.danger('CONEXAO_NAO_ENCONTRADA')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.unlinkDataSource.mockReturnValue(Either.failure(domainError))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(domainError)

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledTimes(2)
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when an unexpected exception is thrown', async () => {
    // Arrange
    const input = makeInput('conn-1')
    const error = new Error('Database connection lost')

    workspacesRepositoryMock.findById.mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ERRO_INESPERADO',
    )

    expect(credentialsStorageMock.deleteToken).not.toHaveBeenCalled()
    expect(fakeWorkspace.unlinkDataSource).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })
})
