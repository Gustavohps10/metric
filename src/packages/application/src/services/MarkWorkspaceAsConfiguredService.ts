import { AppError, Either } from '@metric-org/shared/helpers'

import { IWorkspacesRepository } from '@/contracts'
import {
  IMarkWorkspaceAsConfiguredUseCase,
  MarkWorkspaceAsConfiguredInput,
} from '@/contracts/use-cases/IMarkWorkspaceAsConfiguredUseCase'

export class MarkWorkspaceAsConfiguredService implements IMarkWorkspaceAsConfiguredUseCase {
  constructor(private readonly workspacesRepository: IWorkspacesRepository) {}

  public async execute(
    input: MarkWorkspaceAsConfiguredInput,
  ): Promise<Either<AppError, void>> {
    const workspace = await this.workspacesRepository.findById(
      input.workspaceId,
    )

    if (!workspace)
      return Either.failure(
        AppError.ValidationError('Workspace nao encontrado'),
      )

    workspace.markAsConfigured()

    await this.workspacesRepository.update(workspace)

    return Either.success()
  }
}
