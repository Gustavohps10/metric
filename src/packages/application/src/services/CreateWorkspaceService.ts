import {
  AppError,
  Either,
  InternalServerError,
} from '@timelapse/cross-cutting/helpers'
import { Workspace } from '@timelapse/domain'

import {
  CreateWorkspaceInput,
  ICreateWorkspaceUseCase,
  IWorkspacesRepository,
} from '@/contracts'
import { toWorkspaceConnectionDTO, WorkspaceDTO } from '@/dtos'

export class CreateWorkspaceService implements ICreateWorkspaceUseCase {
  constructor(private readonly workspacesRepository: IWorkspacesRepository) {}

  public async execute({
    name,
  }: CreateWorkspaceInput): Promise<Either<AppError, WorkspaceDTO>> {
    try {
      const workspace = Workspace.create(name)

      await this.workspacesRepository.create(workspace)

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
    } catch (error: unknown) {
      return Either.failure(
        InternalServerError.danger('ALGO DEU ERRADO AO CRIAR WORKSPACE'),
      )
    }
  }
}
