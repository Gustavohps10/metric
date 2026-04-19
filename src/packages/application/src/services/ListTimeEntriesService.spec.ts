import type { Mock, Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ITimeEntryQuery } from '@/contracts/data'
import type { IDataSourceResolver } from '@/contracts/resolvers'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { ListTimeEntriesInput } from '@/contracts/use-cases/IListTimeEntriesUseCase'
import type { PagedResultDTO, TimeEntryDTO } from '@/dtos'

import { ListTimeEntriesService } from './ListTimeEntriesService'

describe('ListTimeEntriesService', () => {
  let sut: ListTimeEntriesService

  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let findByMemberIdMock: Mock<ITimeEntryQuery['findByMemberId']>
  let adapterMock: IDataSourceAdapter

  const makeInput = (): ListTimeEntriesInput => ({
    workspaceId: 'workspace-1',
    pluginId: 'plugin-1',
    connectionInstanceId: 'conn-1',
    memberId: 'member-1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  })

  const makePagedResult = (): PagedResultDTO<TimeEntryDTO> => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    findByMemberIdMock = vi.fn()

    adapterMock = {
      timeEntryQuery: {
        findByMemberId: findByMemberIdMock,
      } as Partial<ITimeEntryQuery> as ITimeEntryQuery,
    } as Partial<IDataSourceAdapter> as IDataSourceAdapter

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
      getDataSourcesForWorkspace: vi.fn(),
      getConfigFields: vi.fn(),
    }

    sut = new ListTimeEntriesService(dataSourceResolverMock)
  })

  it('should resolve data source and return time entries', async () => {
    // Arrange
    const input = makeInput()
    const fakeResult = makePagedResult()

    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    findByMemberIdMock.mockResolvedValue(fakeResult)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(dataSourceResolverMock.getDataSource).toHaveBeenCalledWith(
      input.workspaceId,
      input.pluginId,
      input.connectionInstanceId,
    )

    expect(findByMemberIdMock).toHaveBeenCalledWith(
      input.memberId,
      input.startDate,
      input.endDate,
    )

    expect(result.isSuccess()).toBe(true)
  })

  it('should return failure when resolver throws', async () => {
    // Arrange
    const input = makeInput()

    dataSourceResolverMock.getDataSource.mockRejectedValue(
      new Error('resolver error'),
    )

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(findByMemberIdMock).not.toHaveBeenCalled()
  })

  it('should return failure when adapter query throws', async () => {
    // Arrange
    const input = makeInput()

    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    findByMemberIdMock.mockRejectedValue(new Error('query error'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(dataSourceResolverMock.getDataSource).toHaveBeenCalledOnce()
    expect(findByMemberIdMock).toHaveBeenCalledOnce()
  })
})
