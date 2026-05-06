import { AppError, Either } from '@metric-org/shared/helpers'

import {
  ICredentialsStorage,
  IUnlinkDataSourceUseCase,
  IWorkspacesRepository,
  UnlinkDataSourceInput,
} from '@/contracts'
import { getMemberStorageKey } from '@/credentials-storage-keys'
import { toWorkspaceConnectionDTO, WorkspaceDTO } from '@/dtos'

export class UnlinkDataSourceService implements IUnlinkDataSourceUseCase {
  constructor(
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly credentialsStorage: ICredentialsStorage,
  ) {}

  public async execute(
    input: UnlinkDataSourceInput,
  ): Promise<Either<AppError, WorkspaceDTO>> {
    try {
      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )

      if (!workspace) {
        return Either.failure(AppError.NotFound('WORKSPACE_NAO_ENCONTRADO'))
      }

      if (input.connectionInstanceId) {
        await this.clearConnectionCredentials(
          input.workspaceId,
          input.connectionInstanceId,
        )
      } else {
        const clearPromises = workspace.dataSourceConnections.map((conn) =>
          this.clearConnectionCredentials(workspace.id, conn.id),
        )
        await Promise.all(clearPromises)
      }

      const result = workspace.unlinkDataSource(input.connectionInstanceId)
      if (result.isFailure()) return result.forwardFailure()

      await this.workspacesRepository.update(workspace)

      const workspaceDTO: WorkspaceDTO = {
        id: workspace.id,
        name: workspace.name,
        status: workspace.status,
        dataSourceConnections: workspace.dataSourceConnections.map(
          toWorkspaceConnectionDTO,
        ),
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      }

      return Either.success(workspaceDTO)
    } catch (error) {
      return Either.failure(AppError.Internal('ERRO_INESPERADO'))
    }
  }

  private async clearConnectionCredentials(
    workspaceId: string,
    connectionInstanceId: string,
  ): Promise<void> {
    const sessionKey = `workspace-session-${workspaceId}-${connectionInstanceId}`
    await this.credentialsStorage.deleteToken('metric', sessionKey)
    await this.credentialsStorage.deleteToken(
      'metric',
      getMemberStorageKey(workspaceId, connectionInstanceId),
    )
  }
}
