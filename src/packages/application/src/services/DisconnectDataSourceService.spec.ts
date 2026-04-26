import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  DisconnectDataSourceInput,
  ICredentialsStorage,
  IWorkspacesRepository,
} from '@/contracts'
import { getMemberStorageKey } from '@/credentials-storage-keys'

import { DisconnectDataSourceService } from './DisconnectDataSourceService'

describe('DisconnectDataSourceService', () => {
  let sut: DisconnectDataSourceService

  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let credentialsStorageMock: Mocked<ICredentialsStorage>
  let fakeWorkspace: Mocked<Workspace>

  const makeInput = (): DisconnectDataSourceInput => ({
    workspaceId: 'workspace-123',
    connectionInstanceId: 'conn-abc',
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<IWorkspacesRepository>

    credentialsStorageMock = {
      saveToken: vi.fn(),
      deleteToken: vi.fn(),
      getToken: vi.fn(),
      hasToken: vi.fn(),
      replaceToken: vi.fn(),
    } as unknown as Mocked<ICredentialsStorage>

    fakeWorkspace = {
      id: 'workspace-123',
      disconnectDataSource: vi.fn(),
    } as unknown as Mocked<Workspace>

    sut = new DisconnectDataSourceService(
      workspacesRepositoryMock,
      credentialsStorageMock,
    )
  })

  it('should disconnect the data source, delete tokens, update workspace and return success', async () => {
    // Arrange
    const input = makeInput()

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.disconnectDataSource.mockReturnValue(Either.success())

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)

    const expectedStorageKey = `workspace-session-${input.workspaceId}-${input.connectionInstanceId}`
    const expectedMemberKey = getMemberStorageKey(
      input.workspaceId,
      input.connectionInstanceId,
    )

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledTimes(2)
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      expectedStorageKey,
    )
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      expectedMemberKey,
    )

    expect(fakeWorkspace.disconnectDataSource).toHaveBeenCalledWith(
      input.connectionInstanceId,
    )
    expect(workspacesRepositoryMock.update).toHaveBeenCalledWith(fakeWorkspace)
  })

  it('should return NotFound error when the workspace does not exist', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure.statusCode).toBe(404)
    expect(result.failure.messageKey).toBe('WORKSPACE_NAO_ENCONTRADO')

    expect(credentialsStorageMock.deleteToken).not.toHaveBeenCalled()
    expect(fakeWorkspace.disconnectDataSource).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should forward the failure when the domain entity rejects the disconnection', async () => {
    // Arrange
    const input = makeInput()
    const domainError = AppError.ValidationError('CONEXAO_NAO_ENCONTRADA')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.disconnectDataSource.mockReturnValue(
      Either.failure(domainError),
    )

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(domainError)

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledTimes(2)
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should return NotFound error (mapped from catch) when an exception is thrown', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockRejectedValue(new Error('DB Error'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure.statusCode).toBe(404)
    expect(result.failure.messageKey).toBe('ERRO_AO_DESCONECTAR')

    expect(credentialsStorageMock.deleteToken).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })
})
