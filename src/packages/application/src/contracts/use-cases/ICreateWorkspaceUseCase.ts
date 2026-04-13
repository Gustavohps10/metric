import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { WorkspaceDTO } from '@/dtos'

export type CreateWorkspaceInput = {
  name: string
}

export interface ICreateWorkspaceUseCase {
  execute(input: CreateWorkspaceInput): Promise<Either<AppError, WorkspaceDTO>>
}
