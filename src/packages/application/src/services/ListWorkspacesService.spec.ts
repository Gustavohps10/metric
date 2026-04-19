import { InternalServerError } from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IWorkspacesQuery } from '@/contracts/data/queries'
import type { WorkspaceDTO } from '@/dtos'
import type { PagedResultDTO } from '@/dtos/pagination' // Ajuste o path se necessário

import { ListWorkspacesService } from './ListWorkspacesService'

describe('ListWorkspacesService', () => {
  let sut: ListWorkspacesService

  let workspacesQueryMock: Mocked<IWorkspacesQuery>

  const fakeDate = new Date('2026-04-18T00:00:00.000Z')

  // Estrutura do PagedResultDTO baseada na sua definição
  const fakeWorkspacesPage: PagedResultDTO<WorkspaceDTO> = {
    items: [
      {
        id: 'workspace-1',
        name: 'Metric Development',
        dataSourceConnections: [],
        createdAt: fakeDate,
        updatedAt: fakeDate,
      },
      {
        id: 'workspace-2',
        name: 'Metric Production',
        dataSourceConnections: [],
        createdAt: fakeDate,
        updatedAt: fakeDate,
      },
    ],
    total: 2,
    page: 1,
    pageSize: 10,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    workspacesQueryMock = {
      findAll: vi.fn(),
    } as Partial<IWorkspacesQuery> as Mocked<IWorkspacesQuery>

    sut = new ListWorkspacesService(workspacesQueryMock)
  })

  it('should fetch all workspaces and return a paginated result successfully', async () => {
    // Arrange
    workspacesQueryMock.findAll.mockResolvedValue(fakeWorkspacesPage)

    // Act
    const result = await sut.execute()

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeWorkspacesPage)

    expect(workspacesQueryMock.findAll).toHaveBeenCalledTimes(1)
  })

  it('should return InternalServerError when the query throws an exception', async () => {
    // Arrange
    const error = new Error('Database connection timeout')
    workspacesQueryMock.findAll.mockRejectedValue(error)

    // Act
    const result = await sut.execute()

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ERRO_INESPERADO',
    )

    expect(workspacesQueryMock.findAll).toHaveBeenCalledTimes(1)
  })
})
