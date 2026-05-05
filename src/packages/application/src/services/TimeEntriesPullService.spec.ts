import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ITimeEntryQuery } from '@/contracts/data/queries'
import type { IDataSourceResolver } from '@/contracts/resolvers'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { PullTimeEntriesInput } from '@/contracts/use-cases'
import type { TimeEntryDTO } from '@/dtos'

import { TimeEntriesPullService } from './TimeEntriesPullService'

describe('TimeEntriesPullService', () => {
  let sut: TimeEntriesPullService

  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Mocked<IDataSourceAdapter>
  let timeEntryQueryMock: Mocked<ITimeEntryQuery>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (): PullTimeEntriesInput => ({
    workspaceId: 'workspace-123',
    pluginId: 'plugin-xyz',
    memberId: '',
    connectionInstanceId: 'conn-abc',
    checkpoint: {
      updatedAt: fakeDate,
      id: 'time-entry-sync-1',
    },
    batch: 100,
  })

  const fakeMember = {
    id: 'member-123',
    firstname: 'John',
    lastname: 'Doe',
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

    timeEntryQueryMock = {
      pull: vi.fn(),
    } as unknown as Mocked<ITimeEntryQuery>

    adapterMock = {
      timeEntryQuery: timeEntryQueryMock,
      getAuthenticatedMemberData: vi.fn(),
    } as unknown as Mocked<IDataSourceAdapter>

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
    } as unknown as Mocked<IDataSourceResolver>

    sut = new TimeEntriesPullService(dataSourceResolverMock)
  })

  it('should successfully pull time entries using the authenticated member from the adapter', async () => {
    // Arrange
    const input = makeInput()

    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    adapterMock.getAuthenticatedMemberData.mockResolvedValue(
      Either.success(fakeMember as any),
    )
    timeEntryQueryMock.pull.mockResolvedValue(fakeTimeEntries)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeTimeEntries)

    expect(adapterMock.getAuthenticatedMemberData).toHaveBeenCalled()
    expect(timeEntryQueryMock.pull).toHaveBeenCalledWith(
      fakeMember.id,
      input.checkpoint,
      input.batch,
    )
  })

  it('should forward the failure if getAuthenticatedMemberData returns a failure', async () => {
    // Arrange
    const input = makeInput()
    const authError = AppError.Unauthorized('FALHA_DE_AUTENTICACAO')

    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    adapterMock.getAuthenticatedMemberData.mockResolvedValue(
      Either.failure(authError),
    )

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(authError)

    expect(timeEntryQueryMock.pull).not.toHaveBeenCalled()
  })

  it('should return unexpected error when the data source resolver throws an exception', async () => {
    // Arrange
    const input = makeInput()
    dataSourceResolverMock.getDataSource.mockRejectedValue(new Error('Fail'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('ERRO_INESPERADO')
    // Verifica se retornou NotFound como implementado no service
    expect(result.failure.statusCode).toBe(404)
  })

  it('should return unexpected error when the adapter fails to pull time entries (throws)', async () => {
    // Arrange
    const input = makeInput()
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    adapterMock.getAuthenticatedMemberData.mockResolvedValue(
      Either.success(fakeMember as any),
    )
    timeEntryQueryMock.pull.mockRejectedValue(new Error('Timeout'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('ERRO_INESPERADO')
  })
})
