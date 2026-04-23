import { AppError } from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ITimeEntryQuery } from '@/contracts/data/queries'
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
  let timeEntryQueryMock: Mocked<ITimeEntryQuery>

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
      task: { id: 'task-1' },
      activity: { id: 'act-1', name: 'Development' },
      user: { id: 'session-user-id', name: 'Jane Doe' },
      timeSpent: 3600,
      comments: 'Worked on authentication',
      createdAt: fakeDate,
      updatedAt: fakeDate,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    sessionManagerMock = {
      getCurrentUser: vi.fn(),
    } as unknown as Mocked<SessionManager>

    timeEntryQueryMock = {
      pull: vi.fn(),
    } as unknown as Mocked<ITimeEntryQuery>

    adapterMock = {
      timeEntryQuery: timeEntryQueryMock,
    } as unknown as Mocked<IDataSourceAdapter>

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
    } as unknown as Mocked<IDataSourceResolver>

    sut = new TimeEntriesPullService(sessionManagerMock, dataSourceResolverMock)
  })

  it('should pull time entries using the provided memberId from input', async () => {
    // Arrange
    const input = makeInput('explicit-member-id')

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    timeEntryQueryMock.pull.mockResolvedValue(fakeTimeEntries)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeTimeEntries)

    expect(timeEntryQueryMock.pull).toHaveBeenCalledWith(
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
    timeEntryQueryMock.pull.mockResolvedValue(fakeTimeEntries)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(timeEntryQueryMock.pull).toHaveBeenCalledWith(
      fakeSessionUser.id,
      input.checkpoint,
      input.batch,
    )
  })

  it('should return Unauthorized error if both input memberId and session user are missing/empty', async () => {
    // Arrange
    const input = makeInput('')
    sessionManagerMock.getCurrentUser.mockReturnValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('Usuário não autenticado.')

    expect(dataSourceResolverMock.getDataSource).not.toHaveBeenCalled()
  })

  it('should return Internal error when the data source resolver throws an exception', async () => {
    // Arrange
    const input = makeInput()
    dataSourceResolverMock.getDataSource.mockRejectedValue(new Error('Fail'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('ERRO_INESPERADO')
  })

  it('should return Internal error when the adapter fails to pull time entries', async () => {
    // Arrange
    const input = makeInput()
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    timeEntryQueryMock.pull.mockRejectedValue(new Error('Timeout'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('ERRO_INESPERADO')
  })
})
