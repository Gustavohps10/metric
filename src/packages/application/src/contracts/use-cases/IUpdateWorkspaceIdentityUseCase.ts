import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { FileData } from '@/contracts/infra'
import { WorkspaceDTO } from '@/dtos'

export type UpdateWorkspaceIdentityInput = {
  workspaceId: string
  name: string
  description?: string
  avatarFile?: FileData
  removeAvatar: boolean
}

export interface IUpdateWorkspaceIdentityUseCase {
  execute(
    input: UpdateWorkspaceIdentityInput,
  ): Promise<Either<AppError, WorkspaceDTO>>
}
