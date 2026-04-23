import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import {
  DeleteWorkspaceInput,
  IDeleteWorkspaceUseCase,
  IFileStorage,
  IWorkspacesRepository,
} from '@/contracts'

export class DeleteWorkspaceService implements IDeleteWorkspaceUseCase {
  constructor(
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly fileStorage: IFileStorage,
  ) {}

  public async execute({
    workspaceId,
  }: DeleteWorkspaceInput): Promise<Either<AppError, void>> {
    try {
      const workspace = await this.workspacesRepository.findById(workspaceId)

      if (!workspace) {
        return Either.failure(AppError.NotFound('WORKSPACE_NAO_ENCONTRADO'))
      }

      if (workspace.avatarUrl) {
        const avatarPath = `workspaces/avatars/${workspace.id}.png`
        await this.fileStorage.delete(avatarPath, true)
      }

      await this.workspacesRepository.delete(workspaceId)

      return Either.success()
    } catch (err) {
      return Either.failure(AppError.Internal('ERRO_AO_DELETAR_WORKSPACE'))
    }
  }
}
