import {
  AppError,
  Either,
  NotFoundError,
} from '@metric-org/cross-cutting/helpers'

import { IWorkspacesRepository } from '@/contracts'
import {
  GetWorkspaceInput,
  IGetWorkspaceUseCase,
} from '@/contracts/use-cases/IGetWorkspaceUseCase'
import { toWorkspaceConnectionDTO, WorkspaceDTO } from '@/dtos'

export class GetWorkspaceService implements IGetWorkspaceUseCase {
  constructor(private readonly workspacesRepository: IWorkspacesRepository) {}

  public async execute(
    input: GetWorkspaceInput,
  ): Promise<Either<AppError, WorkspaceDTO>> {
    const workspace = await this.workspacesRepository.findById(
      input.workspaceId,
    )

    if (!workspace) {
      return Either.failure(NotFoundError.danger('WORKSPACE_NAO_ENCONTRADO'))
    }

    const workspaceDTO: WorkspaceDTO = {
      id: workspace.id,
      name: workspace.name,
      dataSourceConnections: workspace.dataSourceConnections.map(
        toWorkspaceConnectionDTO,
      ),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    }

    return Either.success(workspaceDTO)
  }
}
