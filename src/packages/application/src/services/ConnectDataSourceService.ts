import {
  AppError,
  Either,
  InternalServerError,
  NotFoundError,
} from '@timelapse/cross-cutting/helpers'

import {
  ConnectDataSourceInput,
  IConnectDataSourceUseCase,
  ICredentialsStorage,
  IDataSourceResolver,
  IJWTService,
  IWorkspacesRepository,
} from '@/contracts'
import { getMemberStorageKey } from '@/credentials-storage-keys'
import { AuthenticationDTO } from '@/dtos'

export class ConnectDataSourceService implements IConnectDataSourceUseCase {
  constructor(
    private readonly jwtService: IJWTService,
    private readonly credentialsStorage: ICredentialsStorage,
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly dataSourceResolver: IDataSourceResolver,
  ) {}

  public async execute<
    Credentials,
    Configuration extends Record<string, unknown>,
  >(
    input: ConnectDataSourceInput<Credentials, Configuration>,
  ): Promise<Either<AppError, AuthenticationDTO>> {
    try {
      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )

      if (!workspace) {
        return Either.failure(NotFoundError.danger('WORKSPACE_NAO_ENCONTRADO'))
      }

      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.pluginId,
        input.connectionInstanceId,
        {
          config: input.configuration,
          credentials: input.credentials as Record<string, unknown>,
        },
      )

      const authResult = await adapter.authenticationStrategy.authenticate({
        configuration: input.configuration,
        credentials: input.credentials,
      })

      if (authResult.isFailure()) {
        return authResult.forwardFailure()
      }

      const { member, credentials } = authResult.success
      const serializedCredentials = JSON.stringify(credentials)

      const storageKey = `workspace-session-${input.workspaceId}-${input.connectionInstanceId}`
      const memberKey = getMemberStorageKey(
        input.workspaceId,
        input.connectionInstanceId,
      )

      await this.credentialsStorage.saveToken(
        'timelapse',
        storageKey,
        serializedCredentials,
      )

      await this.credentialsStorage.saveToken(
        'timelapse',
        memberKey,
        JSON.stringify(member),
      )

      const connectResult = workspace.connectDataSource(
        input.connectionInstanceId,
        input.configuration as Record<string, unknown>,
      )

      if (connectResult.isFailure()) {
        return connectResult.forwardFailure()
      }

      await this.workspacesRepository.update(workspace)

      const token = await this.jwtService.generateToken({
        id: member.id.toString(),
        name: `${member.firstname} ${member.lastname}`,
        workspaceId: input.workspaceId,
        connectionInstanceId: input.connectionInstanceId,
      })

      return Either.success<AuthenticationDTO>({ member, token })
    } catch (error: unknown) {
      const storageKey = `workspace-session-${input.workspaceId}-${input.connectionInstanceId}`
      const memberKey = getMemberStorageKey(
        input.workspaceId,
        input.connectionInstanceId,
      )

      await this.credentialsStorage.deleteToken('timelapse', storageKey)
      await this.credentialsStorage.deleteToken('timelapse', memberKey)

      return Either.failure(
        InternalServerError.danger('ERRO_AO_CONECTAR_DATA_SOURCE'),
      )
    }
  }
}
