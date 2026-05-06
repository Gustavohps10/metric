import { AppError, Either } from '@metric-org/shared/helpers'

export interface MarkWorkspaceAsConfiguredInput {
  workspaceId: string
}

export interface IMarkWorkspaceAsConfiguredUseCase {
  execute(
    input: MarkWorkspaceAsConfiguredInput,
  ): Promise<Either<AppError, void>>
}
