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
    const workspace = await this.workspacesRepository.findById(
      input.workspaceId,
    )
    if (!workspace) {
      return Either.failure(NotFoundError.danger('Workspace não encontrado'))
    }

    const adapter = await this.dataSourceResolver.getDataSource(
      input.workspaceId,
      input.dataSourceId,
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
    const storageKey = `workspace-session-${input.workspaceId}-${input.dataSourceId}`

    try {
      await this.credentialsStorage.saveToken(
        'timelapse',
        storageKey,
        serializedCredentials,
      )
      await this.credentialsStorage.saveToken(
        'timelapse',
        getMemberStorageKey(input.workspaceId, input.dataSourceId),
        JSON.stringify(member),
      )

      const connectResult = workspace.connectDataSource(
        input.configuration as Record<string, unknown>,
        input.dataSourceId,
      )

      if (connectResult.isFailure()) {
        throw new Error(connectResult.failure.messageKey)
      }

      await this.workspacesRepository.update(workspace)

      const token = await this.jwtService.generateToken({
        id: member.id.toString(),
        name: `${member.firstname} ${member.lastname}`,
        workspaceId: input.workspaceId,
      })

      return Either.success<AuthenticationDTO>({ member, token })
    } catch (error) {
      await this.credentialsStorage.deleteToken(
        'timelapse',
        `workspace-session-${input.workspaceId}-${input.dataSourceId}`,
      )
      await this.credentialsStorage.deleteToken(
        'timelapse',
        getMemberStorageKey(input.workspaceId, input.dataSourceId),
      )
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro inesperado ao conectar a fonte de dados.'
      return Either.failure(InternalServerError.danger(errorMessage))
    }
  }
}
