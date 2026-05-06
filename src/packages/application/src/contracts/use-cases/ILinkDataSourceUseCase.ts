import { AppError, Either } from '@metric-org/shared/helpers'

import { WorkspaceDTO } from '@/dtos'

export type LinkDataSourceInput = {
  workspaceId: string
  connectionInstanceId: string
  dataSourceId: string
}

export interface ILinkDataSourceUseCase {
  execute(input: LinkDataSourceInput): Promise<Either<AppError, WorkspaceDTO>>
}
