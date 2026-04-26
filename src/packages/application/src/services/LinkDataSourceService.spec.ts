import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IWorkspacesRepository } from '@/contracts'
import type { LinkDataSourceInput } from '@/contracts/use-cases/ILinkDataSourceUseCase'

import { LinkDataSourceService } from './LinkDataSourceService'

describe('LinkDataSourceService', () => {
  let sut: LinkDataSourceService

  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let fakeWorkspace: Mocked<Workspace>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (): LinkDataSourceInput => ({
    workspaceId: 'workspace-123',
    connectionInstanceId: 'conn-abc',
    dataSourceId: 'plugin-xyz',
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
    } as Partial<IWorkspacesRepository> as Mocked<IWorkspacesRepository>

    fakeWorkspace = {
      id: 'workspace-123',
      name: 'Metric Workspace',
      dataSourceConnections: [],
      createdAt: fakeDate,
      updatedAt: fakeDate,
      linkDataSource: vi.fn(),
    } as Partial<Workspace> as Mocked<Workspace>

    sut = new LinkDataSourceService(workspacesRepositoryMock)
  })

  it('should successfully link a data source, update the repository, and return the WorkspaceDTO', async () => {
    // Arrange
    const input = makeInput()

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.linkDataSource.mockReturnValue(Either.success(undefined))
    workspacesRepositoryMock.update.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)

    expect(workspacesRepositoryMock.findById).toHaveBeenCalledWith(
      input.workspaceId,
    )
    expect(fakeWorkspace.linkDataSource).toHaveBeenCalledWith(
      input.connectionInstanceId,
      input.dataSourceId,
    )
    expect(workspacesRepositoryMock.update).toHaveBeenCalledWith(fakeWorkspace)

    expect(result.success).toEqual({
      id: fakeWorkspace.id,
      name: fakeWorkspace.name,
      dataSourceConnections: [],
      createdAt: fakeWorkspace.createdAt,
      updatedAt: fakeWorkspace.updatedAt,
    })
  })

  it('should return NotFoundError when the workspace does not exist', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('WORKSPACE_NAO_ENCONTRADO')

    expect(fakeWorkspace.linkDataSource).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should forward failure when the domain entity rejects the link operation', async () => {
    // Arrange
    const input = makeInput()
    const domainError = AppError.ValidationError('CONEXAO_JA_EXISTE')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.linkDataSource.mockReturnValue(Either.failure(domainError))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(domainError)

    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when an unexpected exception is thrown', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Database connection lost')

    workspacesRepositoryMock.findById.mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('ERRO_INESPERADO')
  })
})
