import {
  AppError,
  Either,
  NotFoundError,
} from '@timelapse/cross-cutting/helpers'

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
    const workspace = await this.workspacesRepository.findById(
      input.workspaceId,
    )
    if (!workspace) {
      return Either.failure(NotFoundError.danger('Workspace não encontrado'))
    }

    const storageKey = `workspace-session-${input.workspaceId}-${input.dataSourceId}`
    await this.credentialsStorage.deleteToken('timelapse', storageKey)
    await this.credentialsStorage.deleteToken(
      'timelapse',
      getMemberStorageKey(input.workspaceId, input.dataSourceId),
    )

    const result = workspace.disconnectDataSource(input.dataSourceId)
    if (result.isFailure()) return result.forwardFailure()

    await this.workspacesRepository.update(workspace)
    return Either.success(undefined)
  }
}
