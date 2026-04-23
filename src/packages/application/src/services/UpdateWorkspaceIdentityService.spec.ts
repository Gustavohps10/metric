import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  IFileManager,
  IFileStorage,
  IWorkspacesRepository,
} from '@/contracts'

import { UpdateWorkspaceIdentityService } from './UpdateWorkspaceIdentityService'

describe('UpdateWorkspaceIdentityService', () => {
  let sut: UpdateWorkspaceIdentityService
  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let fileStorageMock: Mocked<IFileStorage>
  let fileManagerMock: Mocked<IFileManager>
  let fakeWorkspace: Mocked<Workspace>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (overrides = {}) => ({
    workspaceId: 'ws-123',
    name: 'New Name',
    description: 'New Description',
    avatarFile: Buffer.from('fake-image'),
    removeAvatar: false,
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesRepositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<IWorkspacesRepository>

    fileStorageMock = {
      write: vi.fn(),
      getPublicUrl: vi.fn(),
      delete: vi.fn(),
      read: vi.fn(),
    } as unknown as Mocked<IFileStorage>

    fileManagerMock = {
      zip: vi.fn(),
      unzipInMemory: vi.fn(),
      getMimeType: vi.fn(),
    } as unknown as Mocked<IFileManager>

    fakeWorkspace = {
      id: 'ws-123',
      name: 'Old Name',
      description: 'Old Description',
      avatarUrl: 'https://old-avatar.com/img.png',
      status: 'configured',
      dataSourceConnections: [],
      createdAt: fakeDate,
      updatedAt: fakeDate,
      updateIdentity: vi.fn(),
    } as unknown as Mocked<Workspace>

    sut = new UpdateWorkspaceIdentityService(
      workspacesRepositoryMock,
      fileStorageMock,
      fileManagerMock,
    )
  })

  it('should return NotFound when workspace does not exist', async () => {
    workspacesRepositoryMock.findById.mockResolvedValue(null as any)

    const result = await sut.execute(makeInput())

    expect(result.isFailure()).toBe(true)
    expect(result.failure.statusCode).toBe(404)
    expect(result.failure.messageKey).toBe('WORKSPACE_NAO_ENCONTRADO')
    expect(fileStorageMock.write).not.toHaveBeenCalled()
  })

  it('should update identity without changing avatar when no file and no removeAvatar', async () => {
    const input = makeInput({ avatarFile: undefined })

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.updateIdentity.mockReturnValue(Either.success())

    const result = await sut.execute(input)

    expect(result.isSuccess()).toBe(true)
    expect(fileStorageMock.write).not.toHaveBeenCalled()
    expect(fileManagerMock.getMimeType).not.toHaveBeenCalled()
    expect(fakeWorkspace.updateIdentity).toHaveBeenCalledWith({
      name: input.name,
      description: input.description,
      avatarUrl: fakeWorkspace.avatarUrl,
    })
  })

  it('should delete old avatar and set avatarUrl to undefined when removeAvatar is true', async () => {
    const input = makeInput({ avatarFile: undefined, removeAvatar: true })

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.updateIdentity.mockReturnValue(Either.success())

    const result = await sut.execute(input)

    expect(result.isSuccess()).toBe(true)
    expect(fileStorageMock.delete).toHaveBeenCalledWith(
      `workspaces/avatars/${fakeWorkspace.id}.any`,
      true,
    )
    expect(fakeWorkspace.updateIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: undefined }),
    )
  })

  it('should not call fileStorage.delete if workspace has no avatar when removeAvatar is true', async () => {
    const input = makeInput({ avatarFile: undefined, removeAvatar: true })

    fakeWorkspace = {
      ...fakeWorkspace,
      avatarUrl: undefined,
      updateIdentity: vi.fn().mockReturnValue(Either.success()),
    } as unknown as Mocked<Workspace>

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)

    await sut.execute(input)

    expect(fileStorageMock.delete).not.toHaveBeenCalled()
  })

  it('should upload new avatar and update identity successfully', async () => {
    const input = makeInput()
    const newPublicUrl = 'https://storage.com/new-avatar.png'

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fileManagerMock.getMimeType.mockResolvedValue(
      Either.success({ mime: 'image/png', ext: 'png' }),
    )
    fileStorageMock.getPublicUrl.mockReturnValue(newPublicUrl)
    fakeWorkspace.updateIdentity.mockReturnValue(Either.success())

    const result = await sut.execute(input)

    expect(result.isSuccess()).toBe(true)
    expect(fileStorageMock.write).toHaveBeenCalledWith(
      `workspaces/avatars/${fakeWorkspace.id}.png`,
      input.avatarFile,
    )
    expect(fakeWorkspace.updateIdentity).toHaveBeenCalledWith({
      name: input.name,
      description: input.description,
      avatarUrl: newPublicUrl,
    })
    expect(workspacesRepositoryMock.update).toHaveBeenCalledWith(fakeWorkspace)
  })

  it('should use correct extension from getMimeType', async () => {
    const input = makeInput()

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fileManagerMock.getMimeType.mockResolvedValue(
      Either.success({ mime: 'image/webp', ext: 'webp' }),
    )
    fileStorageMock.getPublicUrl.mockReturnValue(
      'https://storage.com/avatar.webp',
    )
    fakeWorkspace.updateIdentity.mockReturnValue(Either.success())

    await sut.execute(input)

    expect(fileStorageMock.write).toHaveBeenCalledWith(
      `workspaces/avatars/${fakeWorkspace.id}.webp`,
      input.avatarFile,
    )
  })

  it('should return failure if getMimeType fails', async () => {
    const input = makeInput()

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fileManagerMock.getMimeType.mockResolvedValue(
      Either.failure(
        AppError.ValidationError('Formato de arquivo não suportado.'),
      ),
    )

    const result = await sut.execute(input)

    expect(result.isFailure()).toBe(true)
    expect(fileStorageMock.write).not.toHaveBeenCalled()
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should delete uploaded avatar and return failure if updateIdentity fails', async () => {
    const input = makeInput()
    const domainError = AppError.ValidationError('CAMPOS_INVALIDOS')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fileManagerMock.getMimeType.mockResolvedValue(
      Either.success({ mime: 'image/png', ext: 'png' }),
    )
    fileStorageMock.getPublicUrl.mockReturnValue(
      'https://storage.com/avatar.png',
    )
    fakeWorkspace.updateIdentity.mockReturnValue(Either.failure(domainError))

    const result = await sut.execute(input)

    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(domainError)
    expect(fileStorageMock.delete).toHaveBeenCalledWith(
      `workspaces/avatars/${fakeWorkspace.id}.png`,
      true,
    )
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should not delete avatar if updateIdentity fails and no new file was uploaded', async () => {
    const input = makeInput({ avatarFile: undefined })
    const domainError = AppError.ValidationError('CAMPOS_INVALIDOS')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fakeWorkspace.updateIdentity.mockReturnValue(Either.failure(domainError))

    await sut.execute(input)

    expect(fileStorageMock.delete).not.toHaveBeenCalled()
  })

  it('should delete uploaded avatar and return failure if repository update throws', async () => {
    const input = makeInput()

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fileManagerMock.getMimeType.mockResolvedValue(
      Either.success({ mime: 'image/png', ext: 'png' }),
    )
    fileStorageMock.getPublicUrl.mockReturnValue(
      'https://storage.com/avatar.png',
    )
    fakeWorkspace.updateIdentity.mockReturnValue(Either.success())
    workspacesRepositoryMock.update.mockRejectedValue(new Error('DB Error'))

    const result = await sut.execute(input)

    expect(result.isFailure()).toBe(true)
    expect(fileStorageMock.delete).toHaveBeenCalledWith(
      `workspaces/avatars/${fakeWorkspace.id}.png`,
      true,
    )
  })

  it('should return Internal error when findById throws', async () => {
    workspacesRepositoryMock.findById.mockRejectedValue(new Error('Fatal'))

    const result = await sut.execute(makeInput())

    expect(result.isFailure()).toBe(true)
    expect(result.failure.statusCode).toBe(500)
    expect(result.failure.messageKey).toBe(
      'ERRO_AO_ATUALIZAR_IDENTIDADE_DO_WORKSPACE',
    )
  })

  it('should return Internal error when fileStorage.write throws', async () => {
    const input = makeInput()

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    fileManagerMock.getMimeType.mockResolvedValue(
      Either.success({ mime: 'image/png', ext: 'png' }),
    )
    fileStorageMock.write.mockRejectedValue(new Error('Storage Error'))

    const result = await sut.execute(input)

    expect(result.isFailure()).toBe(true)
    expect(result.failure.statusCode).toBe(500)
    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })
})
