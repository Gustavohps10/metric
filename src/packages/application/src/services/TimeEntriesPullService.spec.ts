import {
  InternalServerError,
  UnauthorizedError,
} from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IDataSourceResolver } from '@/contracts/resolvers'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { PullTimeEntriesInput } from '@/contracts/use-cases'
import type { TimeEntryDTO } from '@/dtos'
import { SessionManager } from '@/workflow'

import { TimeEntriesPullService } from './TimeEntriesPullService'

describe('TimeEntriesPullService', () => {
  let sut: TimeEntriesPullService

  let sessionManagerMock: Mocked<SessionManager>
  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Mocked<IDataSourceAdapter>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (memberIdOverride?: string): PullTimeEntriesInput => ({
    workspaceId: 'workspace-123',
    pluginId: 'plugin-xyz',
    connectionInstanceId: 'conn-abc',
    memberId:
      memberIdOverride !== undefined ? memberIdOverride : 'input-member-id',
    checkpoint: {
      updatedAt: fakeDate,
      id: 'time-entry-sync-1',
    },
    batch: 100,
  })

  const fakeSessionUser = {
    id: 'session-user-id',
    name: 'Jane Doe',
  }

  const fakeTimeEntries: TimeEntryDTO[] = [
    {
      id: 'entry-1',
      taskId: 'task-1',
      hours: 2.5,
      comments: 'Worked on authentication',
      spentOn: fakeDate,
      createdAt: fakeDate,
      updatedAt: fakeDate,
    } as unknown as TimeEntryDTO,
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    sessionManagerMock = {
      getCurrentUser: vi.fn(),
    } as Partial<SessionManager> as Mocked<SessionManager>

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
    } as Partial<IDataSourceResolver> as Mocked<IDataSourceResolver>

    adapterMock = {
      timeEntryQuery: {
        pull: vi.fn(),
      },
    } as unknown as Mocked<IDataSourceAdapter>

    sut = new TimeEntriesPullService(sessionManagerMock, dataSourceResolverMock)
  })

  it('should pull time entries using the provided memberId from input', async () => {
    // Arrange
    const input = makeInput('explicit-member-id')

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.timeEntryQuery.pull as any).mockResolvedValue(fakeTimeEntries)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeTimeEntries)

    expect(adapterMock.timeEntryQuery.pull).toHaveBeenCalledWith(
      'explicit-member-id',
      input.checkpoint,
      input.batch,
    )
  })

  it('should fallback to session user ID if input memberId is empty or blank spaces', async () => {
    // Arrange
    const input = makeInput('   ')

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.timeEntryQuery.pull as any).mockResolvedValue(fakeTimeEntries)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)

    expect(adapterMock.timeEntryQuery.pull).toHaveBeenCalledWith(
      fakeSessionUser.id,
      input.checkpoint,
      input.batch,
    )
  })

  it('should return UnauthorizedError if both input memberId and session user are missing/empty', async () => {
    // Arrange
    const input = makeInput('')
    sessionManagerMock.getCurrentUser.mockReturnValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(UnauthorizedError)
    expect((result.failure as UnauthorizedError).messageKey).toBe(
      'Usuário não autenticado.',
    )

    expect(dataSourceResolverMock.getDataSource).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when the data source resolver throws an exception', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Plugin resolution failed')

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    dataSourceResolverMock.getDataSource.mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ERRO_INESPERADO',
    )

    expect(adapterMock.timeEntryQuery.pull).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when the adapter fails to pull time entries', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Database timeout')

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.timeEntryQuery.pull as any).mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ERRO_INESPERADO',
    )
  })

  it('should return InternalServerError when sessionManager throws an exception', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Session storage corrupted')

    sessionManagerMock.getCurrentUser.mockImplementation(() => {
      throw error
    })

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ERRO_INESPERADO',
    )

    expect(dataSourceResolverMock.getDataSource).not.toHaveBeenCalled()
  })
})
