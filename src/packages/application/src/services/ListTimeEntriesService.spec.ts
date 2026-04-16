import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IDataSourceResolver } from '@/contracts/resolvers'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { ListTimeEntriesInput } from '@/contracts/use-cases/IListTimeEntriesUseCase'
import type { PagedResultDTO, TimeEntryDTO } from '@/dtos'

import { ListTimeEntriesService } from './ListTimeEntriesService'

type FindByMemberIdFn = (
  memberId: string,
  startDate: Date,
  endDate: Date,
) => Promise<PagedResultDTO<TimeEntryDTO>>

describe('ListTimeEntriesService', () => {
  let sut: ListTimeEntriesService

  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Partial<IDataSourceAdapter>
  let findByMemberIdMock: ReturnType<typeof vi.fn<FindByMemberIdFn>>

  beforeEach(() => {
    // Arrange
    findByMemberIdMock = vi.fn<FindByMemberIdFn>()

    adapterMock = {
      timeEntryQuery: {
        findByMemberId: findByMemberIdMock,
      } as unknown as IDataSourceAdapter['timeEntryQuery'],
    }

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
      getDataSourcesForWorkspace: vi.fn(),
      getConfigFields: vi.fn(),
    }

    sut = new ListTimeEntriesService(dataSourceResolverMock)
  })

  function makeInput(): ListTimeEntriesInput {
    return {
      workspaceId: 'workspace-1',
      pluginId: 'plugin-1',
      connectionInstanceId: 'conn-1',
      memberId: 'member-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    }
  }

  function makePagedResult(): PagedResultDTO<TimeEntryDTO> {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }
  }

  it('should resolve data source and return time entries', async () => {
    // Arrange
    const input = makeInput()
    const fakeResult = makePagedResult()

    dataSourceResolverMock.getDataSource.mockResolvedValue(
      adapterMock as IDataSourceAdapter,
    )
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
  })

  it('should return failure when adapter query throws', async () => {
    // Arrange
    const input = makeInput()

    dataSourceResolverMock.getDataSource.mockResolvedValue(
      adapterMock as IDataSourceAdapter,
    )

    findByMemberIdMock.mockRejectedValue(new Error('query error'))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
  })
})
