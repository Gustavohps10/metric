import { AppError, Either } from '@metric-org/shared/helpers'

import { PagedResultDTO, WorkspaceDTO } from '@/dtos'

export interface IListWorkspacesUseCase {
  execute(): Promise<Either<AppError, PagedResultDTO<WorkspaceDTO>>>
}
