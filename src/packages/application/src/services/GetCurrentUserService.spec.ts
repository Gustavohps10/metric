import { AppError } from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  GetCurrentUserInput,
  IDataSourceResolver,
  IWorkspacesRepository,
} from '@/contracts'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { MemberDTO } from '@/dtos'
import { SessionManager } from '@/workflow'

import { GetCurrentUserService } from './GetCurrentUserService'

describe('GetCurrentUserService', () => {
  let sut: GetCurrentUserService

  let sessionManagerMock: Mocked<SessionManager>
  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let dataSourceResolverMock: Mocked<IDataSourceResolver>
  let adapterMock: Mocked<IDataSourceAdapter>
  let fakeWorkspace: Mocked<Workspace>

  const makeInput = (): GetCurrentUserInput => ({
    workspaceId: 'workspace-123',
    connectionInstanceId: 'conn-abc',
  })

  const fakeSessionUser = {
    id: 'user-789',
    name: 'John Doe',
  }

  const fakeMemberDTO: MemberDTO = {
    id: 789,
    firstname: 'John',
    lastname: 'Doe',
    login: 'test-user',
    admin: false,
    custom_fields: [{ id: 123, name: 'chave', value: 'valor' }],
    created_on: Date.now().toLocaleString(),
    last_login_on: Date.now().toLocaleString(),
    api_key: '123',
    // email: 'john.doe@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    sessionManagerMock = {
      getCurrentUser: vi.fn(),
    } as Partial<SessionManager> as Mocked<SessionManager>

    workspacesRepositoryMock = {
      findById: vi.fn(),
    } as Partial<IWorkspacesRepository> as Mocked<IWorkspacesRepository>

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
    } as Partial<IDataSourceResolver> as Mocked<IDataSourceResolver>

    adapterMock = {
      memberQuery: {
        findById: vi.fn(),
      },
    } as unknown as Mocked<IDataSourceAdapter>

    fakeWorkspace = {
      id: 'workspace-123',
      dataSourceConnections: [
        {
          id: 'conn-abc',
          dataSourceId: 'plugin-1',
        },
      ],
    } as Partial<Workspace> as Mocked<Workspace>

    sut = new GetCurrentUserService(
      sessionManagerMock,
      workspacesRepositoryMock,
      dataSourceResolverMock,
    )
  })

  it('should return the current user successfully', async () => {
    // Arrange
    const input = makeInput()

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.memberQuery.findById as any).mockResolvedValue(fakeMemberDTO)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual(fakeMemberDTO)

    expect(sessionManagerMock.getCurrentUser).toHaveBeenCalledWith(
      input.workspaceId,
      input.connectionInstanceId,
    )
    expect(workspacesRepositoryMock.findById).toHaveBeenCalledWith(
      input.workspaceId,
    )
    expect(dataSourceResolverMock.getDataSource).toHaveBeenCalledWith(
      input.workspaceId,
      'plugin-1',
      input.connectionInstanceId,
    )
    expect(adapterMock.memberQuery.findById).toHaveBeenCalledWith(
      fakeSessionUser.id,
    )
  })

  it('should return UnauthorizedError when user is not in session', async () => {
    // Arrange
    const input = makeInput()
    sessionManagerMock.getCurrentUser.mockReturnValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('USUARIO_NAO_LOGADO')

    expect(workspacesRepositoryMock.findById).not.toHaveBeenCalled()
  })

  it('should return NotFoundError when workspace is not found', async () => {
    // Arrange
    const input = makeInput()
    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    workspacesRepositoryMock.findById.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('WORKSPACE_NAO_ENCONTRADO')
  })

  it('should return NotFoundError when connection instance is not found in workspace', async () => {
    // Arrange
    const input = makeInput()
    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)

    // Simulando um workspace sem a conexão solicitada
    const workspaceWithoutConnection = {
      ...fakeWorkspace,
      dataSourceConnections: [],
    } as unknown as Mocked<Workspace>

    workspacesRepositoryMock.findById.mockResolvedValue(
      workspaceWithoutConnection,
    )

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('CONEXAO_NAO_ENCONTRADA_OU_INVALIDA')

    expect(dataSourceResolverMock.getDataSource).not.toHaveBeenCalled()
  })

  it('should return NotFoundError when user is not found in the external data source (adapter)', async () => {
    // Arrange
    const input = makeInput()

    sessionManagerMock.getCurrentUser.mockReturnValue(fakeSessionUser as any)
    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)
    ;(adapterMock.memberQuery.findById as any).mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('USUARIO_NAO_ENCONTRADO')
  })

  it('should return InternalServerError when an exception is thrown', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Unexpected adapter failure')

    sessionManagerMock.getCurrentUser.mockImplementation(() => {
      throw error
    })

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(AppError)
    expect(result.failure.messageKey).toBe('ERRO_AO_OBTER_USUARIO')
  })
})
