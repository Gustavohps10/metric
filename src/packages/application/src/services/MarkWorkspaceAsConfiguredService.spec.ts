import { Workspace } from '@metric-org/domain'
import { AppError } from '@metric-org/shared/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IWorkspacesRepository } from '@/contracts'

import { MarkWorkspaceAsConfiguredService } from './MarkWorkspaceAsConfiguredService'

describe('MarkWorkspaceAsConfiguredService', () => {
  let sut: MarkWorkspaceAsConfiguredService
  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let fakeWorkspace: Mocked<Workspace>

  const makeInput = () => ({
    workspaceId: 'ws-123',
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<IWorkspacesRepository>

    fakeWorkspace = {
      id: 'ws-123',
      markAsConfigured: vi.fn(),
    } as unknown as Mocked<Workspace>

    sut = new MarkWorkspaceAsConfiguredService(workspacesRepositoryMock)
  })

  it('should mark workspace as configured successfully', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    workspacesRepositoryMock.update.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(fakeWorkspace.markAsConfigured).toHaveBeenCalledTimes(1)
    expect(workspacesRepositoryMock.update).toHaveBeenCalledWith(fakeWorkspace)
  })

  it('should return ValidationError when workspace does not exist', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('Workspace nao encontrado')
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should return failure when repository findById throws an exception', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockRejectedValue(new Error('DB Error'))

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow('DB Error')
  })
})
