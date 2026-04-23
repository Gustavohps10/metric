import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IFileStorage, IWorkspacesRepository } from '@/contracts'

import { DeleteWorkspaceService } from './DeleteWorkspaceService'

describe('DeleteWorkspaceService', () => {
  let sut: DeleteWorkspaceService
  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let fileStorageMock: Mocked<IFileStorage>

  const makeInput = () => ({
    workspaceId: 'ws-123',
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as Mocked<IWorkspacesRepository>

    fileStorageMock = {
      delete: vi.fn(),
      write: vi.fn(),
      read: vi.fn(),
      getPublicUrl: vi.fn(),
    } as unknown as Mocked<IFileStorage>

    sut = new DeleteWorkspaceService(workspacesRepositoryMock, fileStorageMock)
  })

  it('should delete workspace and its avatar from storage if it exists', async () => {
    const input = makeInput()
    const workspace = Workspace.create({ name: 'Metric Workspace' }).success
    workspace.updateAvatarUrl('https://storage.com/avatars/ws-123.png')

    workspacesRepositoryMock.findById.mockResolvedValue(workspace)

    const result = await sut.execute(input)

    expect(result.isSuccess()).toBe(true)
    expect(fileStorageMock.delete).toHaveBeenCalledWith(
      `workspaces/avatars/${workspace.id}.png`,
      true,
    )
    expect(workspacesRepositoryMock.delete).toHaveBeenCalledWith(
      input.workspaceId,
    )
  })

  it('should only delete workspace if no avatar exists', async () => {
    const input = makeInput()
    const workspace = Workspace.create({ name: 'No Avatar Workspace' }).success

    workspacesRepositoryMock.findById.mockResolvedValue(workspace)

    const result = await sut.execute(input)

    expect(result.isSuccess()).toBe(true)
    expect(fileStorageMock.delete).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.delete).toHaveBeenCalledWith(
      input.workspaceId,
    )
  })

  it('should return NotFound error when workspace does not exist', async () => {
    const input = makeInput()
    workspacesRepositoryMock.findById.mockResolvedValue(null as any)

    const result = await sut.execute(input)

    expect(result.isFailure()).toBe(true)
    expect(result.failure.statusCode).toBe(404)
    expect(fileStorageMock.delete).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.delete).not.toHaveBeenCalled()
  })

  it('should return Internal error if repository throws', async () => {
    const input = makeInput()
    workspacesRepositoryMock.findById.mockRejectedValue(new Error('Fatal'))

    const result = await sut.execute(input)

    expect(result.isFailure()).toBe(true)
    expect(result.failure.statusCode).toBe(500)
    expect(result.failure.messageKey).toBe('ERRO_AO_DELETAR_WORKSPACE')
  })
})
