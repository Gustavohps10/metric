import { AppError } from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IWorkspacesRepository } from '@/contracts'
import type { GetWorkspaceInput } from '@/contracts/use-cases/IGetWorkspaceUseCase'

import { GetWorkspaceService } from './GetWorkspaceService'

describe('GetWorkspaceService', () => {
  let sut: GetWorkspaceService

  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let fakeWorkspace: Mocked<Workspace>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (): GetWorkspaceInput => ({
    workspaceId: 'workspace-123',
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
    } as Partial<IWorkspacesRepository> as Mocked<IWorkspacesRepository>

    fakeWorkspace = {
      id: 'workspace-123',
      name: 'Metric Workspace',
      dataSourceConnections: [],
      createdAt: fakeDate,
      updatedAt: fakeDate,
    } as Partial<Workspace> as Mocked<Workspace>

    sut = new GetWorkspaceService(workspacesRepositoryMock)
  })

  it('should return a WorkspaceDTO successfully when the workspace exists', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(workspacesRepositoryMock.findById).toHaveBeenCalledWith(
      input.workspaceId,
    )

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
  })
})
