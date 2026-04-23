import { AppError } from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IMetadataQuery } from '@/contracts/data/queries'
import type { IDataSourceResolver } from '@/contracts/resolvers'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { PullMetadataInput } from '@/contracts/use-cases/IMetadataPullUseCase'
import type { MetadataDTO } from '@/dtos'

import { MetadataPullService } from './MetadataPullService'

describe('MetadataPullService', () => {
  let sut: MetadataPullService

  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Mocked<IDataSourceAdapter>
  let metadataQueryMock: Mocked<IMetadataQuery>

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
    ],
    taskPriorities: [],
    activities: [],
    trackStatuses: [],
    participantRoles: [],
    estimationTypes: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    metadataQueryMock = {
      getMetadata: vi.fn(),
    } as unknown as Mocked<IMetadataQuery>

    adapterMock = {
      metadataQuery: metadataQueryMock,
    } as unknown as Mocked<IDataSourceAdapter>

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
    } as unknown as Mocked<IDataSourceResolver>

    sut = new MetadataPullService(dataSourceResolverMock)
  })

  it('should resolve the data source, pull metadata, and return it successfully', async () => {
    // Arrange
    const input = makeInput()
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    metadataQueryMock.getMetadata.mockResolvedValue(fakeMetadata)

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
    expect(metadataQueryMock.getMetadata).toHaveBeenCalledWith(
      input.memberId,
      input.checkpoint,
      input.batch,
    )
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
    expect(result.failure.messageKey).toBe('Failed to pull metadata')
  })

  it('should return Internal error when the adapter fails to pull metadata', async () => {
    // Arrange
    const input = makeInput()
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    metadataQueryMock.getMetadata.mockRejectedValue(new Error('API Error'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('Failed to pull metadata')
  })
})
