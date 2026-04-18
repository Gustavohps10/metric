import { InternalServerError } from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IDataSourceResolver } from '@/contracts/resolvers'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { PullTasksInput } from '@/contracts/use-cases'
import type { TaskDTO } from '@/dtos'
import { SessionManager } from '@/workflow'

import { TaskPullService } from './TaskPullService'

describe('TaskPullService', () => {
  let sut: TaskPullService

  let sessionManagerMock: Mocked<SessionManager>
  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Mocked<IDataSourceAdapter>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (): PullTasksInput => ({
    workspaceId: 'workspace-123',
    pluginId: 'plugin-xyz',
    connectionInstanceId: 'conn-abc',
    memberId: 'fallback-member-id',
    checkpoint: {
      updatedAt: fakeDate,
      id: 'task-last-sync-1',
    },
    batch: 50,
  })

  const fakeSessionUser = {
    id: 'session-user-id',
    name: 'John Doe',
  }

  const fakeTasks: TaskDTO[] = [
    {
      id: 'task-1',
      title: 'Fix auth bug',
      status: { id: 'status-1', name: 'To Do' },
      createdAt: fakeDate,
      updatedAt: fakeDate,
    },
    {
      id: 'task-2',
      title: 'Update database schema',
      status: { id: 'status-2', name: 'In Progress' },
      createdAt: fakeDate,
      updatedAt: fakeDate,
    },
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
      taskQuery: {
        pull: vi.fn(),
      },
    } as unknown as Mocked<IDataSourceAdapter>

    sut = new TaskPullService(sessionManagerMock, dataSourceResolverMock)
  })

  it('should resolve data source, pull tasks using session user ID, and return them successfully', async () => {
    // Arrange
    const input = makeInput()

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.taskQuery.pull as any).mockResolvedValue(fakeTasks)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeTasks)

    expect(sessionManagerMock.getCurrentUser).toHaveBeenCalledWith(
      input.workspaceId,
      input.connectionInstanceId,
    )
    expect(dataSourceResolverMock.getDataSource).toHaveBeenCalledWith(
      input.workspaceId,
      input.pluginId,
      input.connectionInstanceId,
    )
    expect(adapterMock.taskQuery.pull).toHaveBeenCalledWith(
      fakeSessionUser.id,
      input.checkpoint,
      input.batch,
    )
  })

  it('should pull tasks using the fallback memberId from input if session user is not found', async () => {
    // Arrange
    const input = makeInput()

    sessionManagerMock.getCurrentUser.mockReturnValue(undefined)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.taskQuery.pull as any).mockResolvedValue(fakeTasks)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeTasks)

    expect(adapterMock.taskQuery.pull).toHaveBeenCalledWith(
      input.memberId,
      input.checkpoint,
      input.batch,
    )
  })

  it('should return InternalServerError when the data source resolver throws an exception', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Plugin not found')

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

    expect(adapterMock.taskQuery.pull).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when the adapter fails to pull tasks', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('API Rate Limit Exceeded')

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.taskQuery.pull as any).mockRejectedValue(error)

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
