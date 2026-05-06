import { AppError, Either } from '@metric-org/shared/helpers'

import { IWorkspacesRepository } from '@/contracts'
import {
  ILinkDataSourceUseCase,
  LinkDataSourceInput,
} from '@/contracts/use-cases/ILinkDataSourceUseCase'
import { toWorkspaceConnectionDTO, WorkspaceDTO } from '@/dtos'

export class LinkDataSourceService implements ILinkDataSourceUseCase {
  constructor(private readonly workspacesRepository: IWorkspacesRepository) {}

  public async execute(
    input: LinkDataSourceInput,
  ): Promise<Either<AppError, WorkspaceDTO>> {
    try {
      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )

      if (!workspace) {
        return Either.failure(AppError.NotFound('WORKSPACE_NAO_ENCONTRADO'))
      }

      const linkResult = workspace.linkDataSource(
        input.connectionInstanceId,
        input.dataSourceId,
      )

      if (linkResult.isFailure()) return linkResult.forwardFailure()

      await this.workspacesRepository.update(workspace)

      const workspaceDTO: WorkspaceDTO = {
        id: workspace.id,
        name: workspace.name,
        avatarUrl: workspace.avatarUrl,
        status: workspace.status,
        description: workspace.description,
        dataSourceConnections: workspace.dataSourceConnections.map(
          toWorkspaceConnectionDTO,
        ),
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      }

      return Either.success(workspaceDTO)
    } catch {
      return Either.failure(AppError.NotFound('ERRO_INESPERADO'))
    }
  }
}
