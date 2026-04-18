import { InternalServerError } from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IDataSourceResolver } from '@/contracts/resolvers'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { PullMetadataInput } from '@/contracts/use-cases/IMetadataPullUseCase'
import type { MetadataDTO } from '@/dtos/MetadataDTO'

import { MetadataPullService } from './MetadataPullService'

describe('MetadataPullService', () => {
  let sut: MetadataPullService

  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Mocked<IDataSourceAdapter>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  const makeInput = (): PullMetadataInput => ({
    workspaceId: 'workspace-123',
    pluginId: 'plugin-xyz',
    connectionInstanceId: 'conn-abc',
    memberId: 'member-789',
    checkpoint: {
      updatedAt: fakeDate,
      id: 'last-sync-123',
    },
    batch: 100,
  })

  const fakeMetadata: MetadataDTO = {
    taskStatuses: [
      {
        id: 'status-1',
        name: 'To Do',
        icon: 'circle',
        colors: {
          badge: '#cccccc',
          background: '#ffffff',
          text: '#333333',
        },
      },
      {
        id: 'status-2',
        name: 'In Progress',
        icon: 'play',
        colors: {
          badge: '#0052cc',
          background: '#deebff',
          text: '#0052cc',
          border: '#0052cc',
        },
      },
    ],
    taskPriorities: [
      {
        id: 'priority-1',
        name: 'High',
        icon: 'arrow-up',
        colors: {
          badge: '#ff5630',
          background: '#ffebe6',
          text: '#ff5630',
        },
      },
    ],
    activities: [],
    trackStatuses: [],
    participantRoles: [],
    estimationTypes: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
    } as Partial<IDataSourceResolver> as Mocked<IDataSourceResolver>

    adapterMock = {
      metadataQuery: {
        getMetadata: vi.fn(),
      },
    } as unknown as Mocked<IDataSourceAdapter>

    sut = new MetadataPullService(dataSourceResolverMock)
  })

  it('should resolve the data source, pull metadata, and return it successfully', async () => {
    // Arrange
    const input = makeInput()

    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.metadataQuery.getMetadata as any).mockResolvedValue(
      fakeMetadata,
    )

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeMetadata)

    expect(dataSourceResolverMock.getDataSource).toHaveBeenCalledWith(
      input.workspaceId,
      input.pluginId,
      input.connectionInstanceId,
    )
    expect(adapterMock.metadataQuery.getMetadata).toHaveBeenCalledWith(
      input.memberId,
      input.checkpoint,
      input.batch,
    )
  })

  it('should return InternalServerError when the data source resolver throws an exception', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Plugin resolution failed')

    dataSourceResolverMock.getDataSource.mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'Failed to pull metadata',
    )

    expect(adapterMock.metadataQuery.getMetadata).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when the adapter fails to pull metadata', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('API Rate Limit Exceeded')

    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.metadataQuery.getMetadata as any).mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'Failed to pull metadata',
    )
  })
})
