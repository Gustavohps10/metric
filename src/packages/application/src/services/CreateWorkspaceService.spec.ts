import { InternalServerError } from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreateWorkspaceInput, IWorkspacesRepository } from '@/contracts'

import { CreateWorkspaceService } from './CreateWorkspaceService'

describe('CreateWorkspaceService', () => {
  let sut: CreateWorkspaceService

  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let fakeWorkspace: Mocked<Workspace>

  const fakeDate = new Date('2026-04-17T00:00:00.000Z')

  const makeInput = (): CreateWorkspaceInput => ({
    name: 'Metric Workspace',
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Partial<IWorkspacesRepository> as Mocked<IWorkspacesRepository>

    fakeWorkspace = {
      id: 'workspace-123',
      name: 'Metric Workspace',
      dataSourceConnections: [],
      createdAt: fakeDate,
      updatedAt: fakeDate,
    } as Partial<Workspace> as Mocked<Workspace>

    vi.spyOn(Workspace, 'create').mockReturnValue(fakeWorkspace)

    sut = new CreateWorkspaceService(workspacesRepositoryMock)
  })

  it('should create a workspace, save it to the repository, and return a WorkspaceDTO successfully', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.create.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(Workspace.create).toHaveBeenCalledWith(input.name)
    expect(workspacesRepositoryMock.create).toHaveBeenCalledWith(fakeWorkspace)

    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual({
      id: fakeWorkspace.id,
      name: fakeWorkspace.name,
      dataSourceConnections: [],
      createdAt: fakeWorkspace.createdAt,
      updatedAt: fakeWorkspace.updatedAt,
    })
  })

  it('should return InternalServerError when the repository throws an exception', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Database connection lost')

    workspacesRepositoryMock.create.mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ALGO DEU ERRADO AO CRIAR WORKSPACE',
    )
  })

  it('should return InternalServerError when the domain entity throws a validation error', async () => {
    // Arrange
    const input = makeInput()
    const domainError = new Error('Invalid workspace name')

    vi.spyOn(Workspace, 'create').mockImplementationOnce(() => {
      throw domainError
    })

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(workspacesRepositoryMock.create).not.toHaveBeenCalled()

    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ALGO DEU ERRADO AO CRIAR WORKSPACE',
    )
  })
})
