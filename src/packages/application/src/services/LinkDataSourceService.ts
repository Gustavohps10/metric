import {
  AppError,
  Either,
  InternalServerError,
  NotFoundError,
} from '@timelapse/cross-cutting/helpers'

import { IWorkspacesRepository } from '@/contracts'
import {
  ILinkDataSourceUseCase,
  LinkDataSourceInput,
} from '@/contracts/use-cases/ILinkDataSourceUseCase'
import { WorkspaceDTO } from '@/dtos'

export class LinkDataSourceService implements ILinkDataSourceUseCase {
  constructor(private readonly workspacesRepository: IWorkspacesRepository) {}

  public async execute(
    input: LinkDataSourceInput,
  ): Promise<Either<AppError, WorkspaceDTO>> {
    try {
      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )

      if (workspace == null)
        return Either.failure(NotFoundError.danger('WORKSPACE_NAO_ENCONTRADO'))

      workspace.linkDataSource(input.dataSource)

      await this.workspacesRepository.update(workspace)

      const conns = workspace.dataSourceConnections
      const workspaceDTO: WorkspaceDTO = {
        id: workspace.id,
        name: workspace.name,
        dataSource: workspace.dataSource,
        dataSourceConfiguration: workspace.dataSourceConfiguration,
        dataSourceConnections:
          conns?.length > 0
            ? conns.map((c) => ({ id: c.id, config: c.config }))
            : undefined,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      }

      return Either.success(workspaceDTO)
    } catch (error) {
      return Either.failure(InternalServerError.danger('ERRO_INESPERADO'))
    }
  }
}
