import {
  AppError,
  Either,
  InternalServerError,
  NotFoundError,
} from '@metric-org/cross-cutting/helpers'

import {
  DisconnectDataSourceInput,
  ICredentialsStorage,
  IDisconnectDataSourceUseCase,
  IWorkspacesRepository,
} from '@/contracts'
import { getMemberStorageKey } from '@/credentials-storage-keys'

export class DisconnectDataSourceService implements IDisconnectDataSourceUseCase {
  constructor(
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly credentialsStorage: ICredentialsStorage,
  ) {}

  public async execute(
    input: DisconnectDataSourceInput,
  ): Promise<Either<AppError, void>> {
    try {
      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )

      if (!workspace) {
        return Either.failure(NotFoundError.danger('WORKSPACE_NAO_ENCONTRADO'))
      }

      const storageKey = `workspace-session-${input.workspaceId}-${input.connectionInstanceId}`
      const memberKey = getMemberStorageKey(
        input.workspaceId,
        input.connectionInstanceId,
      )

      await this.credentialsStorage.deleteToken('metric', storageKey)
      await this.credentialsStorage.deleteToken('metric', memberKey)

      const result = workspace.disconnectDataSource(input.connectionInstanceId)

      if (result.isFailure()) {
        return result.forwardFailure()
      }

      await this.workspacesRepository.update(workspace)

      return Either.success(undefined)
    } catch (error: unknown) {
      return Either.failure(InternalServerError.danger('ERRO_AO_DESCONECTAR'))
    }
  }
}
