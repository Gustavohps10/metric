import {
  Either,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from '@metric-org/cross-cutting/helpers'
import { Workspace } from '@metric-org/domain'
import type { Mocked } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ConnectDataSourceInput,
  ICredentialsStorage,
  IDataSourceResolver,
  IJWTService,
  IWorkspacesRepository,
} from '@/contracts'
import type { IDataSourceAdapter } from '@/contracts/resolvers/IDataSourceAdapter'
import type { IAuthenticationStrategy } from '@/contracts/strategies'

import { getMemberStorageKey } from '../credentials-storage-keys'
import { ConnectDataSourceService } from './ConnectDataSourceService'

describe('ConnectDataSourceService', () => {
  let sut: ConnectDataSourceService

  let jwtServiceMock: Mocked<IJWTService>
  let credentialsStorageMock: Mocked<ICredentialsStorage>
  let workspacesRepositoryMock: Mocked<IWorkspacesRepository>
  let dataSourceResolverMock: Mocked<IDataSourceResolver>

  let authenticationStrategyMock: Mocked<IAuthenticationStrategy>
  let adapterMock: IDataSourceAdapter
  let fakeWorkspace: Mocked<Workspace>

  const fakeMember = {
    id: 'member-123',
    firstname: 'John',
    lastname: 'Doe',
  }

  const fakeCredentials = {
    accessToken: 'external-abc',
  }

  const makeInput = (): ConnectDataSourceInput<
    unknown,
    Record<string, unknown>
  > => ({
    workspaceId: 'workspace-1',
    pluginId: 'plugin-1',
    connectionInstanceId: 'conn-1',
    credentials: { token: 'raw-token' },
    configuration: { host: 'localhost' },
  })

  beforeEach(() => {
    vi.clearAllMocks()

    jwtServiceMock = {
      generateToken: vi.fn(),
      tokenIsValid: vi.fn(),
      decodeToken: vi.fn(),
    } as Partial<IJWTService> as Mocked<IJWTService>

    credentialsStorageMock = {
      saveToken: vi.fn(),
      deleteToken: vi.fn(),
      getToken: vi.fn(),
      hasToken: vi.fn(),
      replaceToken: vi.fn(),
    } as Partial<ICredentialsStorage> as Mocked<ICredentialsStorage>

    workspacesRepositoryMock = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Partial<IWorkspacesRepository> as Mocked<IWorkspacesRepository>

    dataSourceResolverMock = {
      getDataSource: vi.fn(),
      getDataSourcesForWorkspace: vi.fn(),
      getConfigFields: vi.fn(),
    } as Partial<IDataSourceResolver> as Mocked<IDataSourceResolver>

    authenticationStrategyMock = {
      authenticate: vi.fn(),
    } as Partial<IAuthenticationStrategy> as Mocked<IAuthenticationStrategy>

    adapterMock = {
      authenticationStrategy: authenticationStrategyMock,
    } as Partial<IDataSourceAdapter> as IDataSourceAdapter

    fakeWorkspace = {
      id: 'workspace-1',
      connectDataSource: vi.fn(),
    } as Partial<Workspace> as Mocked<Workspace>

    sut = new ConnectDataSourceService(
      jwtServiceMock,
      credentialsStorageMock,
      workspacesRepositoryMock,
      dataSourceResolverMock,
    )
  })

  it('should authenticate, save credentials, update workspace and return a token successfully', async () => {
    // Arrange
    const input = makeInput()
    const expectedToken = 'metric-jwt-token-123'

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)

    authenticationStrategyMock.authenticate.mockResolvedValue(
      Either.success({
        member: fakeMember as any,
        credentials: fakeCredentials,
      }),
    )

    fakeWorkspace.connectDataSource.mockReturnValue(Either.success(undefined))
    jwtServiceMock.generateToken.mockReturnValue(expectedToken)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(result.success).toEqual({
      member: fakeMember,
      token: expectedToken,
    })

    const storageKey = `workspace-session-${input.workspaceId}-${input.connectionInstanceId}`
    const memberKey = getMemberStorageKey(
      input.workspaceId,
      input.connectionInstanceId,
    )

    expect(credentialsStorageMock.saveToken).toHaveBeenCalledWith(
      'metric',
      storageKey,
      JSON.stringify(fakeCredentials),
    )
    expect(credentialsStorageMock.saveToken).toHaveBeenCalledWith(
      'metric',
      memberKey,
      JSON.stringify(fakeMember),
    )

    expect(fakeWorkspace.connectDataSource).toHaveBeenCalledWith(
      input.connectionInstanceId,
      input.configuration,
    )
    expect(workspacesRepositoryMock.update).toHaveBeenCalledWith(fakeWorkspace)

    expect(jwtServiceMock.generateToken).toHaveBeenCalledWith({
      id: fakeMember.id,
      name: `${fakeMember.firstname} ${fakeMember.lastname}`,
      workspaceId: input.workspaceId,
      connectionInstanceId: input.connectionInstanceId,
    })
  })

  it('should return NotFoundError when workspace does not exist', async () => {
    // Arrange
    const input = makeInput()
    workspacesRepositoryMock.findById.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(NotFoundError)
    expect((result.failure as NotFoundError).messageKey).toBe(
      'WORKSPACE_NAO_ENCONTRADO',
    )

    expect(dataSourceResolverMock.getDataSource).not.toHaveBeenCalled()
  })

  it('should return failure when authentication strategy fails', async () => {
    // Arrange
    const input = makeInput()
    const authError = InternalServerError.danger('AUTH_FAILED')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)

    authenticationStrategyMock.authenticate.mockResolvedValue(
      Either.failure(authError),
    )

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(authError)

    expect(credentialsStorageMock.saveToken).not.toHaveBeenCalled()
    expect(fakeWorkspace.connectDataSource).not.toHaveBeenCalled()
  })

  it('should return failure when workspace entity rejects data source connection', async () => {
    // Arrange
    const input = makeInput()
    const domainError = ValidationError.danger('CONNECTION_ALREADY_EXISTS')

    workspacesRepositoryMock.findById.mockResolvedValue(fakeWorkspace)
    dataSourceResolverMock.getDataSource.mockResolvedValue(adapterMock)

    authenticationStrategyMock.authenticate.mockResolvedValue(
      Either.success({
        member: fakeMember as any,
        credentials: fakeCredentials,
      }),
    )

    fakeWorkspace.connectDataSource.mockReturnValue(Either.failure(domainError))

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(domainError)

    expect(workspacesRepositoryMock.update).not.toHaveBeenCalled()
  })

  it('should delete storage tokens and return InternalServerError when an exception is thrown', async () => {
    // Arrange
    const input = makeInput()
    const error = new Error('Database connection lost')

    workspacesRepositoryMock.findById.mockRejectedValue(error)

    // Act
    const result = await sut.execute(input)

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'ERRO_AO_CONECTAR_DATA_SOURCE',
    )

    const storageKey = `workspace-session-${input.workspaceId}-${input.connectionInstanceId}`
    const memberKey = getMemberStorageKey(
      input.workspaceId,
      input.connectionInstanceId,
    )

    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledTimes(2)
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      storageKey,
    )
    expect(credentialsStorageMock.deleteToken).toHaveBeenCalledWith(
      'metric',
      memberKey,
    )
  })
})
