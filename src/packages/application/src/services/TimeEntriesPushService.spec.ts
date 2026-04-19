import {
  Either,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from '@metric-org/cross-cutting/helpers'
import { TimeEntry } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  IDataSourceResolver,
  ITimeEntryRepository,
  IWorkspacesRepository,
} from '@/contracts'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { SyncTimeEntryDTO } from '@/contracts/use-cases'
import { SessionManager } from '@/workflow'

import { TimeEntriesPushService } from './TimeEntriesPushService'

describe('TimeEntriesPushService', () => {
  let sut: TimeEntriesPushService

  let sessionManagerMock: Mocked<SessionManager>
  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Mocked<IDataSourceAdapter>
  let timeEntryRepositoryMock: Mocked<ITimeEntryRepository>

  const fakeCurrentTime = new Date('2026-04-18T12:00:00.000Z')
  const fakeOldTime = new Date('2026-04-17T10:00:00.000Z')

  const fakeSessionUser = { id: 'user-123', name: 'Jane Doe' }
  const fakeWorkspace = { id: 'workspace-123' }

  let fakeDomainTimeEntry: Mocked<TimeEntry>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(fakeCurrentTime)

    sessionManagerMock = {
      getCurrentUser: vi.fn(),
    } as Partial<SessionManager> as Mocked<SessionManager>

    workspacesRepositoryMock = {
      findById: vi.fn(),
    } as Partial<IWorkspacesRepository> as Mocked<IWorkspacesRepository>

    timeEntryRepositoryMock = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Partial<ITimeEntryRepository> as Mocked<ITimeEntryRepository>

    adapterMock = {
      timeEntryRepository: timeEntryRepositoryMock,
    } as unknown as Mocked<IDataSourceAdapter>

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
    } as Partial<IDataSourceResolver> as Mocked<IDataSourceResolver>

    fakeDomainTimeEntry = {
      id: 'existing-id',
      updatedAt: fakeCurrentTime,
      updateHours: vi.fn().mockReturnValue(Either.success(undefined)),
      updateComments: vi.fn(),
    } as unknown as Mocked<TimeEntry>

    sut = new TimeEntriesPushService(
      sessionManagerMock,
      workspacesRepositoryMock,
      dataSourceResolverMock,
    )

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace as any)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return UnauthorizedError if session user is not found', async () => {
    sessionManagerMock.getCurrentUser.mockReturnValue(undefined)

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [],
    })

    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(UnauthorizedError)
    expect((result.failure as UnauthorizedError).messageKey).toBe(
      'USUARIO_NAO_ENCONTRADO',
    )
  })

  it('should return UnauthorizedError if workspace is not found', async () => {
    workspacesRepositoryMock.findById.mockResolvedValue(undefined)

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [],
    })

    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(UnauthorizedError)
    expect((result.failure as UnauthorizedError).messageKey).toBe(
      'WORKSPACE_NAO_ENCONTRADO',
    )
  })

  it('should return InternalServerError if an unexpected error occurs in the main flow', async () => {
    dataSourceResolverMock.getDataSource.mockRejectedValue(
      new Error('Adapter crashed'),
    )

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [],
    })

    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ERRO_INESPERADO',
    )
  })

  it('should add validation error if document id is missing', async () => {
    const invalidEntry = { _deleted: false } as SyncTimeEntryDTO

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [invalidEntry],
    })

    expect(result.isSuccess()).toBe(true)
    const syncedEntries = result.success as SyncTimeEntryDTO[]
    expect(syncedEntries[0].validationError).toBeInstanceOf(ValidationError)
    expect(
      (syncedEntries[0].validationError as ValidationError).messageKey,
    ).toBe('DOCUMENT_ID_MISSING')
  })

  it('should add validation error if not deleted and updatedAt is missing', async () => {
    const invalidEntry = { id: '123', _deleted: false } as SyncTimeEntryDTO

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [invalidEntry],
    })

    expect(result.isSuccess()).toBe(true)
    const syncedEntries = result.success as SyncTimeEntryDTO[]
    expect(syncedEntries[0].validationError).toBeInstanceOf(ValidationError)
    expect(
      (syncedEntries[0].validationError as ValidationError).messageKey,
    ).toBe('DOCUMENT_UPDATED_AT_MISSING')
  })

  it('should handle deleted document successfully', async () => {
    const deletedEntry = { id: 'del-123', _deleted: true } as SyncTimeEntryDTO

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [deletedEntry],
    })

    expect(result.isSuccess()).toBe(true)
    expect(timeEntryRepositoryMock.delete).toHaveBeenCalledWith('del-123')
    expect(result.success?.[0].syncedAt).toEqual(fakeCurrentTime)
  })

  it('should handle existing document successfully', async () => {
    const existingEntry = {
      id: 'existing-123',
      _deleted: false,
      updatedAt: fakeCurrentTime,
      comments: 'Updated text',
    } as SyncTimeEntryDTO

    timeEntryRepositoryMock.findById.mockResolvedValue(fakeDomainTimeEntry)

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [existingEntry],
    })

    expect(result.isSuccess()).toBe(true)
    expect(fakeDomainTimeEntry.updateHours).toHaveBeenCalled()
    expect(fakeDomainTimeEntry.updateComments).toHaveBeenCalledWith(
      'Updated text',
    )
    expect(timeEntryRepositoryMock.update).toHaveBeenCalledWith(
      fakeDomainTimeEntry,
    )
    expect(result.success?.[0].syncedAt).toEqual(fakeCurrentTime)
  })

  it('should flag conflict if assumedMasterState updatedAt differs from existing entity', async () => {
    const conflictingEntry = {
      id: 'conflict-123',
      _deleted: false,
      updatedAt: fakeCurrentTime,
      assumedMasterState: { updatedAt: fakeOldTime },
    } as SyncTimeEntryDTO

    timeEntryRepositoryMock.findById.mockResolvedValue(fakeDomainTimeEntry)

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [conflictingEntry],
    })

    expect(result.isSuccess()).toBe(true)
    const syncedEntry = result.success?.[0] as SyncTimeEntryDTO
    expect(syncedEntry.conflicted).toBe(true)
    expect(syncedEntry.conflictData?.local).toEqual(conflictingEntry)
    expect(syncedEntry.conflictData?.server).toEqual(fakeDomainTimeEntry)
    expect(timeEntryRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should add validation error if existing domain entity rejects updateHours', async () => {
    const existingEntry = {
      id: 'existing-123',
      _deleted: false,
      updatedAt: fakeCurrentTime,
    } as SyncTimeEntryDTO

    const domainError = ValidationError.danger('HORAS_INVALIDAS')
    fakeDomainTimeEntry.updateHours.mockReturnValue(Either.failure(domainError))
    timeEntryRepositoryMock.findById.mockResolvedValue(fakeDomainTimeEntry)

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [existingEntry],
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.success?.[0].validationError).toBe(domainError)
    expect(timeEntryRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should handle new document successfully', async () => {
    const newEntry = {
      id: 'new-123',
      _deleted: false,
      updatedAt: fakeCurrentTime,
      task: { id: 't-1' },
      activity: { id: 'a-1' },
      user: { id: 'u-1', name: 'John' },
      comments: 'New work',
    } as SyncTimeEntryDTO

    timeEntryRepositoryMock.findById.mockResolvedValue(undefined)
    vi.spyOn(TimeEntry, 'create').mockReturnValue(
      Either.success(fakeDomainTimeEntry),
    )

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [newEntry],
    })

    expect(result.isSuccess()).toBe(true)
    expect(TimeEntry.create).toHaveBeenCalled()
    expect(timeEntryRepositoryMock.create).toHaveBeenCalledWith(
      fakeDomainTimeEntry,
    )
    expect(result.success?.[0].syncedAt).toEqual(fakeCurrentTime)
  })

  it('should add validation error if new document creation is rejected by domain', async () => {
    const newEntry = {
      id: 'new-123',
      _deleted: false,
      updatedAt: fakeCurrentTime,
      task: { id: 't-1' },
      activity: { id: 'a-1' },
      user: { id: 'u-1', name: 'John' },
    } as SyncTimeEntryDTO

    timeEntryRepositoryMock.findById.mockResolvedValue(undefined)
    vi.spyOn(TimeEntry, 'create').mockReturnValue(
      Either.failure(ValidationError.danger('DADOS_INVALIDOS')),
    )

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [newEntry],
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.success?.[0].validationError?.messageKey).toBe(
      'TIME_ENTRY_INVALID',
    )
    expect(timeEntryRepositoryMock.create).not.toHaveBeenCalled()
  })

  it('should catch unhandled exceptions inside processEntry and assign ERRO_PROCESSAMENTO_DOCUMENTO', async () => {
    const exceptionEntry = {
      id: 'exc-123',
      _deleted: false,
      updatedAt: fakeCurrentTime,
    } as SyncTimeEntryDTO

    timeEntryRepositoryMock.findById.mockRejectedValue(new Error('DB Timeout'))

    const result = await sut.execute({
      workspaceId: 'w-1',
      pluginId: 'p-1',
      connectionInstanceId: 'c-1',
      entries: [exceptionEntry],
    })

    expect(result.isSuccess()).toBe(true)
    const processedEntry = result.success?.[0] as SyncTimeEntryDTO
    expect(processedEntry.validationError).toBeInstanceOf(ValidationError)
    expect((processedEntry.validationError as ValidationError).messageKey).toBe(
      'ERRO_PROCESSAMENTO_DOCUMENTO',
    )
  })
})
