import {
  AppError,
  Either,
  InternalServerError,
  NotFoundError,
} from '@timelapse/cross-cutting/helpers'

import {
  ICredentialsStorage,
  IUnlinkDataSourceUseCase,
  IWorkspacesRepository,
  UnlinkDataSourceInput,
} from '@/contracts'
import { WorkspaceDTO } from '@/dtos'

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
        return Either.failure(NotFoundError.danger('Workspace não encontrado'))
      }

      if (input.dataSourceId) {
        const storageKey = `workspace-session-${input.workspaceId}-${input.dataSourceId}`
        await this.credentialsStorage.deleteToken('timelapse', storageKey)
      }

      const result = workspace.unlinkDataSource(input.dataSourceId)
      if (result.isFailure()) return result.forwardFailure()

      await this.workspacesRepository.update(workspace)

      const workspaceDTO: WorkspaceDTO = {
        id: workspace.id,
        name: workspace.name,
        dataSource: workspace.dataSource,
        dataSourceConfiguration: workspace.dataSourceConfiguration,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      }

      return Either.success(workspaceDTO)
    } catch (error) {
      return Either.failure(InternalServerError.danger('ERRO_INESPERADO'))
    }
  }
}
